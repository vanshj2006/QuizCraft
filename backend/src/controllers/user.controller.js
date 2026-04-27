import User from '../models/User.js';
import QuizAttempt from '../models/QuizAttempt.js';
import { sendPasswordChangedEmail } from '../utils/email.js';

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id || req.user._id)
      .populate('bookmarkedQuestions', 'stem difficulty category');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: user.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, avatar },
      { new: true, runValidators: true }
    );
    res.json({ user: user.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!user.password) return res.status(400).json({ message: 'Use Google login to change password' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();

    // Send alert email — fire and forget, don't block response
    sendPasswordChangedEmail(user.email, user.name).catch((err) =>
      console.error('Password change alert email failed:', err.message)
    );

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyAttempts = async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ user: req.user._id })
      .populate('quiz', 'title category')
      .sort({ completedAt: -1 })
      .limit(20);
    res.json({ attempts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const user = req.user;
    const attempts = await QuizAttempt.find({ user: user._id });
    const avgScore = attempts.length
      ? Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length)
      : 0;

    res.json({
      xp: user.xp,
      streak: user.streak,
      totalQuizzesTaken: user.totalQuizzesTaken,
      accuracy: user.totalQuestions > 0
        ? Math.round((user.totalCorrect / user.totalQuestions) * 100)
        : 0,
      avgScore,
      level: user.level,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};