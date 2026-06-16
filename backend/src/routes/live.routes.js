import { Router } from 'express';
import {
  createSession,
  getSession,
  getSessionPublic,
  getPublicSessions,
  getSessionDetail,
  endSession,
} from '../controllers/live.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

// ─── Public (no auth) ────────────────────────────────────────────────────────
router.get('/public', getPublicSessions);
router.get('/join/:code', getSessionPublic);

// ─── Protected ───────────────────────────────────────────────────────────────
router.post('/session', protect, createSession);
router.get('/session/:code', protect, getSession);
router.get('/session/:code/detail', protect, getSessionDetail);
router.delete('/session/:code', protect, endSession);

export default router;
