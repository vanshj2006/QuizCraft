import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';

const STATUS_COLORS = {
  waiting: 'text-tertiary bg-tertiary/10 border-tertiary/30',
  active: 'text-primary bg-primary/10 border-primary/30',
};

const STATUS_LABELS = {
  waiting: 'Waiting',
  active: 'Live',
};

export default function LiveGamesPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/live/public');
      setSessions(data.sessions || []);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const handleJoin = (code) => {
    const slug = code.replace(/\s+/, '-');
    navigate(`/live/${slug}/lobby`);
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">Real-Time</p>
          <h2 className="text-h2 font-bold text-white flex items-center gap-3">
            Live Games
            <span className="flex items-center gap-1.5 text-body-sm font-medium text-tertiary bg-tertiary/10 border border-tertiary/20 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
              {sessions.length} active
            </span>
          </h2>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/join')}
            className="px-4 py-2 border border-outline-variant/40 text-on-surface-variant text-body-sm font-bold rounded-xl hover:bg-surface-variant transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">vpn_key</span>
            Enter Code
          </button>
          <button
            onClick={load}
            className="px-4 py-2 bg-surface-container border border-outline-variant/30 text-on-surface-variant text-body-sm rounded-xl hover:bg-surface-variant transition-all flex items-center gap-2"
            title="Refresh"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
          </button>
        </div>
      </div>

      {/* Sessions grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-36 bg-surface-container rounded-2xl animate-pulse border border-outline-variant/20" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="glass-panel rounded-2xl p-16 text-center border border-white/5">
          <span className="material-symbols-outlined text-5xl text-slate-600 block mb-4">live_tv</span>
          <p className="text-on-surface-variant text-body-md font-medium">No public live games right now</p>
          <p className="text-slate-600 text-body-sm mt-1">Public sessions appear here when hosts go live</p>
          <button
            onClick={() => navigate('/join')}
            className="mt-6 px-6 py-2.5 bg-primary-container text-white font-bold rounded-xl hover:brightness-110 transition-all text-body-sm"
          >
            Join with a code instead
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessions.map((session) => (
            <div
              key={session._id}
              className="bg-surface-container border border-outline-variant/20 hover:border-primary/40 rounded-2xl p-5 transition-all group cursor-pointer"
              onClick={() => handleJoin(session.code)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {session.host?.avatar ? (
                    <img src={session.host.avatar} className="w-9 h-9 rounded-full object-cover border border-outline-variant/30" alt="host" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-surface-container-high border border-outline-variant/30 flex items-center justify-center">
                      <span className="material-symbols-outlined text-slate-400 text-lg">person</span>
                    </div>
                  )}
                  <div>
                    <p className="text-white font-bold text-body-sm leading-tight">{session.quiz?.title}</p>
                    <p className="text-slate-500 text-[11px]">{session.host?.name}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[session.status] || ''}`}>
                  {STATUS_LABELS[session.status] || session.status}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">category</span>
                    {session.quiz?.category || 'General'}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">group</span>
                    {session.participants?.length || 0} players
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">timer</span>
                    {session.settings?.timePerQuestion || 30}s/q
                  </span>
                </div>
                <button className="text-primary text-body-sm font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Join <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Join by code hint */}
      <div className="glass-panel rounded-2xl p-5 border border-white/5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-lg">vpn_key</span>
          </div>
          <div>
            <p className="text-white font-bold text-body-sm">Have a private code?</p>
            <p className="text-slate-500 text-[11px]">Join a private session using the invite code or link your host shared with you.</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/join')}
          className="shrink-0 px-4 py-2 bg-primary-container text-white text-body-sm font-bold rounded-xl hover:brightness-110 transition-all"
        >
          Enter Code
        </button>
      </div>
    </div>
  );
}
