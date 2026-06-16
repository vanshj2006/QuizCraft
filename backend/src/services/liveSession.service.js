/**
 * Live Session Service
 * Manages in-memory session state and all business logic for live quiz sessions.
 * MongoDB is the persistence layer; the in-memory Map is the hot-path store.
 */

import LiveSession from '../models/LiveSession.model.js';
import Quiz from '../models/Quiz.model.js';
import { generateSessionCode } from '../utils/generateCode.js';

// ─── In-Memory State ─────────────────────────────────────────────────────────
/**
 * SessionState shape:
 * {
 *   questions: Question[],        // populated at host:start, possibly shuffled
 *   sessionDuration: number,      // seconds
 *   expiresAt: number,            // ms timestamp (Date.now() + sessionDuration * 1000)
 *   timerHandle: NodeJS.Timeout,
 *   locked: boolean,              // true after expiry — no more answers accepted
 *   participants: Map<socketId, ParticipantState>
 * }
 *
 * ParticipantState shape:
 * {
 *   userId: string | null,
 *   name: string,
 *   currentQuestionIndex: number,
 *   answers: Map<questionIndex, AnswerRecord>,
 *   score: number,
 *   streak: number,
 * }
 */
const sessions = new Map(); // code → SessionState

export function getInMemoryState(code) {
  return sessions.get(code) || null;
}

// ─── Session Creation ─────────────────────────────────────────────────────────

export async function createSession(hostId, quizId, settings, sessionDuration, isPublic) {
  const quiz = await Quiz.findOne({ _id: quizId, createdBy: hostId });
  if (!quiz) {
    const err = new Error('Quiz not found or does not belong to you');
    err.statusCode = 404;
    throw err;
  }

  // Ensure unique code
  let code;
  let attempts = 0;
  do {
    code = generateSessionCode();
    attempts++;
    if (attempts > 20) throw new Error('Could not generate a unique session code');
  } while (await LiveSession.exists({ code }));

  const session = await LiveSession.create({
    code,
    quiz: quizId,
    host: hostId,
    isPublic: !!isPublic,
    sessionDuration,
    settings: {
      timePerQuestion: settings?.timePerQuestion ?? 30,
      shuffleQuestions: settings?.shuffleQuestions ?? false,
    },
    status: 'waiting',
  });

  quiz.liveSessionCode = code;
  quiz.liveSessionActive = true;
  await quiz.save();

  return { session, code };
}

// ─── Session Expiry ───────────────────────────────────────────────────────────

export function scheduleExpiry(code, sessionDuration, io) {
  const ms = sessionDuration * 1000;
  const handle = setTimeout(async () => {
    await expireSession(code, io);
  }, ms);

  const state = sessions.get(code);
  if (state) {
    state.timerHandle = handle;
    state.expiresAt = Date.now() + ms;
  }
}

export async function expireSession(code, io) {
  const state = sessions.get(code);
  if (!state || state.locked) return;
  state.locked = true;

  // Emit per-participant full result breakdown
  for (const [socketId, p] of state.participants) {
    const results = buildAnswerResults(state.questions, p.answers);
    io.to(socketId).emit('quiz:answer_result', { results });
  }

  // Broadcast session end to all connected clients
  io.to(code).emit('session:ended', { reason: 'timer_expired' });

  // Persist finished status to DB
  try {
    await LiveSession.findOneAndUpdate({ code }, { status: 'finished' });
    await Quiz.findOneAndUpdate(
      { liveSessionCode: code },
      { liveSessionActive: false, $unset: { liveSessionCode: '' } }
    );
  } catch (err) {
    console.error('Error persisting session expiry:', err.message);
  }

  sessions.delete(code);
}

// ─── Participant Management ───────────────────────────────────────────────────

export async function upsertParticipant(code, socketId, userId, name) {
  const session = await LiveSession.findOne({ code });
  if (!session) {
    const err = new Error('Session not found');
    err.statusCode = 404;
    throw err;
  }

  let state = sessions.get(code);

  // Find or create DB participant
  let dbParticipant = userId
    ? session.participants.find((p) => p.user?.toString() === userId)
    : session.participants.find((p) => p.socketId === socketId);

  if (dbParticipant) {
    dbParticipant.socketId = socketId;
  } else {
    session.participants.push({
      user: userId || undefined,
      guestName: name || 'Guest',
      socketId,
      isReady: false,
    });
    dbParticipant = session.participants[session.participants.length - 1];
  }
  await session.save();

  // Sync in-memory state — create entry if session is active
  if (state) {
    // Check if already tracked by userId
    let existingKey = null;
    for (const [sid, p] of state.participants) {
      if (userId && p.userId === userId) { existingKey = sid; break; }
    }

    if (existingKey && existingKey !== socketId) {
      // Move existing participant state to new socketId
      const existing = state.participants.get(existingKey);
      state.participants.delete(existingKey);
      existing.name = name || existing.name;
      state.participants.set(socketId, existing);
    } else if (!state.participants.has(socketId)) {
      state.participants.set(socketId, {
        userId: userId || null,
        name: name || 'Guest',
        currentQuestionIndex: dbParticipant.currentQuestionIndex || 0,
        answers: new Map(),
        score: dbParticipant.score || 0,
        streak: dbParticipant.streak || 0,
      });
    }
  }

  return {
    session,
    participant: dbParticipant,
  };
}

export async function setParticipantReady(code, socketId) {
  const session = await LiveSession.findOne({ code });
  if (!session) return [];

  const p = session.participants.find((p) => p.socketId === socketId);
  if (p) {
    p.isReady = true;
    await session.save();
  }
  return session.participants;
}

// ─── Session Start ────────────────────────────────────────────────────────────

export async function startSession(code, io) {
  const session = await LiveSession.findOne({ code }).populate({
    path: 'quiz',
    populate: { path: 'questions' },
  });
  if (!session) throw new Error('Session not found');

  let questions = [...session.quiz.questions];
  if (session.settings.shuffleQuestions) {
    questions = questions.sort(() => Math.random() - 0.5);
  }

  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + session.sessionDuration * 1000);

  session.status = 'active';
  session.startedAt = startedAt;
  session.expiresAt = expiresAt;
  session.currentQuestionIndex = 0;
  session.questionStartTime = startedAt;
  await session.save();

  // Initialize in-memory state
  const participantsMap = new Map();
  for (const p of session.participants) {
    participantsMap.set(p.socketId, {
      userId: p.user?.toString() || null,
      name: p.guestName || 'Guest',
      currentQuestionIndex: 0,
      answers: new Map(),
      score: 0,
      streak: 0,
    });
  }

  sessions.set(code, {
    questions,
    sessionDuration: session.sessionDuration,
    expiresAt: expiresAt.getTime(),
    timerHandle: null,
    locked: false,
    participants: participantsMap,
  });

  // Schedule expiry
  scheduleExpiry(code, session.sessionDuration, io);

  // Broadcast first question to all clients
  const q = questions[0];
  io.to(code).emit('quiz:question', {
    index: 0,
    total: questions.length,
    question: {
      _id: q._id,
      stem: q.stem,
      options: q.options,
      points: q.points,
      timeLimit: session.settings.timePerQuestion,
    },
    startTime: startedAt.getTime(),
  });

  return { questions, expiresAt };
}

// ─── Question Navigation ──────────────────────────────────────────────────────

export async function setParticipantIndex(code, socketId, newIndex) {
  const state = sessions.get(code);
  if (!state) return null;

  const p = state.participants.get(socketId);
  if (!p) return null;

  const total = state.questions.length;

  // Clamp: ignore backwards past 0
  if (newIndex < 0) return { boundary: 'start' };

  // Past last question → finished
  if (newIndex >= total) {
    // Compute final leaderboard at this moment
    const leaderboard = computeLeaderboard(code);
    const allParticipants = [...state.participants.values()];
    const sorted = [...allParticipants].sort((a, b) => b.score - a.score);
    const myRank = sorted.findIndex((pt) => pt.userId === p.userId || pt.name === p.name) + 1;

    return {
      finished: true,
      finalLeaderboard: leaderboard,
      myStats: {
        rank: myRank,
        score: p.score,
        correct: [...p.answers.values()].filter((a) => a.isCorrect).length,
      },
    };
  }

  p.currentQuestionIndex = newIndex;

  // Persist to DB (fire-and-forget)
  LiveSession.updateOne(
    { code, 'participants.socketId': socketId },
    { $set: { 'participants.$.currentQuestionIndex': newIndex } }
  ).catch((err) => console.error('Error persisting questionIndex:', err.message));

  const q = state.questions[newIndex];
  const previousAnswerRecord = p.answers.get(newIndex);

  return {
    index: newIndex,
    total,
    question: {
      _id: q._id,
      stem: q.stem,
      options: q.options,
      points: q.points,
      timeLimit: state.sessionDuration ? undefined : 30, // timePerQuestion is in session settings
    },
    previousAnswer: previousAnswerRecord ? previousAnswerRecord.answer : null,
  };
}

// We need timePerQuestion from the session settings — let's add a helper
export async function getSessionSettings(code) {
  const session = await LiveSession.findOne({ code }, 'settings');
  return session?.settings || { timePerQuestion: 30 };
}

// ─── Answer Recording ─────────────────────────────────────────────────────────

export function recordAnswer(code, socketId, questionIndex, answer, timeTaken, timePerQuestion) {
  const state = sessions.get(code);
  if (!state) return { error: 'Session not found' };
  if (state.locked) return { error: 'Session has ended, answers are locked' };

  const p = state.participants.get(socketId);
  if (!p) return { error: 'Participant not found' };

  const question = state.questions[questionIndex];
  if (!question) return { error: 'Question not found' };

  const isCorrect = question.correctAnswer === answer;
  const tpq = timePerQuestion || 30;
  const rawBonus = Math.floor(Math.max(0, tpq - timeTaken) * 2);
  const points = isCorrect ? (question.points || 10) + rawBonus : 0;

  // Overwrite previous answer for this question
  const prev = p.answers.get(questionIndex);
  p.answers.set(questionIndex, { answer, isCorrect, timeTaken, points });

  // Recalculate total score from all answers
  let totalScore = 0;
  for (const rec of p.answers.values()) totalScore += rec.points;
  p.score = totalScore;

  // Update streak
  if (isCorrect) {
    p.streak += 1;
  } else {
    p.streak = 0;
  }

  // Persist to DB (fire-and-forget)
  _persistAnswer(code, socketId, questionIndex, answer, isCorrect, timeTaken, points, p.score, p.streak);

  return { acknowledged: true, questionIndex };
}

async function _persistAnswer(code, socketId, questionIndex, answer, isCorrect, timeTaken, points, score, streak) {
  try {
    const session = await LiveSession.findOne({ code });
    if (!session) return;
    const p = session.participants.find((pt) => pt.socketId === socketId);
    if (!p) return;

    const existing = p.answers.find((a) => a.questionIndex === questionIndex);
    if (existing) {
      existing.answer = answer;
      existing.isCorrect = isCorrect;
      existing.timeTaken = timeTaken;
      existing.points = points;
    } else {
      p.answers.push({ questionIndex, answer, isCorrect, timeTaken, points });
    }
    p.score = score;
    p.streak = streak;
    await session.save();
  } catch (err) {
    console.error('Error persisting answer:', err.message);
  }
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export function computeLeaderboard(code) {
  const state = sessions.get(code);
  if (!state) return [];

  const entries = [];
  for (const [, p] of state.participants) {
    entries.push({ name: p.name, score: p.score, streak: p.streak });
  }

  return entries
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((e, i) => ({ ...e, rank: i + 1 }));
}

// ─── Answer Results (deferred reveal) ────────────────────────────────────────

export function buildAnswerResults(questions, answersMap) {
  const results = [];
  for (const [questionIndex, record] of answersMap) {
    const question = questions[questionIndex];
    if (!question) continue;
    results.push({
      questionIndex,
      isCorrect: record.isCorrect,
      correctAnswer: question.correctAnswer,
      points: record.points,
      submittedAnswer: record.answer,
      questionStem: question.stem,
      options: question.options,
    });
  }
  return results.sort((a, b) => a.questionIndex - b.questionIndex);
}

// ─── Manual Session End ───────────────────────────────────────────────────────

export async function endSession(code, io) {
  const state = sessions.get(code);
  if (state?.timerHandle) {
    clearTimeout(state.timerHandle);
  }
  await expireSession(code, io);
}

// ─── Server Startup Recovery ──────────────────────────────────────────────────

export async function recoverActiveSessions(io) {
  try {
    const now = new Date();
    const activeSessions = await LiveSession.find({
      status: 'active',
      expiresAt: { $gt: now },
    });

    for (const session of activeSessions) {
      const msRemaining = session.expiresAt.getTime() - Date.now();
      if (msRemaining <= 0) {
        await expireSession(session.code, io);
        continue;
      }

      // Rebuild minimal in-memory state (no participants — sockets reconnect and re-add)
      sessions.set(session.code, {
        questions: [], // will be repopulated when needed
        sessionDuration: session.sessionDuration,
        expiresAt: session.expiresAt.getTime(),
        timerHandle: null,
        locked: false,
        participants: new Map(),
      });

      const handle = setTimeout(async () => {
        await expireSession(session.code, io);
      }, msRemaining);

      sessions.get(session.code).timerHandle = handle;
      console.log(`🔄 Recovered session ${session.code} — expires in ${Math.round(msRemaining / 1000)}s`);
    }

    // Immediately expire any sessions that should already be finished
    const expiredSessions = await LiveSession.find({
      status: 'active',
      expiresAt: { $lte: now },
    });
    for (const session of expiredSessions) {
      await expireSession(session.code, io);
    }
  } catch (err) {
    console.error('Error recovering active sessions:', err.message);
  }
}
