import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizStore } from '../store/quizStore';

const TABS = ['My Quizzes', 'Community'];

export default function QuizzesPage() {
  const { myQuizzes, publicQuizzes, fetchMyQuizzes, fetchPublicQuizzes, deleteQuiz, publishQuiz } = useQuizStore();
  const [tab, setTab] = useState('My Quizzes');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyQuizzes();
    fetchPublicQuizzes();
  }, []);

  const filtered = (tab === 'My Quizzes' ? myQuizzes : publicQuizzes).filter((q) =>
    q.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this quiz?')) return;
    await deleteQuiz(id);
  };

  const handlePublish = async (id, e) => {
    e.stopPropagation();
    try {
      await publishQuiz(id);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to publish');
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
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
            className="glass-panel rounded-xl overflow-hidden hover:scale-[1.02] transition-transform cursor-pointer group border-slate-800"
          >
            <div className="h-28 bg-slate-900 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 abstract-node-bg" />
              <span className="material-symbols-outlined text-3xl text-primary opacity-50 group-hover:opacity-100 transition-opacity">quiz</span>
              {quiz.isAiGenerated && (
                <span className="absolute top-2 right-2 flex items-center gap-1 bg-secondary-container/20 text-secondary-fixed-dim text-[10px] font-bold px-2 py-0.5 rounded-full border border-secondary-container/30">
                  <span className="material-symbols-outlined text-[10px]">auto_awesome</span> AI
                </span>
              )}
            </div>
            <div className="p-4 space-y-3">
              <h4 className="font-bold text-white leading-tight">{quiz.title}</h4>
              <p className="text-body-sm text-slate-500">{quiz.category} · {quiz.questions?.length || 0} Qs</p>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <span className={`text-label-caps ${quiz.visibility === 'public' ? 'text-tertiary' : quiz.visibility === 'draft' ? 'text-slate-500' : 'text-primary'}`}>
                  {quiz.visibility}
                </span>
                {tab === 'My Quizzes' && (
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    {quiz.visibility !== 'public' && (
                      <button
                        onClick={(e) => handlePublish(quiz._id, e)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-tertiary hover:bg-tertiary/10 transition-all"
                        title="Publish"
                      >
                        <span className="material-symbols-outlined text-sm">publish</span>
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(quiz._id, e)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-error hover:bg-error-container/20 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                )}
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