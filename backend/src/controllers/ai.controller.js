import Question from '../models/Question.model.js';
import Quiz from '../models/Quiz.model.js';

const QUESTION_SCHEMA = `Return ONLY a valid JSON array with no markdown, no code blocks, no explanation. Each object must have exactly:
[
  {
    "stem": "question text",
    "type": "mcq",
    "options": [{"label":"A","text":"..."},{"label":"B","text":"..."},{"label":"C","text":"..."},{"label":"D","text":"..."}],
    "correctAnswer": "A",
    "explanation": "why this answer is correct",
    "difficulty": "easy|medium|hard|expert",
    "category": "category name",
    "tags": ["tag1","tag2"]
  }
]`;

async function callGemini(parts) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set in .env');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    console.error('Gemini raw error:', JSON.stringify(err));
    const msg = err?.error?.message || `Gemini API error ${response.status}`;
    throw new Error(msg);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

function parseQuestions(text) {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('AI did not return a valid JSON array');
  return JSON.parse(match[0]);
}

function handleError(err, res) {
  console.error('AI error:', err.message);
  if (err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('RESOURCE_EXHAUSTED')) {
    return res.status(429).json({ message: 'AI quota exceeded. Please try again later.' });
  }
  res.status(500).json({ message: err.message });
}

// ─── Generate from Topic ──────────────────────────────────────────────────────
export const generateFromTopic = async (req, res) => {
  try {
    const { topic, count = 5, difficulty = 'medium', category } = req.body;
    const prompt = `Generate ${count} multiple choice quiz questions about "${topic}". Difficulty: ${difficulty}. Category: ${category || topic}. Include good distractors and clear explanations.\n${QUESTION_SCHEMA}`;
    const text = await callGemini([{ text: prompt }]);
    const questions = parseQuestions(text);
    res.json({ questions });
  } catch (err) {
    handleError(err, res);
  }
};

// ─── Generate from File ───────────────────────────────────────────────────────
export const generateFromFile = async (req, res) => {
  try {
    const { fileBase64, mimeType, count = 5 } = req.body;
    const prompt = `Analyze this document/image and generate ${count} multiple choice quiz questions based on its content.\n${QUESTION_SCHEMA}`;
    const text = await callGemini([
      { text: prompt },
      { inlineData: { data: fileBase64, mimeType } },
    ]);
    const questions = parseQuestions(text);
    res.json({ questions });
  } catch (err) {
    handleError(err, res);
  }
};

// ─── Save AI Questions ────────────────────────────────────────────────────────
export const saveAiQuestions = async (req, res) => {
  try {
    const { questions, quizId, makePublic = false } = req.body;
    const created = await Question.insertMany(
      questions.map((q) => ({ ...q, createdBy: req.user._id, aiGenerated: true, isPublic: makePublic }))
    );
    if (quizId) {
      const quiz = await Quiz.findOne({ _id: quizId, createdBy: req.user._id });
      if (quiz) { quiz.questions.push(...created.map((q) => q._id)); quiz.isAiGenerated = true; await quiz.save(); }
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
    const prompt = `Generate ${count} multiple choice quiz questions about "${topic}". Difficulty: ${difficulty}. Category: ${category || topic}.\n${QUESTION_SCHEMA}`;
    const text = await callGemini([{ text: prompt }]);
    const questionsData = parseQuestions(text);
    const savedQuestions = await Question.insertMany(
      questionsData.map((q) => ({ ...q, createdBy: req.user._id, aiGenerated: true, isPublic: makePublic }))
    );
    const quiz = await Quiz.create({
      title: topic,
      description: `Quiz about ${topic}`,
      category: category || topic,
      questions: savedQuestions.map((q) => q._id),
      createdBy: req.user._id,
      isAiGenerated: true,
      visibility: makePublic ? 'public' : 'private',
    });
    res.status(201).json({ quiz, questions: savedQuestions });
  } catch (err) {
    handleError(err, res);
  }
};