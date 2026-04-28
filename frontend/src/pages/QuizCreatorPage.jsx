import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuizStore } from '../store/quizStore';
import { useQuestionStore } from '../store/questionStore';
import api from '../lib/axios';

const EMPTY_QUESTION = {
  stem: '', type: 'mcq', difficulty: 'medium', category: '', tags: '',
  options: [
    { label: 'A', text: '' }, { label: 'B', text: '' },
    { label: 'C', text: '' }, { label: 'D', text: '' },
  ],
  correctAnswer: 'A', explanation: '', points: 10,
};

export default function QuizCreatorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { createQuiz, updateQuiz, fetchQuiz, currentQuiz } = useQuizStore();
  const { createQuestion } = useQuestionStore();

  const [quizMeta, setQuizMeta] = useState({ title: '', category: '', description: '', timeLimit: 30, shuffleQuestions: false, visibility: 'draft' });
  const [question, setQuestion] = useState(EMPTY_QUESTION);
  const [savedQuestions, setSavedQuestions] = useState([]);
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(5);
  const [aiMode, setAiMode] = useState('topic'); // topic | file
  const [aiFile, setAiFile] = useState(null);
  const [aiFileName, setAiFileName] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDraft, setAiDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('manual'); // manual | ai

  useEffect(() => {
    if (id) {
      fetchQuiz(id).then((quiz) => {
        setQuizMeta({ title: quiz.title, category: quiz.category, description: quiz.description, timeLimit: quiz.timeLimit, shuffleQuestions: quiz.shuffleQuestions, visibility: quiz.visibility });
        setSavedQuestions(quiz.questions || []);
      });
    }
  }, [id]);

  const handleSaveQuestion = async () => {
    if (!question.stem || !question.category) return alert('Fill in question stem and category');
    setSaving(true);
    try {
      let quizId = id;
      if (!quizId) {
        if (!quizMeta.title || !quizMeta.category) return alert('Fill in quiz title and category first');
        const quiz = await createQuiz(quizMeta);
        quizId = quiz._id;
        navigate(`/quizzes/${quizId}/edit`, { replace: true });
      }
      const q = await createQuestion({
        ...question,
        tags: question.tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      await api.post(`/quizzes/${quizId}/questions`, { questionId: q._id });
      setSavedQuestions((prev) => [...prev, q]);
      setQuestion(EMPTY_QUESTION);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const handleAiGenerate = async () => {
    if (aiMode === 'topic' && !aiTopic) return;
    if (aiMode === 'file' && !aiFile) return;
    setAiLoading(true);
    try {
      let data;
      if (aiMode === 'file') {
        // Convert file to base64
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(aiFile);
        });
        const res = await api.post('/ai/generate/file', {
          fileBase64: base64,
          mimeType: aiFile.type,
          count: aiCount,
        });
        data = res.data;
      } else {
        const res = await api.post('/ai/generate/topic', {
          topic: aiTopic, count: aiCount,
          difficulty: question.difficulty,
          category: quizMeta.category || aiTopic,
        });
        data = res.data;
      }
      setAiDraft(data.questions[0]);
    } catch (err) {
      alert(err.response?.data?.message || 'AI generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddAiDraft = async () => {
    if (!aiDraft) return;
    setSaving(true);
    try {
      let quizId = id;
      if (!quizId) {
        if (!quizMeta.title || !quizMeta.category) return alert('Fill in quiz title and category first');
        const quiz = await createQuiz(quizMeta);
        quizId = quiz._id;
        navigate(`/quizzes/${quizId}/edit`, { replace: true });
      }
      const q = await createQuestion({ ...aiDraft, isPublic: false });
      await api.post(`/quizzes/${quizId}/questions`, { questionId: q._id });
      setSavedQuestions((prev) => [...prev, q]);
      setAiDraft(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add question');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveQuiz = async () => {
    setSaving(true);
    try {
      if (id) {
        await updateQuiz(id, quizMeta);
      } else {
        const quiz = await createQuiz(quizMeta);
        navigate(`/quizzes/${quiz._id}/edit`, { replace: true });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 flex justify-between items-center px-6 py-3 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="text-xl font-bold text-primary tracking-tighter">Quiz Creator</div>
          <div className="h-4 w-px bg-slate-800 mx-2" />
          <input
            value={quizMeta.title}
            onChange={(e) => setQuizMeta({ ...quizMeta, title: e.target.value })}
            className="bg-transparent text-on-surface-variant text-body-sm font-medium outline-none border-b border-transparent focus:border-outline-variant transition-all"
            placeholder="Untitled Quiz..."
          />
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/quizzes')} className="px-4 py-2 border border-outline-variant rounded-xl text-on-surface hover:bg-surface-variant transition-all font-bold text-body-sm">
            Discard
          </button>
          <button onClick={handleSaveQuiz} disabled={saving} className="px-6 py-2 bg-primary-container text-white rounded-xl font-bold hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 text-body-sm">
            {saving ? 'Saving...' : 'Save Quiz'}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-gutter custom-scrollbar">
        <div className="max-w-[1400px] mx-auto grid grid-cols-12 gap-gutter">

          {/* Left: Builder */}
          <div className="col-span-12 lg:col-span-7 space-y-gutter">
            {/* Quiz Meta */}
            <div className="bg-surface-container rounded-xl p-lg border border-outline-variant/30">
              <h3 className="text-h3 font-bold text-on-surface mb-lg">Quiz Settings</h3>
              <div className="grid grid-cols-2 gap-md">
                {[
                  { key: 'category', label: 'CATEGORY', placeholder: 'e.g. Computer Science' },
                  { key: 'description', label: 'DESCRIPTION', placeholder: 'Brief description...' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className="space-y-sm">
                    <label className="text-label-caps text-on-surface-variant">{label}</label>
                    <input
                      value={quizMeta[key]}
                      onChange={(e) => setQuizMeta({ ...quizMeta, [key]: e.target.value })}
                      className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg p-md text-on-surface focus:border-primary-container outline-none transition-all"
                      placeholder={placeholder}
                    />
                  </div>
                ))}
                <div className="space-y-sm">
                  <label className="text-label-caps text-on-surface-variant">TIME PER QUESTION (s)</label>
                  <input
                    type="number"
                    value={quizMeta.timeLimit}
                    onChange={(e) => setQuizMeta({ ...quizMeta, timeLimit: Number(e.target.value) })}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg p-md text-on-surface focus:border-primary-container outline-none transition-all"
                  />
                </div>
                <div className="space-y-sm">
                  <label className="text-label-caps text-on-surface-variant">VISIBILITY</label>
                  <select
                    value={quizMeta.visibility}
                    onChange={(e) => setQuizMeta({ ...quizMeta, visibility: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg p-md text-on-surface focus:border-primary-container outline-none transition-all"
                  >
                    <option value="draft">Draft</option>
                    <option value="private">Private</option>
                    <option value="public">Public</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Question Builder */}
            <div className="bg-surface-container rounded-xl p-lg border border-outline-variant/30">
              <div className="flex items-center justify-between mb-lg">
                <h3 className="text-h3 font-bold text-on-surface">Question Details</h3>
                <div className="flex gap-2">
                  <span className="px-3 py-1 rounded-full bg-tertiary/10 text-tertiary text-label-caps border border-tertiary/20">MCQ</span>
                  <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-label-caps">PTS: {question.points}</span>
                </div>
              </div>

              <div className="space-y-lg">
                <div className="space-y-sm">
                  <label className="text-label-caps text-on-surface-variant">QUESTION STEM</label>
                  <textarea
                    value={question.stem}
                    onChange={(e) => setQuestion({ ...question, stem: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg p-md text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container/20 outline-none transition-all placeholder:text-slate-600"
                    placeholder="Enter the question..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-md">
                  <div className="space-y-sm">
                    <label className="text-label-caps text-on-surface-variant">CATEGORY</label>
                    <input
                      value={question.category}
                      onChange={(e) => setQuestion({ ...question, category: e.target.value })}
                      className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg p-md text-on-surface focus:border-primary-container outline-none transition-all"
                      placeholder="e.g. Physics"
                    />
                  </div>
                  <div className="space-y-sm">
                    <label className="text-label-caps text-on-surface-variant">DIFFICULTY</label>
                    <select
                      value={question.difficulty}
                      onChange={(e) => setQuestion({ ...question, difficulty: e.target.value })}
                      className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg p-md text-on-surface focus:border-primary-container outline-none transition-all"
                    >
                      {['easy', 'medium', 'hard', 'expert'].map((d) => (
                        <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-md">
                  <label className="text-label-caps text-on-surface-variant">OPTIONS & CORRECT ANSWER</label>
                  <div className="grid gap-sm">
                    {question.options.map((opt) => (
                      <div key={opt.label} className="flex gap-sm items-center">
                        <div className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold text-sm ${question.correctAnswer === opt.label ? 'bg-primary-container text-white' : 'bg-surface-container-high text-on-surface-variant'}`}>
                          {opt.label}
                        </div>
                        <input
                          value={opt.text}
                          onChange={(e) => setQuestion({
                            ...question,
                            options: question.options.map((o) => o.label === opt.label ? { ...o, text: e.target.value } : o),
                          })}
                          className="flex-1 bg-surface-container-low border border-outline-variant/30 rounded-lg p-md text-on-surface focus:border-primary-container outline-none transition-all"
                          placeholder={`Option ${opt.label}`}
                        />
                        <button
                          onClick={() => setQuestion({ ...question, correctAnswer: opt.label })}
                          className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-all ${question.correctAnswer === opt.label ? 'text-primary border-primary/30 bg-primary/10' : 'text-on-surface-variant border-outline-variant/30 hover:bg-surface-variant'}`}
                        >
                          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: question.correctAnswer === opt.label ? "'FILL' 1" : "'FILL' 0" }}>
                            {question.correctAnswer === opt.label ? 'check_circle' : 'radio_button_unchecked'}
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-sm">
                  <label className="text-label-caps text-on-surface-variant">EXPLANATION</label>
                  <textarea
                    value={question.explanation}
                    onChange={(e) => setQuestion({ ...question, explanation: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg p-md text-on-surface focus:border-primary-container outline-none transition-all placeholder:text-slate-600"
                    placeholder="Explain the correct answer..."
                    rows={2}
                  />
                </div>

                <div className="space-y-sm">
                  <label className="text-label-caps text-on-surface-variant">TAGS (comma separated)</label>
                  <input
                    value={question.tags}
                    onChange={(e) => setQuestion({ ...question, tags: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg p-md text-on-surface focus:border-primary-container outline-none transition-all"
                    placeholder="e.g. calculus, derivatives"
                  />
                </div>

                <button
                  onClick={handleSaveQuestion}
                  disabled={saving}
                  className="w-full py-3 bg-secondary-container text-on-secondary-container font-bold rounded-xl hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">library_add</span>
                  {saving ? 'Saving...' : 'Add Question to Quiz'}
                </button>
              </div>
            </div>

            {/* Saved Questions */}
            {savedQuestions.length > 0 && (
              <div className="bg-surface-container rounded-xl p-lg border border-outline-variant/30">
                <h3 className="text-h3 font-bold text-on-surface mb-lg">
                  Questions ({savedQuestions.length})
                </h3>
                <div className="space-y-3">
                  {savedQuestions.map((q, i) => (
                    <div key={q._id || i} className="flex items-start gap-3 p-md bg-surface-container-low rounded-lg border border-outline-variant/20">
                      <span className="text-label-caps text-on-surface-variant w-6 shrink-0 mt-1">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-body-sm text-on-surface font-medium truncate">{q.stem}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-[10px] text-on-surface-variant">{q.difficulty}</span>
                          {q.aiGenerated && <span className="text-[10px] text-secondary-fixed-dim">AI</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: AI Zone */}
          <div className="col-span-12 lg:col-span-5 space-y-gutter">
            <div className="bg-surface-container rounded-xl p-lg border border-primary/20 relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-48 h-48 opacity-5">
                <svg className="fill-primary" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" fill="none" r="40" stroke="currentColor" strokeWidth="2" />
                  <path d="M50 10 L50 90 M10 50 L90 50" stroke="currentColor" strokeWidth="1" />
                </svg>
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-lg">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  <h3 className="text-h3 font-bold text-on-surface">AI Power-Up Zone</h3>
                </div>

                {/* Mode tabs */}
                <div className="flex bg-surface-container-high rounded-xl p-1 gap-1 mb-md">
                  {[
                    { key: 'topic', label: 'By Topic', icon: 'edit_note' },
                    { key: 'file', label: 'From File', icon: 'upload_file' },
                  ].map(({ key, label, icon }) => (
                    <button
                      key={key}
                      onClick={() => setAiMode(key)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-body-sm font-medium transition-all ${aiMode === key ? 'bg-primary-container text-white' : 'text-on-surface-variant hover:text-on-surface'}`}
                    >
                      <span className="material-symbols-outlined text-sm">{icon}</span>
                      {label}
                    </button>
                  ))}
                </div>

                <div className="space-y-md">
                  {aiMode === 'topic' ? (
                    <div className="space-y-sm">
                      <label className="text-label-caps text-on-surface-variant">TOPIC</label>
                      <input
                        value={aiTopic}
                        onChange={(e) => setAiTopic(e.target.value)}
                        className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg p-md text-on-surface focus:border-primary-container outline-none transition-all"
                        placeholder="e.g. Quantum Physics, React Hooks..."
                      />
                    </div>
                  ) : (
                    <div className="space-y-sm">
                      <label className="text-label-caps text-on-surface-variant">UPLOAD FILE</label>
                      <label className={`flex flex-col items-center justify-center gap-3 p-lg border-2 border-dashed rounded-xl cursor-pointer transition-all ${aiFile ? 'border-primary/50 bg-primary/5' : 'border-outline-variant/30 hover:border-primary/30 hover:bg-surface-container-low'}`}>
                        <input
                          type="file"
                          accept="image/*,.pdf,.doc,.docx,.txt"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files[0];
                            if (f) { setAiFile(f); setAiFileName(f.name); }
                          }}
                        />
                        {aiFile ? (
                          <>
                            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-body-sm text-on-surface font-medium text-center truncate max-w-full px-2">{aiFileName}</span>
                            <span className="text-[11px] text-on-surface-variant">Click to change</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-8 h-8 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                            <div className="text-center">
                              <p className="text-body-sm text-on-surface font-medium">Drop a file or click to browse</p>
                              <p className="text-[11px] text-on-surface-variant mt-1">Images, PDF, Word, TXT</p>
                            </div>
                          </>
                        )}
                      </label>
                    </div>
                  )}

                  <div className="space-y-sm">
                    <label className="text-label-caps text-on-surface-variant">NUMBER OF QUESTIONS</label>
                    <input
                      type="number" min={1} max={20} value={aiCount}
                      onChange={(e) => setAiCount(Number(e.target.value))}
                      className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg p-md text-on-surface focus:border-primary-container outline-none transition-all"
                    />
                  </div>

                  <button
                    onClick={handleAiGenerate}
                    disabled={aiLoading || (aiMode === 'topic' ? !aiTopic : !aiFile)}
                    className="w-full py-3 bg-primary-container text-white font-bold rounded-xl hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                    {aiLoading ? 'Generating...' : 'Generate Questions'}
                  </button>
                </div>
              </div>
            </div>

            {/* AI Draft Preview */}
            {aiDraft && (
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden">
                <div className="bg-surface-container-high px-md py-sm flex justify-between items-center border-b border-outline-variant/30">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-secondary" />
                    <span className="text-label-caps text-secondary">GEMINI DRAFT PREVIEW</span>
                  </div>
                </div>
                <div className="p-md font-mono text-body-sm text-secondary-fixed-dim bg-slate-950/50 max-h-48 overflow-y-auto custom-scrollbar">
                  <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(aiDraft, null, 2)}</pre>
                </div>
                <div className="p-md bg-surface-container-high border-t border-outline-variant/30">
                  <button
                    onClick={handleAddAiDraft}
                    disabled={saving}
                    className="w-full bg-secondary-container text-on-secondary-container py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined">library_add</span>
                    Add to Quiz Deck
                  </button>
                </div>
              </div>
            )}

            {/* Generate Full Quiz */}
            <div className="bg-surface-container rounded-xl p-lg border border-outline-variant/30">
              <h3 className="text-body-md font-bold text-on-surface mb-md flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-sm">rocket_launch</span>
                Generate Full Quiz with AI
              </h3>
              <p className="text-body-sm text-on-surface-variant mb-md">Create an entire quiz from a topic in one click.</p>
              <button
                onClick={async () => {
                  if (aiMode === 'topic' && !aiTopic) return alert('Enter a topic first');
                  if (aiMode === 'file' && !aiFile) return alert('Upload a file first');
                  setAiLoading(true);
                  try {
                    let data;
                    if (aiMode === 'file') {
                      const base64 = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result.split(',')[1]);
                        reader.onerror = reject;
                        reader.readAsDataURL(aiFile);
                      });
                      const res = await api.post('/ai/generate/file', {
                        fileBase64: base64, mimeType: aiFile.type, count: aiCount,
                      });
                      // Save all questions and create quiz
                      const saved = await api.post('/ai/save', {
                        questions: res.data.questions,
                        makePublic: quizMeta.visibility === 'public',
                      });
                      const quiz = await createQuiz({
                        ...quizMeta,
                        title: quizMeta.title || `AI Quiz from ${aiFileName}`,
                        category: quizMeta.category || 'General',
                        questions: saved.data.questions.map(q => q._id),
                        isAiGenerated: true,
                      });
                      navigate(`/quizzes/${quiz._id}/edit`);
                    } else {
                      const res = await api.post('/ai/generate/full-quiz', {
                        topic: aiTopic, count: aiCount, difficulty: question.difficulty,
                        category: quizMeta.category || aiTopic, makePublic: quizMeta.visibility === 'public',
                      });
                      navigate(`/quizzes/${res.data.quiz._id}/edit`);
                    }
                  } catch (err) {
                    alert(err.response?.data?.message || 'Failed');
                  } finally {
                    setAiLoading(false);
                  }
                }}
                disabled={aiLoading || (aiMode === 'topic' ? !aiTopic : !aiFile)}
                className="w-full py-3 border border-tertiary/30 text-tertiary font-bold rounded-xl hover:bg-tertiary/10 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                {aiLoading ? 'Generating...' : 'Generate Full Quiz'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 bg-surface px-xl py-lg flex justify-between items-center">
        <div className="flex items-center gap-xl">
          <div className="flex items-center gap-2">
            <span className="text-on-surface-variant font-medium text-body-sm">Questions:</span>
            <div className="w-32 h-2 bg-surface-container-highest rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${Math.min((savedQuestions.length / 20) * 100, 100)}%` }} />
            </div>
            <span className="text-primary font-bold text-body-sm">{savedQuestions.length}</span>
          </div>
        </div>
        <div className="flex gap-md">
          <button onClick={() => navigate('/quizzes')} className="px-lg py-3 border border-outline-variant rounded-xl text-on-surface hover:bg-surface-variant transition-all font-bold text-body-sm">
            Back to Quizzes
          </button>
          {id && savedQuestions.length > 0 && (
            <button
              onClick={async () => {
                try {
                  const { data } = await api.post('/live/session', { quizId: id, settings: { timePerQuestion: quizMeta.timeLimit } });
                  navigate(`/live/${data.code.replace(' ', '-')}/lobby`);
                } catch (err) {
                  alert(err.response?.data?.message || 'Failed to start live session');
                }
              }}
              className="px-lg py-3 bg-tertiary text-on-tertiary rounded-xl font-bold hover:brightness-110 transition-all active:scale-95 flex items-center gap-2 text-body-sm"
            >
              <span className="material-symbols-outlined text-sm">live_tv</span>
              Host Live
            </button>
          )}
        </div>
      </div>
    </div>
  );
}