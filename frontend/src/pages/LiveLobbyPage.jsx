import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useLiveStore } from '../store/useLiveStore';

export default function LiveLobbyPage() {
  const { code } = useParams();
  const sessionCode = code.replace(/-/g, ' ');
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [copied, setCopied] = useState('');
  const [latency, setLatency] = useState(0);
  const pingRef = useRef(null);

  const {
    connect,
    disconnect,
    sendHostStart,
    sendLobbyReady,
    sessionMeta,
    participants,
    activityFeed,
    currentQuestion,
    socket,
    errorMessage,
  } = useLiveStore();

  const isHost = sessionMeta?.hostId && user?._id && sessionMeta.hostId === user._id.toString();
  const inviteLink = `${window.location.origin}/join?code=${code}`;

  useEffect(() => {
    connect(sessionCode, user, navigate);

    return () => {
      // Don't disconnect on unmount — LiveSessionPage reuses the same socket
    };
  }, [sessionCode]);

  // Navigate to session when quiz starts (quiz:question event sets currentQuestion)
  useEffect(() => {
    if (currentQuestion) {
      navigate(`/live/${code}/session`, { replace: true });
    }
  }, [currentQuestion]);

  // Ping for latency
  useEffect(() => {
    if (!socket) return;
    pingRef.current = setInterval(() => {
      const start = Date.now();
      socket.emit('ping', () => setLatency(Date.now() - start));
    }, 3000);
    return () => clearInterval(pingRef.current);
  }, [socket]);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="flex min-h-full dot-grid">
      <div className="flex-1 p-8 grid grid-cols-12 gap-gutter max-w-[1600px] mx-auto w-full">

        {/* Error banner */}
        {errorMessage && (
          <div className="col-span-12 p-3 bg-error-container/20 border border-error/30 rounded-xl text-error text-body-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">error</span>
            {errorMessage}
          </div>
        )}

        {/* Left: Session Info */}
        <section className="col-span-12 lg:col-span-3 space-y-lg">
          <div className="bg-surface-container p-lg rounded-xl border border-outline-variant">
            <h3 className="text-label-caps text-on-surface-variant mb-4 uppercase tracking-widest">Session Info</h3>
            <div className="space-y-3">
              <div className="p-md rounded-lg bg-surface-container-high flex items-center justify-between border border-outline-variant/30">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-[18px]">timer</span>
                  <span className="text-body-sm font-medium text-on-surface">Time per Q</span>
                </div>
                <span className="text-body-sm font-mono text-tertiary">{sessionMeta?.settings?.timePerQuestion || 30}s</span>
              </div>
              <div className="p-md rounded-lg bg-surface-container-high flex items-center justify-between border border-outline-variant/30">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-[18px]">wifi</span>
                  <span className="text-body-sm font-medium text-on-surface">Latency</span>
                </div>
                <span className="text-body-sm font-mono text-tertiary">{latency}ms</span>
              </div>
              <div className="p-md rounded-lg bg-surface-container-high flex items-center justify-between border border-outline-variant/30">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-[18px]">group</span>
                  <span className="text-body-sm font-medium text-on-surface">Players</span>
                </div>
                <span className="text-body-sm font-mono text-tertiary">{participants.length}</span>
              </div>
              <div className="p-md rounded-lg bg-surface-container-high flex items-center justify-between border border-outline-variant/30">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-[18px]">hourglass</span>
                  <span className="text-body-sm font-medium text-on-surface">Status</span>
                </div>
                <span className="text-body-sm font-mono text-tertiary capitalize">{sessionMeta?.status || 'waiting'}</span>
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-surface-container p-lg rounded-xl border border-outline-variant flex flex-col">
            <div className="flex items-center justify-between mb-lg">
              <h3 className="text-label-caps text-on-surface-variant uppercase tracking-widest">Activity</h3>
              <span className="material-symbols-outlined text-slate-600 text-[18px]">history</span>
            </div>
            <div className="space-y-2">
              {activityFeed.map((a, i) => (
                <div key={i} className="flex items-center gap-2 text-body-sm py-1.5 border-b border-slate-800">
                  <span className="text-tertiary font-mono text-[10px] shrink-0">
                    {new Date(a.timestamp).toLocaleTimeString()}
                  </span>
                  <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-[10px]">
                      {a.type === 'leave' ? 'person_remove' : 'person_add'}
                    </span>
                  </div>
                  <span className="text-on-surface text-[12px] truncate">
                    <strong>{a.name}</strong> {a.type === 'leave' ? 'left' : 'joined'}
                  </span>
                </div>
              ))}
              {activityFeed.length === 0 && (
                <p className="text-on-surface-variant text-body-sm">Waiting for participants...</p>
              )}
            </div>
          </div>
        </section>

        {/* Center: Code + Invite */}
        <section className="col-span-12 lg:col-span-6 flex flex-col gap-lg">
          {/* Big code display */}
          <div className="bg-surface-container-high p-xxl rounded-xl border border-primary/30 flex flex-col items-center justify-center text-center relative overflow-hidden glow-primary">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeWidth="0.1" className="text-primary" />
                <circle cx="50" cy="50" fill="none" r="35" stroke="currentColor" strokeWidth="0.1" className="text-primary" />
                <line stroke="currentColor" strokeWidth="0.1" x1="0" x2="100" y1="50" y2="50" className="text-primary" />
                <line stroke="currentColor" strokeWidth="0.1" x1="50" x2="50" y1="0" y2="100" className="text-primary" />
              </svg>
            </div>
            <p className="text-label-caps text-primary tracking-[0.3em] mb-3 relative z-10">
              JOIN AT <span className="text-white">{window.location.host}/join</span>
            </p>
            <h2 className="text-[72px] font-black tracking-tighter leading-none text-white mb-lg font-lexend relative z-10">
              {sessionCode}
            </h2>
            <div className="flex items-center gap-3 relative z-10 flex-wrap justify-center">
              <button
                onClick={() => copyToClipboard(sessionCode, 'code')}
                className="px-5 py-2.5 bg-primary-container text-white rounded-xl font-bold flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all text-body-sm"
              >
                <span className="material-symbols-outlined text-sm">
                  {copied === 'code' ? 'check' : 'content_copy'}
                </span>
                {copied === 'code' ? 'Copied!' : 'Copy Code'}
              </button>
              <button
                onClick={() => copyToClipboard(inviteLink, 'link')}
                className="px-5 py-2.5 bg-surface-container border border-outline-variant/60 text-on-surface rounded-xl font-bold flex items-center gap-2 hover:bg-surface-variant active:scale-95 transition-all text-body-sm"
              >
                <span className="material-symbols-outlined text-sm">
                  {copied === 'link' ? 'check' : 'link'}
                </span>
                {copied === 'link' ? 'Copied!' : 'Copy Invite Link'}
              </button>
            </div>
          </div>

          {/* Invite link bar */}
          <div className="bg-surface-container rounded-xl border border-outline-variant/30 p-md">
            <p className="text-label-caps text-on-surface-variant mb-2">INVITE LINK</p>
            <div className="flex items-center gap-2 bg-surface-container-low rounded-lg px-3 py-2 border border-outline-variant/20">
              <span className="material-symbols-outlined text-primary text-[16px] shrink-0">link</span>
              <span className="text-body-sm text-slate-400 truncate flex-1 font-mono">{inviteLink}</span>
              <button onClick={() => copyToClipboard(inviteLink, 'link2')} className="shrink-0 text-primary hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[16px]">
                  {copied === 'link2' ? 'check' : 'content_copy'}
                </span>
              </button>
            </div>
          </div>

          {/* Quiz title bar */}
          <div className="flex items-center justify-between bg-surface-container p-md rounded-xl border border-outline-variant">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
              <span className="text-on-surface-variant text-body-sm font-medium">
                {sessionMeta?.quizTitle || 'Loading...'}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-high rounded-full border border-outline-variant">
              <span className="material-symbols-outlined text-primary text-sm">group</span>
              <span className="text-body-sm font-mono">{participants.length} joined</span>
            </div>
          </div>
        </section>

        {/* Right: Participants */}
        <section className="col-span-12 lg:col-span-3 bg-surface-container p-lg rounded-xl border border-outline-variant flex flex-col">
          <div className="flex items-center justify-between mb-lg">
            <h3 className="text-label-caps text-on-surface-variant uppercase tracking-widest">Players</h3>
            <div className="px-2 py-1 bg-primary/10 text-primary text-[10px] rounded font-bold">
              {participants.filter((p) => p.isReady).length} READY
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 overflow-y-auto max-h-[460px] custom-scrollbar">
            {participants.map((p, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${p.isReady ? 'bg-tertiary/20 border-tertiary/40' : 'bg-slate-800 border-slate-700'}`}>
                  <span className={`material-symbols-outlined ${p.isReady ? 'text-tertiary' : 'text-primary'}`}>
                    {p.isReady ? 'check_circle' : 'person'}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-slate-400 truncate w-full text-center">
                  {p.guestName || 'User'}
                </span>
              </div>
            ))}
            {participants.length === 0 && (
              <div className="col-span-3 text-center py-10">
                <span className="material-symbols-outlined text-3xl text-slate-600 block mb-2">group_add</span>
                <p className="text-on-surface-variant text-body-sm">Waiting for players...</p>
              </div>
            )}
          </div>
          <div className="mt-auto pt-lg">
            <div className="p-md rounded-xl bg-surface-container-high border border-outline-variant text-center">
              <p className="text-[11px] text-on-surface-variant">
                Share the code or invite link to bring players in
              </p>
            </div>
          </div>
        </section>

        {/* Bottom action */}
        <section className="col-span-12 flex justify-center pb-xxl">
          {isHost ? (
            <button
              onClick={sendHostStart}
              disabled={participants.length === 0}
              className="px-xxl py-lg bg-primary-container text-white text-h3 font-bold rounded-full flex items-center gap-4 glow-primary hover:scale-105 active:scale-95 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[32px]">play_arrow</span>
              Start Quiz
              <span className="material-symbols-outlined text-white/50 group-hover:translate-x-1 transition-transform">chevron_right</span>
            </button>
          ) : (
            <button
              onClick={sendLobbyReady}
              className="px-xxl py-lg bg-surface-container border-2 border-tertiary text-tertiary text-h3 font-bold rounded-full flex items-center gap-4 hover:bg-tertiary/10 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[32px]">check_circle</span>
              I'm Ready
            </button>
          )}
        </section>

      </div>
    </div>
  );
}
