import { Router } from 'express';
import {
  generateFromTopic, generateFromFile,
  saveAiQuestions, generateFullQuiz,
} from '../controllers/ai.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/generate/topic', protect, generateFromTopic);
router.post('/generate/file', protect, generateFromFile);
router.post('/generate/full-quiz', protect, generateFullQuiz);
router.post('/save', protect, saveAiQuestions);

export default router;