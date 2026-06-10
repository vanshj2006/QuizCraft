import Quiz from '../models/Quiz.model.js';
import Question from '../models/Question.model.js';
import QuizAttempt from '../models/QuizAttempt.model.js';

// ─── Create Quiz ──────────────────────────────────────────────────────────────
export const createQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ quiz });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Get My Quizzes ───────────────────────────────────────────────────────────
export const getMyQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ createdBy: req.user._id })
      .populate('questions', 'stem difficulty')
      .sort({ updatedAt: -1 });
    res.json({ quizzes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Get Public Quizzes ───────────────────────────────────────────────────────
export const getPublicQuizzes = async (req, res) => {
  try {
    const { page = 1, limit = 12, category, search } = req.query;
    const filter = { visibility: 'public' };
    if (category) filter.category = category;
    if (search) {
      filter.title = new RegExp(search, 'i');
    }

    const quizzes = await Quiz.find(filter)
      .populate('createdBy', 'name avatar')
      .populate('questions', '_id')
      .sort({ totalAttempts: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Quiz.countDocuments(filter);
    res.json({ quizzes, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Get Single Quiz ──────────────────────────────────────────────────────────
export const getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('createdBy', 'name avatar')
      .populate('questions');

    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const isOwner = quiz.createdBy._id.toString() === req.user._id.toString();
    if (quiz.visibility === 'private' && !isOwner) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ quiz });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Update Quiz ──────────────────────────────────────────────────────────────
export const updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    Object.assign(quiz, req.body);
    await quiz.save();
    res.json({ quiz });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Delete Quiz ──────────────────────────────────────────────────────────────
export const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    res.json({ message: 'Quiz deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Publish Quiz ─────────────────────────────────────────────────────────────
export const publishQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    if (quiz.questions.length === 0) {
      return res.status(400).json({ message: 'Add at least one question before publishing' });
    }
    quiz.visibility = 'public';
    await quiz.save();
    res.json({ quiz, message: 'Quiz published successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Submit Quiz Attempt ──────────────────────────────────────────────────────
export const submitAttempt = async (req, res) => {
  try {
    const { answers, timeTaken } = req.body;
    const quiz = await Quiz.findById(req.params.id).populate('questions');
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    let score = 0;
    const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);
    const processedAnswers = answers.map((a) => {
      const question = quiz.questions.find((q) => q._id.toString() === a.questionId);
      if (!question) return a;
      const isCorrect = question.correctAnswer === a.selectedAnswer;
      if (isCorrect) {
        score += question.points;
        question.timesCorrect += 1;
      }
      question.timesUsed += 1;
      question.save();
      return { question: question._id, selectedAnswer: a.selectedAnswer, isCorrect, timeTaken: a.timeTaken };
    });

    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;

    const attempt = await QuizAttempt.create({
      quiz: quiz._id,
      user: req.user._id,
      answers: processedAnswers,
      score,
      totalPoints,
      percentage,
      timeTaken,
    });

    // Update quiz stats
    quiz.totalAttempts += 1;
    quiz.averageScore = ((quiz.averageScore * (quiz.totalAttempts - 1)) + percentage) / quiz.totalAttempts;
    await quiz.save();

    // Update user XP
    req.user.xp += score;
    req.user.totalQuizzesTaken += 1;
    req.user.totalCorrect += processedAnswers.filter((a) => a.isCorrect).length;
    req.user.totalQuestions += quiz.questions.length;
    await req.user.save();

    res.json({ attempt, score, totalPoints, percentage });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Add Question to Quiz ─────────────────────────────────────────────────────
export const addQuestionToQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const { questionId } = req.body;
    if (!quiz.questions.includes(questionId)) {
      quiz.questions.push(questionId);
      await quiz.save();
    }
    res.json({ quiz });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Remove Question from Quiz ────────────────────────────────────────────────
export const removeQuestionFromQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    quiz.questions = quiz.questions.filter(
      (q) => q.toString() !== req.params.questionId
    );
    await quiz.save();
    res.json({ quiz });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
