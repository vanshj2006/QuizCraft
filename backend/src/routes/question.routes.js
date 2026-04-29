import { Router } from 'express';
import {
  createQuestion, getQuestions, getQuestion,
  updateQuestion, deleteQuestion, toggleBookmark,
} from '../controllers/question.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', protect, getQuestions);
router.post('/', protect, createQuestion);
router.get('/:id', protect, getQuestion);
router.put('/:id', protect, updateQuestion);
router.delete('/:id', protect, deleteQuestion);
router.post('/:id/bookmark', protect, toggleBookmark);

export default router;