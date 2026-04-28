import Question from '../models/Question.js';

export const createQuestion = async (req, res) => {
  try {
    const question = await Question.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ question });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getQuestions = async (req, res) => {
  try {
    const { page = 1, limit = 10, difficulty, category, tags, search, mine } = req.query;
    const filter = {};

    if (mine === 'true') {
      filter.createdBy = req.user._id;
    } else {
      filter.$or = [{ isPublic: true }, { createdBy: req.user._id }];
    }

    if (difficulty) filter.difficulty = difficulty;
    if (category) filter.category = category;
    if (tags) filter.tags = { $in: tags.split(',') };
    if (search) filter.$text = { $search: search };

    const questions = await Question.find(filter)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Question.countDocuments(filter);
    res.json({ questions, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id).populate('createdBy', 'name');
    if (!question) return res.status(404).json({ message: 'Question not found' });
    res.json({ question });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateQuestion = async (req, res) => {
  try {
    const question = await Question.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!question) return res.status(404).json({ message: 'Question not found' });
    res.json({ question });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!question) return res.status(404).json({ message: 'Question not found' });
    res.json({ message: 'Question deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const toggleBookmark = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const idx = user.bookmarkedQuestions.indexOf(id);
    if (idx === -1) {
      user.bookmarkedQuestions.push(id);
    } else {
      user.bookmarkedQuestions.splice(idx, 1);
    }
    await user.save();
    res.json({ bookmarked: idx === -1 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};