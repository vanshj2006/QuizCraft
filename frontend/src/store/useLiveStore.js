import { create } from 'zustand';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '/';

const initialState = {
  socket: null,
  sessionCode: null,
  sessionMeta: null,        // { quizTitle, status, settings, hostId, expiresAt }
  participants: [],
  activityFeed: [],

  // Per-participant play state
  currentQuestion: null,
  questionIndex: 0,
  questionTotal: 0,
  questionStartTime: null,
  selectedAnswer: null,     // label chosen on the currently displayed question
  submittedAnswers: {},     // { [questionIndex]: { answer, acknowledged } }
  leaderboard: [],

  // Session-level timer
  sessionExpiresAt: null,   // ms timestamp — from server's expiresAt
  sessionLocked: false,     // true after quiz:answer_result received (timer expired)

  // Post-session
  results: null,            // { finalLeaderboard, myStats, perQuestion }
  sessionEnded: false,

  // Error feedback
  errorMessage: null,
};

export const useLiveStore = create((set, get) => ({
  ...initialState,

  // ─── connect ────────────────────────────────────────────────────────────────
  connect: (code, user, navigate) => {
    const existing = get().socket;
    if (existing?.connected) return; // already connected

    const socket = io(SOCKET_URL, { withCredentials: true });

    socket.on('connect', () => {
      socket.emit('lobby:join', {
        code,
        userId: user?._id,
        guestName: user?.name || 'Guest',
      });
    });

    // ── lobby events ──────────────────────────────────────────────────────────
    socket.on('lobby:joined', ({ session }) => {
      set({
        sessionCode: session.code,
        sessionMeta: session,
        sessionExpiresAt: session.expiresAt || null,
      });
    });

    socket.on('lobby:update', ({ participants }) => {
      set({ participants: participants || [] });
    });

    socket.on('lobby:activity', (event) => {
      set((state) => ({
        activityFeed: [event, ...state.activityFeed].slice(0, 10),
      }));
    });

    // ── quiz events ───────────────────────────────────────────────────────────
    socket.on('quiz:question', ({ index, total, question, startTime, previousAnswer }) => {
      const { submittedAnswers } = get();

      // If server sent previousAnswer for a revisited question, record it
      const updatedAnswers = { ...submittedAnswers };
      if (previousAnswer && !updatedAnswers[index]) {
        updatedAnswers[index] = { answer: previousAnswer, acknowledged: true };
      }

      set({
        currentQuestion: question,
        questionIndex: index,
        questionTotal: total,
        questionStartTime: startTime,
        selectedAnswer: updatedAnswers[index]?.answer || null,
        submittedAnswers: updatedAnswers,
      });
    });

    socket.on('quiz:answer_ack', ({ questionIndex }) => {
      set((state) => ({
        submittedAnswers: {
          ...state.submittedAnswers,
          [questionIndex]: {
            ...state.submittedAnswers[questionIndex],
            acknowledged: true,
          },
        },
      }));
    });

    socket.on('quiz:leaderboard', ({ leaderboard }) => {
      set({ leaderboard: leaderboard || [] });
    });

    socket.on('quiz:finished', ({ finalLeaderboard, myStats }) => {
      set({
        results: {
          finalLeaderboard: finalLeaderboard || [],
          myStats: myStats || {},
          perQuestion: null, // will be populated by quiz:answer_result
        },
      });
      const code = get().sessionCode || get().sessionMeta?.code;
      if (navigate && code) {
        const slug = code.replace(/\s+/g, '-');
        navigate(`/live/${slug}/results`);
      }
    });

    socket.on('quiz:answer_result', ({ results }) => {
      set((state) => ({
        sessionLocked: true,
        results: state.results
          ? { ...state.results, perQuestion: results }
          : { finalLeaderboard: [], myStats: {}, perQuestion: results },
      }));
    });

    socket.on('session:ended', () => {
      set({ sessionEnded: true, sessionLocked: true });
      if (navigate) navigate('/dashboard');
    });

    socket.on('error', ({ message }) => {
      console.error('[LiveStore] socket error:', message);
      set({ errorMessage: message });
      setTimeout(() => set({ errorMessage: null }), 4000);
    });

    set({ socket });
  },

  // ─── disconnect ──────────────────────────────────────────────────────────────
  disconnect: () => {
    const { socket } = get();
    if (socket) socket.disconnect();
    set({ ...initialState });
  },

  // ─── lobby actions ────────────────────────────────────────────────────────────
  sendLobbyReady: () => {
    const { socket, sessionCode } = get();
    socket?.emit('lobby:ready', { code: sessionCode });
  },

  sendHostStart: () => {
    const { socket, sessionCode } = get();
    socket?.emit('host:start', { code: sessionCode });
  },

  // ─── quiz navigation ──────────────────────────────────────────────────────────
  goNext: () => {
    const { socket, sessionCode } = get();
    socket?.emit('participant:next', { code: sessionCode });
  },

  goPrev: () => {
    const { socket, sessionCode } = get();
    socket?.emit('participant:prev', { code: sessionCode });
  },

  // ─── answer submission ────────────────────────────────────────────────────────
  sendAnswer: (questionIndex, answer, timeTaken) => {
    const { socket, sessionCode, sessionLocked } = get();
    if (sessionLocked) return; // don't send if locked

    // Optimistic update — show selected option immediately
    set((state) => ({
      selectedAnswer: answer,
      submittedAnswers: {
        ...state.submittedAnswers,
        [questionIndex]: { answer, acknowledged: false },
      },
    }));

    socket?.emit('quiz:answer', {
      code: sessionCode,
      questionIndex,
      answer,
      timeTaken,
    });
  },

  // ─── host end session ─────────────────────────────────────────────────────────
  endSession: () => {
    const { socket, sessionCode } = get();
    socket?.emit('host:end', { code: sessionCode });
  },

  // ─── clear error ─────────────────────────────────────────────────────────────
  clearError: () => set({ errorMessage: null }),
}));
