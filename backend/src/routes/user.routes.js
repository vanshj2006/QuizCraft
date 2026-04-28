import { Router } from 'express';
import {
  getProfile, updateProfile, changePassword,
  getMyAttempts, getDashboardStats,
} from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/me/stats', protect, getDashboardStats);
router.get('/me/attempts', protect, getMyAttempts);
router.get('/me', protect, getProfile);
router.put('/me', protect, updateProfile);
router.put('/me/password', protect, changePassword);
router.get('/:id', protect, getProfile);

export default router;