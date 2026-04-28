import { Router } from 'express';
import {
  createQuiz, getMyQuizzes, getPublicQuizzes,
  getQuiz, updateQuiz, deleteQuiz,
  publishQuiz, submitAttempt, addQuestionToQuiz,
} from '../controllers/quiz.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/public', protect, getPublicQuizzes);
router.get('/mine', protect, getMyQuizzes);
router.post('/', protect, createQuiz);
router.get('/:id', protect, getQuiz);
router.put('/:id', protect, updateQuiz);
router.delete('/:id', protect, deleteQuiz);
router.patch('/:id/publish', protect, publishQuiz);
router.post('/:id/attempt', protect, submitAttempt);
router.post('/:id/questions', protect, addQuestionToQuiz);

export default router;