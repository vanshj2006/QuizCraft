import LiveSession from '../models/LiveSession.model.js';
import * as liveService from '../services/liveSession.service.js';

export const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // ─── Ping (latency probe) ─────────────────────────────────────────────────
    socket.on('ping', (cb) => {
      if (typeof cb === 'function') cb();
      else socket.emit('pong');
    });

    // ─── lobby:join ───────────────────────────────────────────────────────────
    socket.on('lobby:join', async ({ code, userId, guestName }) => {
      try {
        const normalizedCode = code?.replace(/-/g, ' ');

        // Fetch session from DB to check status
        const session = await LiveSession.findOne({ code: normalizedCode })
          .populate('quiz', 'title category')
          .populate('host', 'name avatar');

        if (!session) {
          return socket.emit('error', { message: 'Session not found or already ended' });
        }

        // Block entry if session already finished or timer already expired
        const now = Date.now();
        const isExpired = session.expiresAt && new Date(session.expiresAt).getTime() <= now;

        if (session.status === 'finished' || isExpired) {
          return socket.emit('session:ended', { reason: 'session_finished' });
        }

        // Add to Socket.io room
        socket.join(normalizedCode);
        socket.sessionCode = normalizedCode;
        socket.userId = userId;

        // Upsert participant in DB + in-memory state
        await liveService.upsertParticipant(normalizedCode, socket.id, userId, guestName || 'Guest');

        // Send session metadata to the joining socket
        socket.emit('lobby:joined', {
          session: {
            code: session.code,
            quizTitle: session.quiz?.title,
            status: session.status,
            settings: session.settings,
            hostId: session.host?._id?.toString(),
            expiresAt: session.expiresAt ? new Date(session.expiresAt).getTime() : null,
          },
        });

        // If session is already active, send the participant their current question
        const state = liveService.getInMemoryState(normalizedCode);
        if (state && session.status === 'active') {
          const participantState = state.participants.get(socket.id);
          const currentIndex = participantState?.currentQuestionIndex ?? 0;
          const q = state.questions[currentIndex];
          if (q) {
            const previousAnswer = participantState?.answers.get(currentIndex)?.answer || null;
            socket.emit('quiz:question', {
              index: currentIndex,
              total: state.questions.length,
              question: {
                _id: q._id,
                stem: q.stem,
                options: q.options,
                points: q.points,
                timeLimit: session.settings.timePerQuestion,
              },
              startTime: now, // approximate for late joiners
              previousAnswer,
            });
          }
        }

        // Broadcast updated participant list to room
        const updatedSession = await LiveSession.findOne({ code: normalizedCode });
        io.to(normalizedCode).emit('lobby:update', {
          participants: updatedSession.participants,
          count: updatedSession.participants.length,
        });

        // Broadcast join activity
        io.to(normalizedCode).emit('lobby:activity', {
          type: 'join',
          name: guestName || 'A user',
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error('lobby:join error:', err.message);
        socket.emit('error', { message: err.message });
      }
    });

    // ─── lobby:ready ──────────────────────────────────────────────────────────
    socket.on('lobby:ready', async ({ code }) => {
      try {
        const normalizedCode = code?.replace(/-/g, ' ');
        const participants = await liveService.setParticipantReady(normalizedCode, socket.id);
        io.to(normalizedCode).emit('lobby:update', { participants, count: participants.length });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ─── host:start ───────────────────────────────────────────────────────────
    socket.on('host:start', async ({ code }) => {
      try {
        const normalizedCode = code?.replace(/-/g, ' ');
        const session = await LiveSession.findOne({ code: normalizedCode });
        if (!session) return socket.emit('error', { message: 'Session not found' });

        // Only the host can start
        if (session.host.toString() !== socket.userId) {
          return socket.emit('error', { message: 'Only the host can start the quiz' });
        }

        await liveService.startSession(normalizedCode, io);
      } catch (err) {
        console.error('host:start error:', err.message);
        socket.emit('error', { message: err.message });
      }
    });

    // ─── participant:next ─────────────────────────────────────────────────────
    socket.on('participant:next', async ({ code }) => {
      try {
        const normalizedCode = code?.replace(/-/g, ' ');
        const state = liveService.getInMemoryState(normalizedCode);
        if (!state) return;

        const p = state.participants.get(socket.id);
        if (!p) return;

        const newIndex = p.currentQuestionIndex + 1;
        const result = await liveService.setParticipantIndex(normalizedCode, socket.id, newIndex);

        if (!result) return;

        if (result.finished) {
          socket.emit('quiz:finished', {
            finalLeaderboard: result.finalLeaderboard,
            myStats: result.myStats,
          });
          return;
        }

        if (result.boundary === 'start') return; // shouldn't happen for next

        // Fetch timePerQuestion from session settings
        const session = await LiveSession.findOne({ code: normalizedCode }, 'settings');
        socket.emit('quiz:question', {
          index: result.index,
          total: result.total,
          question: {
            _id: result.question._id,
            stem: result.question.stem,
            options: result.question.options,
            points: result.question.points,
            timeLimit: session?.settings?.timePerQuestion || 30,
          },
          startTime: Date.now(),
          previousAnswer: result.previousAnswer,
        });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ─── participant:prev ─────────────────────────────────────────────────────
    socket.on('participant:prev', async ({ code }) => {
      try {
        const normalizedCode = code?.replace(/-/g, ' ');
        const state = liveService.getInMemoryState(normalizedCode);
        if (!state) return;

        const p = state.participants.get(socket.id);
        if (!p) return;

        const newIndex = p.currentQuestionIndex - 1;
        const result = await liveService.setParticipantIndex(normalizedCode, socket.id, newIndex);

        if (!result || result.boundary === 'start') return; // silently ignore at first question

        const session = await LiveSession.findOne({ code: normalizedCode }, 'settings');
        socket.emit('quiz:question', {
          index: result.index,
          total: result.total,
          question: {
            _id: result.question._id,
            stem: result.question.stem,
            options: result.question.options,
            points: result.question.points,
            timeLimit: session?.settings?.timePerQuestion || 30,
          },
          startTime: Date.now(),
          previousAnswer: result.previousAnswer,
        });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ─── quiz:answer ──────────────────────────────────────────────────────────
    socket.on('quiz:answer', async ({ code, questionIndex, answer, timeTaken }) => {
      try {
        const normalizedCode = code?.replace(/-/g, ' ');

        // Fetch timePerQuestion
        const session = await LiveSession.findOne({ code: normalizedCode }, 'settings');
        const timePerQuestion = session?.settings?.timePerQuestion || 30;

        const result = liveService.recordAnswer(
          normalizedCode,
          socket.id,
          questionIndex,
          answer,
          timeTaken,
          timePerQuestion
        );

        if (result.error) {
          return socket.emit('error', { message: result.error });
        }

        // Acknowledge receipt — NO correctness info during active session
        socket.emit('quiz:answer_ack', { questionIndex: result.questionIndex });

        // Recompute and broadcast leaderboard to all room members
        const leaderboard = liveService.computeLeaderboard(normalizedCode);
        io.to(normalizedCode).emit('quiz:leaderboard', { leaderboard });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ─── host:end ─────────────────────────────────────────────────────────────
    socket.on('host:end', async ({ code }) => {
      try {
        const normalizedCode = code?.replace(/-/g, ' ');
        const session = await LiveSession.findOne({ code: normalizedCode });
        if (!session) return;
        if (session.host.toString() !== socket.userId) {
          return socket.emit('error', { message: 'Only the host can end the session' });
        }
        await liveService.endSession(normalizedCode, io);
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ─── disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      try {
        const code = socket.sessionCode;
        if (code) {
          // Remove from in-memory state
          const state = liveService.getInMemoryState(code);
          if (state) {
            state.participants.delete(socket.id);
          }

          // Only broadcast lobby:update while session is waiting (pre-start)
          const session = await LiveSession.findOne({ code });
          if (session && session.status === 'waiting') {
            // Remove from DB participants too (pre-start only)
            session.participants = session.participants.filter((p) => p.socketId !== socket.id);
            await session.save();

            io.to(code).emit('lobby:update', {
              participants: session.participants,
              count: session.participants.length,
            });

            io.to(code).emit('lobby:activity', {
              type: 'leave',
              name: 'A user',
              timestamp: new Date().toISOString(),
            });
          }
          // During active session: keep DB record for reconnection matching
        }
      } catch { /* ignore disconnect errors */ }
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};
