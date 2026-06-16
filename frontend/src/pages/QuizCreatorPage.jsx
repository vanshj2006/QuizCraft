import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuizStore } from '../store/quizStore.js';
import { useQuestionStore } from '../store/questionStore.js';
import api from '../lib/axios';

const EMPTY_QUESTION = {
  stem: '', type: 'mcq', difficulty: 'medium', category: '', tags: '',
  options: [
    { label: 'A', text: '' }, { label: 'B', text: '' },
    { label: 'C', text: '' }, { label: 'D', text: '' },
  ],
  correctAnswer: 'A', explanation: '', points: 10,
};

/* ── Reusable modal dialogs ── */
function AlertModal({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-container border border-outline-variant/40 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 space-y-4">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-error mt-0.5">error</span>
          <p className="text-on-surface text-body-md">{message}</p>
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-primary-container text-white rounded-xl font-bold text-body-sm hover:brightness-110 transition-all"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  if (!message) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-container border border-outline-variant/40 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 space-y-4">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-error mt-0.5">warning</span>
          <p className="text-on-surface text-body-md">{message}</p>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2 border border-outline-variant rounded-xl text-on-surface font-bold text-body-sm hover:bg-surface-variant transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 bg-error text-white rounded-xl font-bold text-body-sm hover:brightness-110 transition-all"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Question Bank Picker Modal ── */
function QuestionBankModal({ open, onClose, alreadyAdded, onAdd, onRemove }) {
  const { fetchQuestions } = useQuestionStore();
  const [questions, setQuestions] = useState([]);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(new Set()); // new questions to add
  const [toRemove, setToRemove] = useState(new Set()); // already-added to remove
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    setToRemove(new Set());
    load();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search, difficulty]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchQuestions({ search, difficulty, mine: 'true', limit: 50 });
      setQuestions(data.questions || []);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    setAdding(true);
    const toAdd = questions.filter((q) => selected.has(q._id));
    const removeList = questions.filter((q) => toRemove.has(q._id));
    if (toAdd.length > 0) await onAdd(toAdd);
    if (removeList.length > 0) await onRemove(removeList);
    setAdding(false);
    onClose();
  };

  if (!open) return null;

  const DIFF_COLORS = {
    easy: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    medium: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
    hard: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
    expert: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
  };

  const totalChanges = selected.size + toRemove.size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-container border border-outline-variant/40 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-tertiary/15 flex items-center justify-center">
              <span className="material-symbols-outlined text-tertiary text-[18px]">account_balance</span>
            </div>
            <h3 className="text-body-md font-bold text-on-surface">Question Bank</h3>
            {selected.size > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-primary-container text-white text-[11px] font-bold">
                {selected.size} to add
              </span>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-variant text-on-surface-variant transition-all">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-outline-variant/20 flex gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg py-2 pl-9 pr-3 text-on-surface text-body-sm focus:border-primary-container outline-none transition-all"
              placeholder="Search questions..."
            />
          </div>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-on-surface text-body-sm focus:border-primary-container outline-none transition-all"
          >
            <option value="">All difficulties</option>
            {['easy', 'medium', 'hard', 'expert'].map((d) => (
              <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 space-y-2">
          {loading ? (
            <div className="flex justify-center py-10">
              <span className="material-symbols-outlined text-3xl text-slate-600 animate-spin">progress_activity</span>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-10">
              <span className="material-symbols-outlined text-4xl text-slate-600 block mb-2">search_off</span>
              <p className="text-on-surface-variant text-body-sm">No questions found.</p>
            </div>
          ) : (
            questions.map((q) => {
              const isInQuiz = alreadyAdded.includes(q._id);
              const isSel = selected.has(q._id);
              const isRem = toRemove.has(q._id);

              const handleClick = () => {
                if (isInQuiz) {
                  setToRemove((prev) => {
                    const next = new Set(prev);
                    next.has(q._id) ? next.delete(q._id) : next.add(q._id);
                    return next;
                  });
                } else {
                  setSelected((prev) => {
                    const next = new Set(prev);
                    next.has(q._id) ? next.delete(q._id) : next.add(q._id);
                    return next;
                  });
                }
              };

              let rowClass = 'border-outline-variant/20 bg-surface-container-low hover:border-outline-variant/50';
              if (isSel) rowClass = 'border-primary-container/60 bg-primary-container/10';
              if (isInQuiz && !isRem) rowClass = 'border-primary/30 bg-primary/5';
              // isRem: looks same as unselected — clicking again re-adds it

              return (
                <div
                  key={q._id}
                  onClick={handleClick}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${rowClass}`}
                >
                  <div className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                    isSel ? 'bg-primary-container border-primary-container' :
                    isInQuiz && !isRem ? 'bg-primary/30 border-primary/50' :
                    'border-outline-variant/50'
                  }`}>
                    {isSel && <span className="material-symbols-outlined text-white text-[12px]">check</span>}
                    {isInQuiz && !isRem && <span className="material-symbols-outlined text-white text-[12px]">check</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-medium leading-snug text-on-surface">{q.stem}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${DIFF_COLORS[q.difficulty] || ''}`}>
                        {q.difficulty}
                      </span>
                      {q.category && <span className="text-[10px] text-slate-500">{q.category}</span>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-outline-variant/20 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-outline-variant rounded-xl text-on-surface font-bold text-body-sm hover:bg-surface-variant transition-all">
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={totalChanges === 0 || adding}
            className="px-5 py-2 bg-primary-container text-white rounded-xl font-bold text-body-sm hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">check</span>
            {adding ? 'Applying...' : 'Apply Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── AI Generate Modal ── */
function AiGenerateModal({ open, onClose, quizMeta, questionDifficulty, onQuestionsGenerated, onFullQuizCreated }) {
  const [aiMode, setAiMode] = useState('topic');
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(5);
  const [aiFile, setAiFile] = useState(null);
  const [aiFileName, setAiFileName] = useState('');
  const [generateMode, setGenerateMode] = useState('questions'); // 'questions' | 'full'
  const [aiLoading, setAiLoading] = useState(false);
  const { createQuiz } = useQuizStore();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');

  if (!open) return null;

  const canGenerate = aiMode === 'topic' ? !!aiTopic.trim() : !!aiFile;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setAiLoading(true);
    try {
      if (generateMode === 'questions') {
        let data;
        if (aiMode === 'file') {
          const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(aiFile);
          });
          const res = await api.post('/ai/generate/file', { fileBase64: base64, mimeType: aiFile.type, count: aiCount });
          data = res.data;
        } else {
          const res = await api.post('/ai/generate/topic', {
            topic: aiTopic, count: aiCount,
            difficulty: questionDifficulty,
            category: quizMeta.category || aiTopic,
          });
          data = res.data;
        }
        onQuestionsGenerated(data.questions[0]);
        onClose();
      } else {
        // Full quiz
        if (aiMode === 'file') {
          const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(aiFile);
          });
          const res = await api.post('/ai/generate/file', { fileBase64: base64, mimeType: aiFile.type, count: aiCount });
          const saved = await api.post('/ai/save', {
            questions: res.data.questions,
            makePublic: quizMeta.visibility === 'public',
          });
          const quiz = await createQuiz({
            ...quizMeta,
            title: quizMeta.title || aiFileName.replace(/\.[^/.]+$/, '') || 'Untitled Quiz',
            category: quizMeta.category || 'General',
            questions: saved.data.questions.map(q => q._id),
            isAiGenerated: true,
          });
          onClose();
          navigate(`/quizzes/${quiz._id}/edit`);
        } else {
          const res = await api.post('/ai/generate/full-quiz', {
            topic: aiTopic, count: aiCount, difficulty: questionDifficulty,
            category: quizMeta.category || aiTopic, makePublic: quizMeta.visibility === 'public',
          });
          onClose();
          navigate(`/quizzes/${res.data.quiz._id}/edit`);
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'AI generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <AlertModal message={errorMsg} onClose={() => setErrorMsg('')} />
      <div className="bg-surface-container border border-primary/20 rounded-2xl shadow-2xl w-full max-w-md space-y-5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <h3 className="text-h3 font-bold text-on-surface">AI Generate</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-variant text-on-surface-variant transition-all">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <div className="px-6 space-y-4">
          {/* Generate type toggle */}
          <div className="flex bg-surface-container-high rounded-xl p-1 gap-1">
            {[
              { key: 'questions', label: 'Add Questions', icon: 'bolt' },
              { key: 'full', label: 'Full Quiz', icon: 'rocket_launch' },
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setGenerateMode(key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-body-sm font-medium transition-all ${generateMode === key ? 'bg-primary-container text-white' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                <span className="material-symbols-outlined text-sm">{icon}</span>
                {label}
              </button>
            ))}
          </div>

          {generateMode === 'full' && (
            <p className="text-body-sm text-on-surface-variant bg-surface-container-low rounded-lg px-3 py-2 border border-outline-variant/20">
              Creates a complete new quiz with all questions in one go.
            </p>
          )}

          {/* Input mode tabs */}
          <div className="flex bg-surface-container-high rounded-xl p-1 gap-1">
            {[
              { key: 'topic', label: 'By Topic', icon: 'edit_note' },
              { key: 'file', label: 'From File', icon: 'upload_file' },
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setAiMode(key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-body-sm font-medium transition-all ${aiMode === key ? 'bg-surface-container text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                <span className="material-symbols-outlined text-sm">{icon}</span>
                {label}
              </button>
            ))}
          </div>

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
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={handleGenerate}
            disabled={aiLoading || !canGenerate}
            className="w-full py-3 bg-primary-container text-white font-bold rounded-xl hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              {generateMode === 'full' ? 'rocket_launch' : 'bolt'}
            </span>
            {aiLoading ? 'Generating...' : generateMode === 'full' ? 'Generate Full Quiz' : 'Generate Questions'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Host Live Modal ── */
function HostLiveModal({ open, onClose, onConfirm, defaultTimePerQuestion }) {
  const DURATION_PRESETS = [
    { label: '15 min', value: 900 },
    { label: '30 min', value: 1800 },
    { label: '45 min', value: 2700 },
    { label: '1 hr', value: 3600 },
    { label: '1.5 hr', value: 5400 },
    { label: '2 hr', value: 7200 },
  ];

  const [sessionDuration, setSessionDuration] = useState(1800); // default 30 min
  const [customMinutes, setCustomMinutes] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [timePerQuestion, setTimePerQuestion] = useState(defaultTimePerQuestion || 30);
  const [starting, setStarting] = useState(false);

  if (!open) return null;

  const effectiveDuration = useCustom
    ? (parseInt(customMinutes, 10) || 0) * 60
    : sessionDuration;

  const isValid = effectiveDuration > 0 && timePerQuestion > 0;

  const handleStart = async () => {
    if (!isValid) return;
    setStarting(true);
    try {
      await onConfirm({ sessionDuration: effectiveDuration, isPublic, settings: { timePerQuestion, shuffleQuestions } });
    } finally {
      setStarting(false);
    }
  };

  const fmt = (secs) => {
    const m = Math.floor(secs / 60);
    const h = Math.floor(m / 60);
    return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-container border border-outline-variant/40 rounded-2xl shadow-2xl w-full max-w-md space-y-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-outline-variant/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-tertiary/15 flex items-center justify-center">
              <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>live_tv</span>
            </div>
            <h3 className="text-h3 font-bold text-on-surface">Host Live Session</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-variant text-on-surface-variant transition-all">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Session Duration */}
          <div className="space-y-3">
            <label className="text-label-caps text-on-surface-variant flex items-center gap-1">
              SESSION DURATION
              <span className="text-error">*</span>
            </label>
            <p className="text-[11px] text-on-surface-variant -mt-1">How long participants have to complete the quiz</p>

            {/* Preset grid */}
            <div className="grid grid-cols-3 gap-2">
              {DURATION_PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => { setSessionDuration(p.value); setUseCustom(false); }}
                  className={`py-2.5 rounded-xl border font-bold text-body-sm transition-all ${
                    !useCustom && sessionDuration === p.value
                      ? 'bg-tertiary/20 border-tertiary/50 text-tertiary'
                      : 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant hover:border-outline-variant'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom input */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setUseCustom(true)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-body-sm font-medium transition-all ${
                  useCustom
                    ? 'bg-tertiary/20 border-tertiary/50 text-tertiary'
                    : 'border-outline-variant/30 text-on-surface-variant hover:border-outline-variant'
                }`}
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                Custom
              </button>
              {useCustom && (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="number"
                    min={1}
                    max={480}
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    autoFocus
                    className="w-20 bg-surface-container-low border border-tertiary/40 rounded-lg px-3 py-2 text-on-surface text-body-sm focus:border-tertiary outline-none transition-all text-center font-mono"
                    placeholder="30"
                  />
                  <span className="text-on-surface-variant text-body-sm">minutes</span>
                </div>
              )}
            </div>

            {/* Duration summary */}
            {effectiveDuration > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-tertiary/5 border border-tertiary/20 rounded-lg">
                <span className="material-symbols-outlined text-tertiary text-[16px]">schedule</span>
                <span className="text-body-sm text-tertiary font-medium">
                  Participants get <strong>{fmt(effectiveDuration)}</strong> to complete the quiz
                </span>
              </div>
            )}
          </div>

          {/* Time per question */}
          <div className="space-y-2">
            <label className="text-label-caps text-on-surface-variant">TIME PER QUESTION (seconds)</label>
            <input
              type="number"
              min={5}
              max={300}
              value={timePerQuestion}
              onChange={(e) => setTimePerQuestion(Number(e.target.value))}
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2.5 text-on-surface text-body-sm focus:border-primary-container outline-none transition-all"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            {[
              { key: 'isPublic', label: 'Public session', desc: 'Visible in the Live Games hub', value: isPublic, set: setIsPublic, icon: 'public' },
              { key: 'shuffle', label: 'Shuffle questions', desc: 'Randomise question order', value: shuffleQuestions, set: setShuffleQuestions, icon: 'shuffle' },
            ].map(({ key, label, desc, value, set, icon }) => (
              <button
                key={key}
                onClick={() => set((v) => !v)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-outline-variant/30 hover:bg-surface-container-low transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined text-[18px] ${value ? 'text-primary' : 'text-on-surface-variant'}`}>{icon}</span>
                  <div className="text-left">
                    <p className="text-body-sm font-medium text-on-surface">{label}</p>
                    <p className="text-[11px] text-on-surface-variant">{desc}</p>
                  </div>
                </div>
                <div className={`w-10 h-6 rounded-full transition-all relative ${value ? 'bg-primary-container' : 'bg-surface-container-high border border-outline-variant/40'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${value ? 'left-5' : 'left-1'}`} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={handleStart}
            disabled={!isValid || starting}
            className="w-full py-3 bg-tertiary text-on-tertiary font-bold rounded-xl hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>live_tv</span>
            {starting ? 'Creating session...' : 'Start Live Session'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function QuizCreatorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { createQuiz, updateQuiz, fetchQuiz } = useQuizStore();
  const { createQuestion } = useQuestionStore();

  const [quizMeta, setQuizMeta] = useState({ title: '', category: '', description: '', timeLimit: 30, shuffleQuestions: false, visibility: 'draft' });
  const [question, setQuestion] = useState(EMPTY_QUESTION);
  const [savedQuestions, setSavedQuestions] = useState([]);
  const [aiDraft, setAiDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [hostLiveModalOpen, setHostLiveModalOpen] = useState(false);

  // Modal state
  const [alertMsg, setAlertMsg] = useState('');
  const [confirmState, setConfirmState] = useState({ message: '', onConfirm: null });

  const showAlert = (msg) => setAlertMsg(msg);
  const showConfirm = (msg, onConfirm) => setConfirmState({ message: msg, onConfirm });

  useEffect(() => {
    if (id) {
      fetchQuiz(id).then((quiz) => {
        setQuizMeta({ title: quiz.title, category: quiz.category, description: quiz.description, timeLimit: quiz.timeLimit, shuffleQuestions: quiz.shuffleQuestions, visibility: quiz.visibility });
        setSavedQuestions(quiz.questions || []);
      });
    }
  }, [id]);

  const handleSaveQuestion = async () => {
    if (!question.stem || !question.category) return showAlert('Fill in question stem and category');
    setSaving(true);
    try {
      let quizId = id;
      if (!quizId) {
        if (!quizMeta.title || !quizMeta.category) return showAlert('Fill in quiz title and category first');
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
      showAlert(err.response?.data?.message || 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAiDraft = async () => {
    if (!aiDraft) return;
    setSaving(true);
    try {
      let quizId = id;
      if (!quizId) {
        if (!quizMeta.title || !quizMeta.category) return showAlert('Fill in quiz title and category first');
        const quiz = await createQuiz(quizMeta);
        quizId = quiz._id;
        navigate(`/quizzes/${quizId}/edit`, { replace: true });
      }
      const q = await createQuestion({ ...aiDraft, isPublic: false });
      await api.post(`/quizzes/${quizId}/questions`, { questionId: q._id });
      setSavedQuestions((prev) => [...prev, q]);
      setAiDraft(null);
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to add question');
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
      showAlert(err.response?.data?.message || 'Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  const handleAddFromBank = async (questions) => {
    setSaving(true);
    try {
      let quizId = id;
      if (!quizId) {
        if (!quizMeta.title || !quizMeta.category) {
          showAlert('Fill in quiz title and category first');
          setSaving(false);
          return;
        }
        const quiz = await createQuiz(quizMeta);
        quizId = quiz._id;
        navigate(`/quizzes/${quizId}/edit`, { replace: true });
      }
      for (const q of questions) {
        await api.post(`/quizzes/${quizId}/questions`, { questionId: q._id });
      }
      setSavedQuestions((prev) => [...prev, ...questions]);
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to add questions');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFromBank = async (questions) => {
    if (!id) return;
    setSaving(true);
    try {
      for (const q of questions) {
        await api.delete(`/quizzes/${id}/questions/${q._id}`);
      }
      const removeIds = new Set(questions.map((q) => q._id));
      setSavedQuestions((prev) => prev.filter((q) => !removeIds.has(q._id)));
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to remove questions');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Modals */}
      <AlertModal message={alertMsg} onClose={() => setAlertMsg('')} />
      <ConfirmModal
        message={confirmState.message}
        onConfirm={() => { confirmState.onConfirm?.(); setConfirmState({ message: '', onConfirm: null }); }}
        onCancel={() => setConfirmState({ message: '', onConfirm: null })}
      />
      <AiGenerateModal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        quizMeta={quizMeta}
        questionDifficulty={question.difficulty}
        onQuestionsGenerated={(draft) => setAiDraft(draft)}
        onFullQuizCreated={() => {}}
      />
      <QuestionBankModal
        open={bankModalOpen}
        onClose={() => setBankModalOpen(false)}
        alreadyAdded={savedQuestions.map((q) => q._id)}
        onAdd={handleAddFromBank}
        onRemove={handleRemoveFromBank}
      />
      <HostLiveModal
        open={hostLiveModalOpen}
        onClose={() => setHostLiveModalOpen(false)}
        defaultTimePerQuestion={quizMeta.timeLimit}
        onConfirm={async ({ sessionDuration, isPublic, settings }) => {
          try {
            const { data } = await api.post('/live/session', {
              quizId: id,
              sessionDuration,
              isPublic,
              settings,
            });
            setHostLiveModalOpen(false);
            navigate(`/live/${data.code.replace(/\s+/g, '-')}/lobby`);
          } catch (err) {
            showAlert(err.response?.data?.message || 'Failed to start live session');
          }
        }}
      />

      {/* Top bar */}
      <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 flex justify-between items-center px-6 py-3 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="text-xl font-bold text-primary tracking-tighter">Quiz Creator</div>
          <div className="h-4 w-px bg-slate-800 mx-2" />
          <div className="flex items-center gap-1">
            <input
              value={quizMeta.title}
              onChange={(e) => setQuizMeta({ ...quizMeta, title: e.target.value })}
              className="bg-transparent text-on-surface-variant text-body-sm font-medium outline-none border-b border-transparent focus:border-outline-variant transition-all"
              placeholder="Untitled Quiz..."
            />
            <span className="text-error text-sm font-bold leading-none">*</span>
          </div>
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
                  { key: 'category', label: 'CATEGORY', placeholder: 'e.g. Computer Science', required: true },
                  { key: 'description', label: 'DESCRIPTION', placeholder: 'Brief description...' },
                ].map(({ key, label, placeholder, required }) => (
                  <div key={key} className="space-y-sm">
                    <label className="text-label-caps text-on-surface-variant">
                      {label}{required && <span className="text-error ml-0.5">*</span>}
                    </label>
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
              <div className="relative z-10 space-y-md">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  <h3 className="text-h3 font-bold text-on-surface">AI Power-Up Zone</h3>
                </div>
                <p className="text-body-sm text-on-surface-variant">
                  Generate individual questions or an entire quiz using AI — by topic or from a file.
                </p>
                <button
                  onClick={() => setAiModalOpen(true)}
                  className="w-full py-3 bg-primary-container text-white font-bold rounded-xl hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                  Generate with AI
                </button>
              </div>
            </div>

            {/* Question Bank */}
            <div className="bg-surface-container rounded-xl p-lg border border-tertiary/20">
              <div className="flex items-center gap-2 mb-sm">
                <div className="w-7 h-7 rounded-lg bg-tertiary/15 flex items-center justify-center">
                  <span className="material-symbols-outlined text-tertiary text-[16px]">account_balance</span>
                </div>
                <h3 className="text-body-md font-bold text-on-surface">Question Bank</h3>
              </div>
              <p className="text-body-sm text-on-surface-variant mb-md">
                Pick existing questions from your bank and add or remove them from this quiz.
              </p>
              <button
                onClick={() => setBankModalOpen(true)}
                className="w-full py-2.5 border border-tertiary/30 text-tertiary font-bold rounded-xl hover:bg-tertiary/10 transition-all active:scale-95 flex items-center justify-center gap-2 text-body-sm"
              >
                <span className="material-symbols-outlined text-sm">add_circle</span>
                Browse & Add Questions
              </button>
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
              onClick={() => setHostLiveModalOpen(true)}
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
