import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  guestName: { type: String },
  socketId: { type: String },
  score: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  currentQuestionIndex: { type: Number, default: 0 }, // per-participant self-paced index
  answers: [{
    questionIndex: Number,
    answer: String,
    isCorrect: Boolean,
    timeTaken: Number,
    points: Number,
  }],
  isReady: { type: Boolean, default: false },
  joinedAt: { type: Date, default: Date.now },
}, { _id: false });

const liveSessionSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [participantSchema],
  status: {
    type: String,
    enum: ['waiting', 'active', 'finished'],
    default: 'waiting',
  },
  isPublic: { type: Boolean, default: false },
  currentQuestionIndex: { type: Number, default: -1 }, // global fallback
  questionStartTime: { type: Date },
  sessionDuration: { type: Number, required: true }, // seconds — set by host
  startedAt: { type: Date },                          // set on host:start
  expiresAt: { type: Date },                          // startedAt + sessionDuration
  settings: {
    timePerQuestion: { type: Number, default: 30 },
    shuffleQuestions: { type: Boolean, default: false },
    music: { type: String, default: 'none' },
  },
}, { timestamps: true });

export default mongoose.model('LiveSession', liveSessionSchema);
