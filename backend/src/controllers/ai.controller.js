import { GoogleGenerativeAI } from '@google/generative-ai';
import Question from '../models/Question.js';
import Quiz from '../models/Quiz.js';

const getModel = () => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
};

const QUESTION_SCHEMA = `Return ONLY a valid JSON array of question objects. Each object must have:
{
  "stem": "question text",
  "type": "mcq",
  "options": [{"label":"A","text":"..."},{"label":"B","text":"..."},{"label":"C","text":"..."},{"label":"D","text":"..."}],
  "correctAnswer": "A",
  "explanation": "why this answer is correct",
  "difficulty": "easy|medium|hard|expert",
  "category": "category name",
  "tags": ["tag1","tag2"]
}`;

// ─── Generate from Topic ──────────────────────────────────────────────────────
export const generateFromTopic = async (req, res) => {
  try {
    const { topic, count = 5, difficulty = 'medium', category } = req.body;
    const model = getModel();

    const prompt = `Generate ${count} multiple choice quiz questions about "${topic}".
Difficulty: ${difficulty}. Category: ${category || topic}.
Include distractors and detailed explanations.
${QUESTION_SCHEMA}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('AI did not return valid JSON');

    const questions = JSON.parse(jsonMatch[0]);
    res.json({ questions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Generate from PDF/Image (base64) ────────────────────────────────────────
export const generateFromFile = async (req, res) => {
  try {
    const { fileBase64, mimeType, count = 5 } = req.body;
    const model = getModel();

    const prompt = `Analyze this document/image and generate ${count} multiple choice quiz questions based on its content.
${QUESTION_SCHEMA}`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: fileBase64, mimeType } },
    ]);

    const text = result.response.text();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('AI did not return valid JSON');

    const questions = JSON.parse(jsonMatch[0]);
    res.json({ questions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Save AI Questions ────────────────────────────────────────────────────────
export const saveAiQuestions = async (req, res) => {
  try {
    const { questions, quizId, makePublic = false } = req.body;

    const created = await Question.insertMany(
      questions.map((q) => ({
        ...q,
        createdBy: req.user._id,
        aiGenerated: true,
        isPublic: makePublic,
      }))
    );

    if (quizId) {
      const quiz = await Quiz.findOne({ _id: quizId, createdBy: req.user._id });
      if (quiz) {
        quiz.questions.push(...created.map((q) => q._id));
        quiz.isAiGenerated = true;
        await quiz.save();
      }
    }

    res.status(201).json({ questions: created, count: created.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Generate Full Quiz ───────────────────────────────────────────────────────
export const generateFullQuiz = async (req, res) => {
  try {
    const { topic, count = 10, difficulty = 'medium', category, makePublic = false } = req.body;
    const model = getModel();

    const prompt = `Generate ${count} multiple choice quiz questions about "${topic}".
Difficulty: ${difficulty}. Category: ${category || topic}.
${QUESTION_SCHEMA}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('AI did not return valid JSON');

    const questionsData = JSON.parse(jsonMatch[0]);

    const savedQuestions = await Question.insertMany(
      questionsData.map((q) => ({
        ...q,
        createdBy: req.user._id,
        aiGenerated: true,
        isPublic: makePublic,
      }))
    );

    const quiz = await Quiz.create({
      title: `AI Quiz: ${topic}`,
      description: `AI-generated quiz about ${topic}`,
      category: category || topic,
      questions: savedQuestions.map((q) => q._id),
      createdBy: req.user._id,
      isAiGenerated: true,
      visibility: makePublic ? 'public' : 'private',
    });

    res.status(201).json({ quiz, questions: savedQuestions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};