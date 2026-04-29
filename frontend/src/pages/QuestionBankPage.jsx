import { useEffect, useState } from 'react';
import { useQuestionStore } from '../store/questionStore';

const DIFFICULTIES = ['', 'easy', 'medium', 'hard', 'expert'];
const DIFF_COLORS = { easy: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', medium: 'text-orange-400 bg-orange-500/10 border-orange-500/20', hard: 'text-rose-400 bg-rose-500/10 border-rose-500/20', expert: 'text-purple-400 bg-purple-500/10 border-purple-500/20' };

export default function QuestionBankPage() {
  const { questions, total, pages, fetchQuestions, deleteQuestion } = useQuestionStore();
  const [filters, setFilters] = useState({ difficulty: '', category: '', search: '', page: 1, mine: false });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchQuestions({ ...filters, mine: filters.mine ? 'true' : undefined });
  }, [filters]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this question?')) return;
    await deleteQuestion(id);
  };

  return (
    <div className="flex min-h-full overflow-hidden">
      {/* Filter Sidebar */}
      <aside className="w-64 bg-surface border-r border-slate-800 overflow-y-auto custom-scrollbar p-6 shrink-0">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-primary">Filters</h3>
          <button onClick={() => setFilters({ difficulty: '', category: '', search: '', page: 1, mine: false })} className="text-xs text-slate-500 hover:text-slate-300">Clear</button>
        </div>
        <div className="space-y-8">
          <section>
            <label className="block text-xs font-bold text-slate-400 mb-4 uppercase tracking-tighter">Difficulty</label>
            <div className="space-y-2">
              {DIFFICULTIES.filter(Boolean).map((d) => (
                <label key={d} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="difficulty"
                    checked={filters.difficulty === d}
                    onChange={() => setFilters({ ...filters, difficulty: d, page: 1 })}
                    className="border-slate-700 bg-slate-900 text-primary-container focus:ring-0"
                  />
                  <span className="text-sm text-slate-300 group-hover:text-white capitalize">{d}</span>
                </label>
              ))}
            </div>
          </section>
          <section>
            <label className="block text-xs font-bold text-slate-400 mb-4 uppercase tracking-tighter">Source</label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.mine}
                onChange={(e) => setFilters({ ...filters, mine: e.target.checked, page: 1 })}
                className="rounded border-slate-700 bg-slate-900 text-primary-container focus:ring-0"
              />
              <span className="text-sm text-slate-300">My Questions Only</span>
            </label>
          </section>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">Asset Repository</p>
              <h2 className="text-h2 font-bold text-white">Question Bank</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Total</span>
                <span className="text-xl font-black text-white">{total.toLocaleString()}</span>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
                <input
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                  className="bg-surface-container border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-slate-300 focus:outline-none focus:border-primary-container transition-all text-body-sm"
                  placeholder="Search questions..."
                />
              </div>
            </div>
          </div>

          {/* Cards */}
          <div className="space-y-4">
            {questions.map((q) => (
              <div key={q._id} className="group bg-surface-container-low border border-slate-800 hover:border-primary/50 p-5 rounded-2xl transition-all duration-300">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="text-[10px] font-mono text-slate-500 uppercase">ID: {q._id?.slice(-6)}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${DIFF_COLORS[q.difficulty] || ''}`}>{q.difficulty}</span>
                      <div className="flex items-center gap-1.5 ml-2">
                        <span className="material-symbols-outlined text-xs text-tertiary">bolt</span>
                        <span className="text-[10px] font-bold text-slate-400">Success: <span className="text-white">{q.successRate ?? 0}%</span></span>
                      </div>
                      {q.aiGenerated && (
                        <span className="text-[10px] text-secondary-fixed-dim flex items-center gap-1">
                          <span className="material-symbols-outlined text-[10px]">auto_awesome</span> AI
                        </span>
                      )}
                    </div>
                    <h4 className="text-white font-semibold mb-3 group-hover:text-primary transition-colors">{q.stem}</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-surface-variant text-slate-300 text-[10px] font-medium px-2 py-1 rounded">{q.category}</span>
                      {q.tags?.map((tag) => (
                        <span key={tag} className="bg-surface-variant text-slate-300 text-[10px] font-medium px-2 py-1 rounded">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-6">
                    <button
                      onClick={() => handleDelete(q._id)}
                      className="p-2 rounded-lg text-slate-500 hover:text-error hover:bg-error-container/20 transition-all"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {questions.length === 0 && (
              <div className="text-center py-16">
                <span className="material-symbols-outlined text-4xl text-slate-600 mb-3 block">search_off</span>
                <p className="text-on-surface-variant">No questions found.</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="mt-12 flex items-center justify-between border-t border-slate-800 pt-6">
              <span className="text-sm text-slate-500">Page {filters.page} of {pages}</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={filters.page <= 1}
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 hover:text-white transition-colors disabled:opacity-30"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setFilters({ ...filters, page: p })}
                    className={`w-8 h-8 rounded-lg text-sm font-bold ${filters.page === p ? 'bg-primary-container text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'}`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  disabled={filters.page >= pages}
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 hover:text-white transition-colors disabled:opacity-30"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}