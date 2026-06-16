import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useLiveStore } from '../store/useLiveStore';

export default function ResultsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const {
    results,
    sessionMeta,
    participants,
    disconnect,
    sessionLocked,
  } = useLiveStore();

  const isHost = sessionMeta?.hostId && user?._id && sessionMeta.hostId === user._id.toString();

  const finalLeaderboard = results?.finalLeaderboard || [];
  const myStats = results?.myStats || {};
  const perQuestion = results?.perQuestion || null;

  // Redirect to dashboard if store was cleared (e.g. page refresh)
  useEffect(() => {
    if (!sessionMeta && !results) {
      navigate('/dashboard', { replace: true });
    }
  }, []);

  const handleBackToDashboard = () => {
    disconnect();
    navigate('/dashboard');
  };

  const medalColor = (i) => {
    if (i === 0) return 'text-yellow-400';
    if (i === 1) return 'text-slate-300';
    if (i === 2) return 'text-orange-400';
    return 'text-on-surface-variant';
  };

  return (
    <div className="min-h-full p-6 md:p-10 max-w-5xl mx-auto w-full space-y-8">

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-primary-container/20 border border-primary/30 flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
        </div>
        <h1 className="text-h1 font-black text-white">Quiz Complete!</h1>
        {sessionMeta?.quizTitle && (
          <p className="text-on-surface-variant text-body-md">{sessionMeta.quizTitle}</p>
        )}
      </div>

      {/* Personal stats bar */}
      {myStats && (myStats.rank || myStats.score !== undefined) && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Your Rank', value: myStats.rank ? `#${myStats.rank}` : '—', icon: 'leaderboard' },
            { label: 'Total Score', value: myStats.score?.toLocaleString() ?? '0', icon: 'star' },
            { label: 'Correct', value: myStats.correct ?? '0', icon: 'check_circle' },
          ].map((stat) => (
            <div key={stat.label} className="bg-surface-container rounded-xl border border-outline-variant p-lg text-center space-y-1">
              <span className="material-symbols-outlined text-primary text-2xl block" style={{ fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
              <p className="text-h2 font-black text-white">{stat.value}</p>
              <p className="text-on-surface-variant text-body-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Final Leaderboard */}
        <div className="space-y-4">
          <h2 className="text-h3 font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">leaderboard</span>
            Final Leaderboard
          </h2>
          <div className="bg-surface-container rounded-xl border border-outline-variant overflow-hidden">
            {finalLeaderboard.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-3xl block mb-2">hourglass_empty</span>
                Waiting for final results...
              </div>
            ) : (
              finalLeaderboard.map((p, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-md p-md border-b border-outline-variant/20 last:border-0 transition-colors ${
                    p.name === user?.name ? 'bg-primary-container/20 border-l-2 border-l-primary' : ''
                  }`}
                >
                  <span className={`font-mono w-6 font-black text-sm ${medalColor(i)}`}>{i + 1}</span>
                  <div className="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant/30 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-sm">person</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold truncate ${p.name === user?.name ? 'text-primary' : 'text-on-surface'}`}>
                      {p.name} {p.name === user?.name ? '(You)' : ''}
                    </p>
                    {p.streak > 0 && (
                      <p className="text-[10px] text-tertiary">🔥 Best streak: {p.streak}</p>
                    )}
                  </div>
                  <p className="font-mono font-bold text-on-surface">{p.score?.toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Per-question review (only after timer expires and answer_result received) */}
        <div className="space-y-4">
          <h2 className="text-h3 font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">quiz</span>
            Question Review
          </h2>

          {!perQuestion ? (
            <div className="bg-surface-container rounded-xl border border-outline-variant p-8 text-center space-y-3">
              <div className="w-10 h-10 border-3 border-primary-container border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-on-surface-variant text-body-sm">
                {sessionLocked
                  ? 'Calculating your results...'
                  : 'Results will appear here when the session ends'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[480px] overflow-y-auto custom-scrollbar pr-1">
              {perQuestion.map((item) => {
                const isCorrect = item.isCorrect;
                return (
                  <div
                    key={item.questionIndex}
                    className={`bg-surface-container rounded-xl border p-md space-y-2 ${
                      isCorrect ? 'border-tertiary/30' : 'border-error/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-body-sm font-medium text-on-surface line-clamp-2">
                        Q{item.questionIndex + 1}: {item.questionStem}
                      </p>
                      <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isCorrect ? 'bg-tertiary/10 text-tertiary' : 'bg-error/10 text-error'
                      }`}>
                        {isCorrect ? `+${item.points}` : '0 pts'}
                      </span>
                    </div>
                    <div className="flex gap-4 text-[11px]">
                      <div>
                        <span className="text-on-surface-variant">Your answer: </span>
                        <span className={isCorrect ? 'text-tertiary font-bold' : 'text-error font-bold'}>
                          {item.submittedAnswer || 'No answer'}
                        </span>
                      </div>
                      {!isCorrect && (
                        <div>
                          <span className="text-on-surface-variant">Correct: </span>
                          <span className="text-tertiary font-bold">{item.correctAnswer}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Host aggregate stats */}
      {isHost && (
        <div className="bg-surface-container rounded-xl border border-primary/20 p-lg space-y-3">
          <h2 className="text-h3 font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">analytics</span>
            Session Stats (Host View)
          </h2>
          <div className="flex gap-6 text-body-sm">
            <div>
              <p className="text-on-surface-variant">Total participants</p>
              <p className="text-white font-bold text-h3">{participants.length || finalLeaderboard.length}</p>
            </div>
            <div>
              <p className="text-on-surface-variant">Average score</p>
              <p className="text-white font-bold text-h3">
                {finalLeaderboard.length > 0
                  ? Math.round(finalLeaderboard.reduce((s, p) => s + p.score, 0) / finalLeaderboard.length).toLocaleString()
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-on-surface-variant">Top scorer</p>
              <p className="text-white font-bold text-h3">{finalLeaderboard[0]?.name || '—'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Back to dashboard */}
      <div className="flex justify-center pb-8">
        <button
          onClick={handleBackToDashboard}
          className="px-8 py-3 bg-primary-container text-white font-bold rounded-xl hover:brightness-110 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">dashboard</span>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
