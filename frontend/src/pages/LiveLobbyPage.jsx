import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

export default function LiveLobbyPage() {
  const { code } = useParams();
  const sessionCode = code.replace('-', ' ');
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [session, setSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [activity, setActivity] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [latency, setLatency] = useState(0);

  useEffect(() => {
    const socket = io('/', { withCredentials: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('lobby:join', { code: sessionCode, userId: user?._id, guestName: user?.name });
    });

    socket.on('lobby:joined', ({ session: s }) => {
      setSession(s);
    });

    socket.on('lobby:update', ({ participants: p }) => {
      setParticipants(p);
    });

    socket.on('lobby:activity', (event) => {
      setActivity((prev) => [event, ...prev].slice(0, 10));
    });

    socket.on('quiz:question', () => {
      navigate(`/live/${code}/session`);
    });

    // Latency ping
    const pingInterval = setInterval(() => {
      const start = Date.now();
      socket.emit('ping', () => setLatency(Date.now() - start));
    }, 3000);

    return () => {
      clearInterval(pingInterval);
      socket.disconnect();
    };
  }, [code]);

  const handleStart = () => {
    socketRef.current?.emit('host:start', { code: sessionCode });
  };

  return (
    <div className="flex min-h-full dot-grid">
      <div className="flex-1 p-8 grid grid-cols-12 gap-gutter max-w-[1600px] mx-auto w-full">

        {/* Left: Session Controls */}
        <section className="col-span-12 lg:col-span-3 space-y-lg">
          <div className="bg-surface-container p-lg rounded-xl border border-outline-variant">
            <h3 className="text-label-caps text-on-surface-variant mb-6 uppercase tracking-widest">Session Controls</h3>
            <div className="space-y-md">
              <div className="p-md rounded-lg bg-surface-container-high flex items-center justify-between border border-outline-variant/30">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">timer</span>
                  <span className="text-body-md font-medium">Time per Q</span>
                </div>
                <span className="text-body-sm font-mono text-tertiary">{session?.settings?.timePerQuestion || 30}s</span>
              </div>
              <div className="p-md rounded-lg bg-surface-container-high flex items-center justify-between border border-outline-variant/30">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">wifi</span>
                  <span className="text-body-md font-medium">Latency</span>
                </div>
                <span className="text-body-sm font-mono text-tertiary">{latency}ms</span>
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-surface-container p-lg rounded-xl border border-outline-variant flex flex-col">
            <div className="flex items-center justify-between mb-lg">
              <h3 className="text-label-caps text-on-surface-variant uppercase tracking-widest">Recent Activity</h3>
              <span className="material-symbols-outlined text-slate-600">history</span>
            </div>
            <div className="space-y-3">
              {activity.map((a, i) => (
                <div key={i} className="flex items-center gap-3 text-body-sm py-2 border-b border-slate-800">
                  <span className="text-tertiary font-mono text-xs">{new Date(a.timestamp).toLocaleTimeString()}</span>
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[12px]">person_add</span>
                  </div>
                  <span className="text-on-surface"><strong>{a.name}</strong> joined</span>
                </div>
              ))}
              {activity.length === 0 && <p className="text-on-surface-variant text-body-sm">Waiting for participants...</p>}
            </div>
          </div>
        </section>

        {/* Center: Join Code */}
        <section className="col-span-12 lg:col-span-6 flex flex-col gap-lg">
          <div className="bg-surface-container-high p-xxl rounded-xl border border-primary/30 flex flex-col items-center justify-center text-center relative overflow-hidden glow-primary">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle className="text-primary" cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeWidth="0.1" />
                <circle className="text-primary" cx="50" cy="50" fill="none" r="35" stroke="currentColor" strokeWidth="0.1" />
                <line className="text-primary" stroke="currentColor" strokeWidth="0.1" x1="0" x2="100" y1="50" y2="50" />
                <line className="text-primary" stroke="currentColor" strokeWidth="0.1" x1="50" x2="50" y1="0" y2="100" />
              </svg>
            </div>
            <span className="text-label-caps text-primary tracking-[0.3em] mb-4">JOIN AT QUIZ.CRAFT/LIVE</span>
            <h2 className="text-[72px] font-black tracking-tighter leading-none text-white mb-xl font-lexend">
              {sessionCode}
            </h2>
            <div className="flex items-center gap-4 relative z-10">
              <button
                onClick={() => navigator.clipboard.writeText(sessionCode)}
                className="px-lg py-md bg-primary-container text-white rounded-xl font-bold flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined">content_copy</span>
                Copy Code
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between bg-surface-container p-md rounded-xl border border-outline-variant">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
              <span className="text-on-surface-variant text-body-sm font-medium">{session?.quizTitle || 'Loading...'}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-high rounded-full border border-outline-variant">
              <span className="material-symbols-outlined text-primary text-sm">group</span>
              <span className="text-body-sm font-mono">{participants.length} Participants</span>
            </div>
          </div>
        </section>

        {/* Right: Participants */}
        <section className="col-span-12 lg:col-span-3 bg-surface-container p-lg rounded-xl border border-outline-variant flex flex-col">
          <div className="flex items-center justify-between mb-lg">
            <h3 className="text-label-caps text-on-surface-variant uppercase tracking-widest">Participants</h3>
            <div className="px-2 py-1 bg-primary/10 text-primary text-[10px] rounded font-bold">
              {participants.filter((p) => p.isReady).length} READY
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3 overflow-y-auto max-h-[500px] custom-scrollbar">
            {participants.map((p, i) => (
              <div key={i} className="flex flex-col items-center gap-1 group">
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center group-hover:border-primary transition-all">
                  <span className="material-symbols-outlined text-primary">person</span>
                </div>
                <span className="text-[10px] font-medium text-slate-400 truncate w-full text-center">
                  {p.guestName || 'User'}
                </span>
              </div>
            ))}
            {participants.length === 0 && (
              <div className="col-span-4 text-center py-8">
                <p className="text-on-surface-variant text-body-sm">Waiting for players...</p>
              </div>
            )}
          </div>
          <div className="mt-auto pt-lg">
            <div className="p-md rounded-xl bg-surface-container-high border border-outline-variant text-center">
              <p className="text-body-sm text-on-surface-variant">Share the code above to invite players</p>
            </div>
          </div>
        </section>

        {/* Start Button */}
        <section className="col-span-12 flex justify-center pb-xxl">
          <button
            onClick={handleStart}
            disabled={participants.length === 0}
            className="px-xxl py-lg bg-primary-container text-white text-h3 font-bold rounded-full flex items-center gap-4 glow-primary hover:scale-105 active:scale-95 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[32px]">play_arrow</span>
            Start Quiz Session
            <span className="material-symbols-outlined text-white/50 group-hover:translate-x-1 transition-transform">chevron_right</span>
          </button>
        </section>
      </div>
    </div>
  );
}