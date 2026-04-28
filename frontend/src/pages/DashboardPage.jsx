import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useQuizStore } from '../store/quizStore';
import api from '../lib/axios';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { myQuizzes, publicQuizzes, fetchMyQuizzes, fetchPublicQuizzes } = useQuizStore();
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyQuizzes();
    fetchPublicQuizzes();
    api.get('/users/me/stats').then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  const statCards = [
    { label: 'ACTIVE SESSIONS', value: myQuizzes.filter(q => q.liveSessionActive).length, icon: 'timer', color: 'text-primary' },
    { label: 'TOTAL QUIZZES', value: myQuizzes.length, icon: 'quiz', color: 'text-tertiary' },
    { label: 'ACCURACY', value: stats ? `${stats.accuracy}%` : '—', icon: 'verified', color: 'text-secondary-fixed-dim' },
    { label: 'XP EARNED', value: stats ? stats.xp.toLocaleString() : '—', icon: 'bolt', color: 'text-tertiary' },
  ];

  return (
    <div className="p-6 md:p-10 space-y-10 max-w-7xl mx-auto w-full">
      {/* Welcome */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-h1 font-bold text-white">Welcome back, {user?.name?.split(' ')[0]}.</h2>
          <p className="text-body-lg text-slate-400">
            {stats?.streak > 0 ? `🔥 ${stats.streak}-day streak! Keep the momentum.` : 'Ready to learn something new today?'}
          </p>
        </div>
        {stats?.streak > 0 && (
          <div className="px-4 py-2 glass-panel rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Daily Streak</p>
              <p className="text-body-md font-bold text-white">{stats.streak} Days</p>
            </div>
          </div>
        )}
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
        {statCards.map(({ label, value, icon, color }) => (
          <div key={label} className="glass-panel p-md rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center">
              <span className={`material-symbols-outlined ${color}`}>{icon}</span>
            </div>
            <div>
              <p className="text-label-caps text-slate-500">{label}</p>
              <p className="text-h3 font-bold text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* My Quizzes */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-h3 font-bold text-white">My Quizzes</h3>
          <button onClick={() => navigate('/quizzes')} className="text-body-sm text-primary hover:underline font-bold flex items-center gap-1">
            View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {myQuizzes.slice(0, 4).map((quiz) => (
            <QuizCard key={quiz._id} quiz={quiz} onClick={() => navigate(`/quizzes/${quiz._id}/edit`)} />
          ))}
          {myQuizzes.length === 0 && (
            <div className="col-span-4 glass-panel rounded-xl p-10 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-600 mb-3 block">quiz</span>
              <p className="text-on-surface-variant">No quizzes yet.</p>
              <button onClick={() => navigate('/quizzes/create')} className="mt-4 px-6 py-2 bg-primary-container text-white rounded-xl font-bold hover:brightness-110 transition-all">
                Create your first quiz
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Community */}
      <section className="space-y-6">
        <h3 className="text-h3 font-bold text-white">Community Favorites</h3>
        <div className="glass-panel rounded-2xl p-lg border-slate-800">
          <div className="flex flex-col gap-4">
            {publicQuizzes.slice(0, 4).map((quiz) => (
              <div key={quiz._id} className="flex items-center justify-between p-4 rounded-xl bg-slate-900/30 border border-slate-800/50 hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center text-primary-container">
                    <span className="material-symbols-outlined">quiz</span>
                  </div>
                  <div>
                    <h5 className="text-body-md font-bold text-white">{quiz.title}</h5>
                    <p className="text-body-sm text-slate-500">by <span className="text-slate-300">{quiz.createdBy?.name}</span> · {quiz.questions?.length || 0} questions</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/quizzes/${quiz._id}/play`)}
                  className="px-6 py-2 bg-transparent border border-primary-container text-primary-container rounded-lg font-bold text-sm hover:bg-primary-container hover:text-white transition-all"
                >
                  Start Quiz
                </button>
              </div>
            ))}
            {publicQuizzes.length === 0 && (
              <p className="text-center text-on-surface-variant py-6">No public quizzes yet. Be the first to publish one!</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function QuizCard({ quiz, onClick }) {
  const icons = ['science', 'terminal', 'architecture', 'history_edu', 'psychology', 'language'];
  const icon = icons[Math.floor(Math.random() * icons.length)];
  return (
    <div onClick={onClick} className="glass-panel rounded-xl overflow-hidden hover:scale-[1.02] transition-transform cursor-pointer group border-slate-800">
      <div className="h-32 bg-slate-900 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 abstract-node-bg" />
        <span className="material-symbols-outlined text-4xl text-primary opacity-50 group-hover:opacity-100 transition-opacity">{icon}</span>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <h4 className="font-bold text-white leading-tight text-body-md">{quiz.title}</h4>
          <span className="material-symbols-outlined text-slate-500 text-sm">more_vert</span>
        </div>
        <div className="flex items-center gap-2 text-label-caps text-slate-500">
          <span className="material-symbols-outlined text-[14px]">quiz</span>
          {quiz.questions?.length || 0} Questions
        </div>
        <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
          <span className={`text-label-caps ${quiz.visibility === 'public' ? 'text-tertiary' : quiz.visibility === 'draft' ? 'text-slate-500' : 'text-primary'}`}>
            {quiz.visibility.charAt(0).toUpperCase() + quiz.visibility.slice(1)}
          </span>
          {quiz.isAiGenerated && (
            <span className="text-[10px] text-secondary-fixed-dim flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">auto_awesome</span> AI
            </span>
          )}
        </div>
      </div>
    </div>
  );
}