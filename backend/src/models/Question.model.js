import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({
  label: { type: String, required: true }, // A, B, C, D
  text: { type: String, required: true },
}, { _id: false });

const questionSchema = new mongoose.Schema({
  stem: { type: String, required: true },
  type: { type: String, enum: ['mcq', 'true_false', 'short_answer'], default: 'mcq' },
  options: [optionSchema],
  correctAnswer: { type: String, required: true }, // label e.g. "A"
  explanation: { type: String, default: '' },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'expert'], default: 'medium' },
  category: { type: String, required: true },
  tags: [{ type: String }],
  points: { type: Number, default: 10 },
  isPublic: { type: Boolean, default: false },
  aiGenerated: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Stats
  timesUsed: { type: Number, default: 0 },
  timesCorrect: { type: Number, default: 0 },
}, { timestamps: true });

questionSchema.virtual('successRate').get(function () {
  if (this.timesUsed === 0) return 0;
  return Math.round((this.timesCorrect / this.timesUsed) * 100);
});

questionSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Question', questionSchema);