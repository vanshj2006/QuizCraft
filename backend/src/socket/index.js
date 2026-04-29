import LiveSession from '../models/LiveSession.model.js';
import Quiz from '../models/Quiz.model.js';

export const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // ─── Join Lobby ───────────────────────────────────────────────────────────
    socket.on('lobby:join', async ({ code, userId, guestName }) => {
      try {
        const session = await LiveSession.findOne({ code }).populate('quiz');
        if (!session || session.status === 'finished') {
          return socket.emit('error', { message: 'Session not found or already ended' });
        }

        socket.join(code);
        socket.sessionCode = code;
        socket.userId = userId;

        // Add participant if not already in
        const existing = session.participants.find(
          (p) => (userId && p.user?.toString() === userId) || p.socketId === socket.id
        );

        if (!existing) {
          session.participants.push({
            user: userId || undefined,
            guestName: guestName || 'Guest',
            socketId: socket.id,
            isReady: false,
          });
          await session.save();
        } else {
          existing.socketId = socket.id;
          await session.save();
        }

        const participantCount = session.participants.length;
        io.to(code).emit('lobby:update', {
          participants: session.participants,
          count: participantCount,
        });

        socket.emit('lobby:joined', {
          session: {
            code: session.code,
            quizTitle: session.quiz?.title,
            status: session.status,
            settings: session.settings,
          },
        });

        io.to(code).emit('lobby:activity', {
          type: 'join',
          name: guestName || 'A user',
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ─── Participant Ready ────────────────────────────────────────────────────
    socket.on('lobby:ready', async ({ code }) => {
      try {
        const session = await LiveSession.findOne({ code });
        if (!session) return;
        const p = session.participants.find((p) => p.socketId === socket.id);
        if (p) { p.isReady = true; await session.save(); }
        io.to(code).emit('lobby:update', { participants: session.participants });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ─── Host: Start Quiz ─────────────────────────────────────────────────────
    socket.on('host:start', async ({ code }) => {
      try {
        const session = await LiveSession.findOne({ code }).populate({
          path: 'quiz',
          populate: { path: 'questions' },
        });
        if (!session) return;

        let questions = session.quiz.questions;
        if (session.settings.shuffleQuestions) {
          questions = [...questions].sort(() => Math.random() - 0.5);
        }

        session.status = 'active';
        session.currentQuestionIndex = 0;
        session.questionStartTime = new Date();
        await session.save();

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
          startTime: session.questionStartTime,
        });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ─── Participant: Submit Answer ───────────────────────────────────────────
    socket.on('quiz:answer', async ({ code, questionId, answer, timeTaken }) => {
      try {
        const session = await LiveSession.findOne({ code }).populate({
          path: 'quiz',
          populate: { path: 'questions' },
        });
        if (!session || session.status !== 'question') return;

        const questions = session.quiz.questions;
        const question = questions.find((q) => q._id.toString() === questionId);
        if (!question) return;

        const isCorrect = question.correctAnswer === answer;
        const timeBonus = Math.max(0, session.settings.timePerQuestion - timeTaken);
        const points = isCorrect ? question.points + Math.floor(timeBonus * 2) : 0;

        const participant = session.participants.find((p) => p.socketId === socket.id);
        if (participant) {
          const alreadyAnswered = participant.answers.find(
            (a) => a.questionIndex === session.currentQuestionIndex
          );
          if (!alreadyAnswered) {
            participant.answers.push({
              questionIndex: session.currentQuestionIndex,
              answer,
              isCorrect,
              timeTaken,
              points,
            });
            participant.score += points;
            if (isCorrect) participant.streak += 1;
            else participant.streak = 0;
            await session.save();
          }
        }

        socket.emit('quiz:answer_result', { isCorrect, points, correctAnswer: question.correctAnswer });

        // Broadcast updated leaderboard
        const leaderboard = session.participants
          .map((p) => ({ name: p.guestName || 'User', score: p.score, streak: p.streak }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);
        io.to(code).emit('quiz:leaderboard', { leaderboard });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ─── Host: Next Question ──────────────────────────────────────────────────
    socket.on('host:next', async ({ code }) => {
      try {
        const session = await LiveSession.findOne({ code }).populate({
          path: 'quiz',
          populate: { path: 'questions' },
        });
        if (!session) return;

        const questions = session.quiz.questions;
        const nextIndex = session.currentQuestionIndex + 1;

        if (nextIndex >= questions.length) {
          session.status = 'finished';
          await session.save();

          const finalLeaderboard = session.participants
            .map((p) => ({ name: p.guestName || 'User', score: p.score, streak: p.streak }))
            .sort((a, b) => b.score - a.score);

          io.to(code).emit('quiz:finished', { leaderboard: finalLeaderboard });
          return;
        }

        session.currentQuestionIndex = nextIndex;
        session.status = 'question';
        session.questionStartTime = new Date();
        await session.save();

        const q = questions[nextIndex];
        io.to(code).emit('quiz:question', {
          index: nextIndex,
          total: questions.length,
          question: {
            _id: q._id,
            stem: q.stem,
            options: q.options,
            points: q.points,
            timeLimit: session.settings.timePerQuestion,
          },
          startTime: session.questionStartTime,
        });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ─── Disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      try {
        if (socket.sessionCode) {
          const session = await LiveSession.findOne({ code: socket.sessionCode });
          if (session) {
            session.participants = session.participants.filter(
              (p) => p.socketId !== socket.id
            );
            await session.save();
            io.to(socket.sessionCode).emit('lobby:update', {
              participants: session.participants,
              count: session.participants.length,
            });
          }
        }
      } catch { /* ignore */ }
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};
