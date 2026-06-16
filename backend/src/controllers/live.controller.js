import * as liveSessionService from '../services/liveSession.service.js';
import LiveSession from '../models/LiveSession.model.js';

// ─── POST /api/live/session ────────────────────────────────────────────────────
export const createSession = async (req, res) => {
  try {
    const { quizId, settings, isPublic = false, sessionDuration } = req.body;

    // sessionDuration is required and must be a positive integer
    if (!sessionDuration || !Number.isInteger(Number(sessionDuration)) || Number(sessionDuration) <= 0) {
      return res.status(400).json({ message: 'sessionDuration is required and must be a positive integer (seconds)' });
    }

    const { session, code } = await liveSessionService.createSession(
      req.user._id,
      quizId,
      settings,
      Number(sessionDuration),
      isPublic
    );

    res.status(201).json({ session, code });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message });
  }
};

// ─── GET /api/live/public ─────────────────────────────────────────────────────
// Public — no auth required
export const getPublicSessions = async (req, res) => {
  try {
    const sessions = await LiveSession.find({
      isPublic: true,
      status: { $in: ['waiting', 'active'] },
    })
      .populate('quiz', 'title category')
      .populate('host', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/live/join/:code ─────────────────────────────────────────────────
// Public — used by join page for preview
export const getSessionPublic = async (req, res) => {
  try {
    const code = req.params.code.replace(/-/g, ' ');
    const session = await LiveSession.findOne({ code })
      .populate('quiz', 'title category')
      .populate('host', 'name avatar');

    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.status === 'finished') return res.status(410).json({ message: 'Session has ended' });

    res.json({
      code: session.code,
      quizTitle: session.quiz?.title,
      quizCategory: session.quiz?.category,
      hostName: session.host?.name,
      hostAvatar: session.host?.avatar,
      participantCount: session.participants.length,
      status: session.status,
      settings: session.settings,
      expiresAt: session.expiresAt || null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/live/session/:code/detail ──────────────────────────────────────
// Protected — host only
export const getSessionDetail = async (req, res) => {
  try {
    const code = req.params.code.replace(/-/g, ' ');
    const session = await LiveSession.findOne({ code })
      .populate('quiz', 'title category questions')
      .populate('host', 'name avatar');

    if (!session) return res.status(404).json({ message: 'Session not found' });

    if (session.host._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden — host access only' });
    }

    res.json({ session });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── DELETE /api/live/session/:code ──────────────────────────────────────────
// Protected — host only — triggers auto-expiry flow
export const endSession = async (req, res) => {
  try {
    const code = req.params.code.replace(/-/g, ' ');
    const session = await LiveSession.findOne({ code });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    if (session.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden — only the host can end this session' });
    }

    await liveSessionService.endSession(code, req.io);
    res.json({ message: 'Session ended' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/live/session/:code (legacy — kept for compatibility) ────────────
export const getSession = async (req, res) => {
  try {
    const code = req.params.code.replace(/-/g, ' ');
    const session = await LiveSession.findOne({ code })
      .populate('quiz', 'title questions timeLimit category')
      .populate('host', 'name avatar');
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json({ session });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
