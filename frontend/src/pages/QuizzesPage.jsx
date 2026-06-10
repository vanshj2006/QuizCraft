import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizStore } from '../store/quizStore';
import { AlertModal, ConfirmModal } from '../components/ConfirmModal';

const TABS = ['My Quizzes', 'Community'];

function QuizCardMenu({ quiz, onDelete, onPublish, navigate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${open ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-200 hover:bg-slate-700/60'}`}
      >
        <span className="material-symbols-outlined text-[18px]">more_vert</span>
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-30 w-44 bg-slate-800 border border-slate-700/60 rounded-xl shadow-2xl py-1 overflow-hidden">
          <button
            onClick={() => { navigate(`/quizzes/${quiz._id}/edit`); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700/70 transition-colors text-left"
          >
            <span className="material-symbols-outlined text-[15px] text-slate-400">edit</span>
            Edit
          </button>
          <button
            onClick={() => { navigate(`/quizzes/${quiz._id}/play`); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700/70 transition-colors text-left"
          >
            <span className="material-symbols-outlined text-[15px] text-slate-400">play_circle</span>
            Play
          </button>
          {quiz.visibility !== 'public' && (
            <button
              onClick={() => { onPublish(quiz._id); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-emerald-400 hover:bg-emerald-500/10 transition-colors text-left"
            >
              <span className="material-symbols-outlined text-[15px]">publish</span>
              Publish
            </button>
          )}
          <div className="h-px bg-slate-700/60 my-1" />
          <button
            onClick={() => { onDelete(quiz._id); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left"
          >
            <span className="material-symbols-outlined text-[15px]">delete</span>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function QuizzesPage() {
  const { myQuizzes, publicQuizzes, fetchMyQuizzes, fetchPublicQuizzes, deleteQuiz, publishQuiz } = useQuizStore();
  const [tab, setTab] = useState('My Quizzes');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const [alertMsg, setAlertMsg] = useState('');
  const [confirmState, setConfirmState] = useState({ message: '', onConfirm: null });

  useEffect(() => {
    fetchMyQuizzes();
    fetchPublicQuizzes();
  }, []);

  const filtered = (tab === 'My Quizzes' ? myQuizzes : publicQuizzes).filter((q) =>
    q.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id, e) => {
    if (e) e.stopPropagation();
    setConfirmState({
      message: 'Delete this quiz? This cannot be undone.',
      onConfirm: () => deleteQuiz(id),
    });
  };

  const handlePublish = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await publishQuiz(id);
    } catch (err) {
      setAlertMsg(err.response?.data?.message || 'Failed to publish');
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
      <AlertModal message={alertMsg} onClose={() => setAlertMsg('')} />
      <ConfirmModal
        message={confirmState.message}
        onConfirm={() => { confirmState.onConfirm?.(); setConfirmState({ message: '', onConfirm: null }); }}
        onCancel={() => setConfirmState({ message: '', onConfirm: null })}
      />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">Content Library</p>
          <h2 className="text-h2 font-bold text-white">Quizzes</h2>
        </div>
        <button
          onClick={() => navigate('/quizzes/create')}
          className="px-6 py-3 bg-primary-container text-white font-bold rounded-xl flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined">add</span>
          New Quiz
        </button>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex bg-surface-container-high rounded-xl p-1 gap-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-body-sm font-medium transition-all ${
                tab === t ? 'bg-primary-container text-white' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-container border border-outline-variant/30 rounded-xl py-2 pl-10 pr-4 text-body-sm text-on-surface outline-none focus:border-primary-container transition-all"
            placeholder="Search quizzes..."
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((quiz) => (
          <div
            key={quiz._id}
            onClick={() => navigate(tab === 'My Quizzes' ? `/quizzes/${quiz._id}/edit` : `/quizzes/${quiz._id}/play`)}
            className="glass-panel rounded-xl hover:scale-[1.02] transition-transform cursor-pointer group border-slate-800"
          >
            <div className="h-28 bg-slate-900 flex items-center justify-center relative overflow-hidden rounded-t-xl">
              <div className="absolute inset-0 opacity-10 abstract-node-bg" />
              <span className="material-symbols-outlined text-3xl text-primary opacity-50 group-hover:opacity-100 transition-opacity">quiz</span>

            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-bold text-white leading-tight">{quiz.title}</h4>
                {tab === 'My Quizzes' && (
                  <QuizCardMenu
                    quiz={quiz}
                    onDelete={handleDelete}
                    onPublish={handlePublish}
                    navigate={navigate}
                  />
                )}
              </div>
              <p className="text-body-sm text-slate-500">{quiz.category} · {quiz.questions?.length || 0} Qs</p>
              <div className="pt-2 border-t border-slate-800">
                <span className={`text-label-caps ${quiz.visibility === 'public' ? 'text-tertiary' : quiz.visibility === 'draft' ? 'text-slate-500' : 'text-primary'}`}>
                  {quiz.visibility}
                </span>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full glass-panel rounded-xl p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-600 mb-3 block">search_off</span>
            <p className="text-on-surface-variant">No quizzes found.</p>
          </div>
        )}
      </div>
    </div>
  );
}