import { Router } from 'express';
import { createSession, getSession, endSession } from '../controllers/live.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/session', protect, createSession);
router.get('/session/:code', protect, getSession);
router.delete('/session/:code', protect, endSession);

export default router;