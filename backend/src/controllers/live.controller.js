import LiveSession from '../models/LiveSession.js';
import Quiz from '../models/Quiz.js';
import { generateSessionCode } from '../utils/generateCode.js';

export const createSession = async (req, res) => {
  try {
    const { quizId, settings } = req.body;
    const quiz = await Quiz.findOne({ _id: quizId, createdBy: req.user._id }).populate('questions');
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const code = generateSessionCode();
    const session = await LiveSession.create({
      code,
      quiz: quizId,
      host: req.user._id,
      settings: settings || {},
    });

    quiz.liveSessionCode = code;
    quiz.liveSessionActive = true;
    await quiz.save();

    res.status(201).json({ session, code });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getSession = async (req, res) => {
  try {
    const session = await LiveSession.findOne({ code: req.params.code })
      .populate('quiz', 'title questions timeLimit')
      .populate('host', 'name avatar');
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json({ session });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const endSession = async (req, res) => {
  try {
    const session = await LiveSession.findOne({ code: req.params.code, host: req.user._id });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    session.status = 'finished';
    await session.save();

    const quiz = await Quiz.findById(session.quiz);
    if (quiz) {
      quiz.liveSessionActive = false;
      quiz.liveSessionCode = undefined;
      await quiz.save();
    }

    req.io.to(req.params.code).emit('session:ended', { message: 'Session ended by host' });
    res.json({ message: 'Session ended' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};