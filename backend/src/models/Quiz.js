import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category: { type: String, required: true },
  tags: [{ type: String }],
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Settings
  timeLimit: { type: Number, default: 30 }, // seconds per question
  shuffleQuestions: { type: Boolean, default: false },
  shuffleOptions: { type: Boolean, default: false },

  // Visibility
  visibility: {
    type: String,
    enum: ['draft', 'private', 'public'],
    default: 'draft',
  },
  isAiGenerated: { type: Boolean, default: false },

  // Stats
  totalAttempts: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },

  // Live session
  liveSessionCode: { type: String, sparse: true },
  liveSessionActive: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Quiz', quizSchema);
