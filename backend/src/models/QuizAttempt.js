import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  selectedAnswer: { type: String },
  isCorrect: { type: Boolean },
  timeTaken: { type: Number }, // seconds
}, { _id: false });

const quizAttemptSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answers: [answerSchema],
  score: { type: Number, default: 0 },
  totalPoints: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  timeTaken: { type: Number }, // total seconds
  isLiveSession: { type: Boolean, default: false },
  sessionCode: { type: String },
  completedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('QuizAttempt', quizAttemptSchema);