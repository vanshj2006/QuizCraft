import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useLiveStore } from '../store/useLiveStore';

// ─── Session Countdown Timer (top-level timer based on expiresAt) ─────────────
function SessionCountdown({ expiresAt }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, expiresAt - Date.now()));

  useEffect(() => {
    if (!expiresAt) return;
    const tick = setInterval(() => {
      setRemaining(Math.max(0, expiresAt - Date.now()));
    }, 1000);
    return () => clearInterval(tick);
  }, [expiresAt]);

  const totalSecs = Math.floor(remaining / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  const isLow = totalSecs <= 60;

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-mono text-body-sm font-bold ${isLow ? 'text-error border-error/40 bg-error/10 animate-pulse' : 'text-on-surface-variant border-outline-variant/30 bg-surface-container-high'}`}>
      <span className="material-symbols-outlined text-[14px]">schedule</span>
      {mins}:{String(secs).padStart(2, '0')} left
    </div>
  );
}

// ─── Per-Question Timer ───────────────────────────────────────────────────────
function QuestionTimer({ startTime, timeLimit }) {
  const [timeLeft, setTimeLeft] = useState(timeLimit);

  useEffect(() => {
    if (!startTime) return;
    const tick = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setTimeLeft(Math.max(0, timeLimit - elapsed));
    }, 500);
    return () => clearInterval(tick);
  }, [startTime, timeLimit]);

  const isLow = timeLeft <= 5;

  return (
    <div className={`flex flex-col items-center px-lg border-l border-outline-variant`}>
      <span className={`text-h3 font-mono ${isLow ? 'text-error' : 'text-secondary-container'}`}>
        {timeLeft}s
      </span>
      <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Q Timer</span>
    </div>
  );
}

export default function LiveSessionPage() {
  const { code } = useParams();
  const sessionCode = code.replace(/-/g, ' ');
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const {
    connect,
    socket,
    sessionMeta,
    sessionExpiresAt,
    sessionLocked,
    currentQuestion,
    questionIndex,
    questionTotal,
    questionStartTime,
    selectedAnswer,
    submittedAnswers,
    leaderboard,
    sendAnswer,
    goNext,
    goPrev,
    errorMessage,
  } = useLiveStore();

  // If arriving directly (page refresh), reconnect
  useEffect(() => {
    if (!socket?.connected) {
      connect(sessionCode, user, navigate);
    }
  }, []);

  const handleAnswer = (label) => {
    if (!currentQuestion || sessionLocked) return;
    const timeTaken = questionStartTime
      ? Math.floor((Date.now() - questionStartTime) / 1000)
      : 0;
    sendAnswer(questionIndex, label, timeTaken);
  };

  const ackd = submittedAnswers[questionIndex]?.acknowledged;
  const chosenAnswer = selectedAnswer;
  const timePerQuestion = currentQuestion?.timeLimit || sessionMeta?.settings?.timePerQuestion || 30;
  const progress = questionTotal > 0 ? ((questionIndex) / questionTotal) * 100 : 0;

  if (!currentQuestion) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary-container border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-on-surface-variant">Loading question...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto p-md md:p-xl grid grid-cols-1 lg:grid-cols-12 gap-lg min-h-full">

      {/* Error banner */}
      {errorMessage && (
        <div className="lg:col-span-12 p-3 bg-error-container/20 border border-error/30 rounded-xl text-error text-body-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">error</span>
          {errorMessage}
        </div>
      )}

      {/* Left: Question Area */}
      <section className="lg:col-span-8 flex flex-col gap-lg">

        {/* Progress + timers */}
        <div className="flex items-center gap-md bg-surface-container-low p-md rounded-xl border border-outline-variant">
          <div className="flex-1">
            <div className="flex justify-between mb-2">
              <span className="text-label-caps text-on-surface-variant uppercase">
                Question {questionIndex + 1} of {questionTotal}
              </span>
              <span className="text-label-caps text-primary uppercase">{Math.round(progress)}% done</span>
            </div>
            <div className="w-full bg-surface-variant h-2 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all"
                style={{ width: `${progress}%`, boxShadow: '0 0 10px rgba(179,197,255,0.5)' }}
              />
            </div>
          </div>
          <QuestionTimer startTime={questionStartTime} timeLimit={timePerQuestion} />
          {sessionExpiresAt && <SessionCountdown expiresAt={sessionExpiresAt} />}
        </div>

        {/* Question card */}
        <div className="bg-surface-container rounded-xl border border-outline-variant p-xl space-y-lg">
          <h1 className="text-h2 font-bold text-on-surface">{currentQuestion.stem}</h1>

          {/* Answer options grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            {currentQuestion.options?.map((opt) => {
              const isChosen = chosenAnswer === opt.label;
              const isLocked = sessionLocked;

              let cls = 'bg-surface-container-high border-outline-variant hover:border-primary hover:bg-surface-container-highest cursor-pointer';
              let labelCls = 'bg-surface-variant text-primary';

              if (isChosen) {
                cls = isLocked
                  ? 'bg-surface-container-high border-outline-variant opacity-80 cursor-not-allowed'
                  : 'bg-primary/10 border-primary cursor-pointer';
                labelCls = 'bg-primary text-on-primary';
              } else if (isLocked) {
                cls = 'bg-surface-container-high border-outline-variant opacity-40 cursor-not-allowed';
              }

              return (
                <button
                  key={opt.label}
                  onClick={() => handleAnswer(opt.label)}
                  disabled={isLocked}
                  className={`text-left border p-lg rounded-xl flex items-center gap-md transition-all duration-200 ${cls}`}
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold shrink-0 transition-colors ${labelCls}`}>
                    {opt.label}
                  </div>
                  <span className="text-body-lg text-on-surface">{opt.text}</span>
                </button>
              );
            })}
          </div>

          {/* Answer recorded banner — no correctness, just confirmation */}
          {ackd && !sessionLocked && (
            <div className="p-md rounded-xl border bg-primary/5 border-primary/20 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
              <p className="text-primary text-body-sm font-medium">Answer recorded — you can still change it</p>
            </div>
          )}

          {sessionLocked && (
            <div className="p-md rounded-xl border bg-surface-variant/20 border-outline-variant/30 flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">lock</span>
              <p className="text-on-surface-variant text-body-sm">Session time is up — answers are locked. Calculating results...</p>
            </div>
          )}
        </div>

        {/* Navigation bar */}
        <div className="flex items-center justify-between bg-surface-container p-md rounded-xl border border-outline-variant">
          <button
            onClick={goPrev}
            disabled={questionIndex === 0}
            className="px-lg py-md bg-surface-container-high border border-outline-variant/40 text-on-surface-variant font-bold rounded-xl flex items-center gap-2 hover:bg-surface-variant transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Previous
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(questionTotal, 10) }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === questionIndex
                    ? 'bg-primary'
                    : submittedAnswers[i]
                    ? 'bg-tertiary/60'
                    : 'bg-outline-variant/40'
                }`}
              />
            ))}
            {questionTotal > 10 && <span className="text-on-surface-variant text-[10px]">+{questionTotal - 10}</span>}
          </div>

          <button
            onClick={goNext}
            className="px-lg py-md bg-primary-container text-white font-bold rounded-xl flex items-center gap-2 hover:brightness-110 transition-all"
          >
            {questionIndex === questionTotal - 1 ? 'Finish' : 'Next'}
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </section>

      {/* Right: Leaderboard */}
      <aside className="lg:col-span-4 flex flex-col gap-lg">
        {/* Streak badge */}
        {(() => {
          const myEntry = leaderboard.find((e) => e.name === user?.name);
          if (myEntry?.streak >= 3) {
            return (
              <div className="bg-tertiary-container/20 border border-tertiary/30 p-md rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-md">
                  <div className="w-10 h-10 rounded-full bg-tertiary flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                  </div>
                  <div>
                    <h4 className="text-tertiary font-bold">{myEntry.streak} Streak!</h4>
                    <p className="text-xs text-on-tertiary-container font-medium">You're on fire!</p>
                  </div>
                </div>
                <div className="text-tertiary font-mono text-lg font-bold">{myEntry.score.toLocaleString()} pts</div>
              </div>
            );
          }
          return null;
        })()}

        {/* Leaderboard panel */}
        <div className="flex-1 bg-surface-container flex flex-col rounded-xl border border-outline-variant overflow-hidden">
          <div className="p-md border-b border-outline-variant bg-surface-container-high flex justify-between items-center">
            <h3 className="text-label-caps text-on-surface-variant uppercase tracking-widest flex items-center gap-xs">
              <span className="material-symbols-outlined text-sm">leaderboard</span>
              Live Ranking
            </h3>
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">Top 10</span>
          </div>
          <div className="flex-1 overflow-y-auto p-md space-y-sm custom-scrollbar">
            {leaderboard.map((p, i) => (
              <div
                key={i}
                className={`flex items-center gap-md p-md rounded-lg transition-colors ${
                  p.name === user?.name
                    ? 'bg-primary-container border border-primary/40'
                    : 'hover:bg-surface-container-high'
                }`}
              >
                <span className={`font-mono w-5 font-bold text-sm ${
                  i === 0 ? 'text-yellow-500' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-orange-500' : 'text-on-surface-variant'
                }`}>{i + 1}</span>
                <div className="w-9 h-9 rounded-full bg-surface-variant flex items-center justify-center shrink-0">
                  <span className={`material-symbols-outlined text-sm ${p.name === user?.name ? 'text-white' : 'text-on-surface-variant'}`}>person</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-body-sm font-semibold truncate ${p.name === user?.name ? 'text-white' : 'text-on-surface'}`}>{p.name}</p>
                  {p.streak >= 3 && (
                    <p className="text-[10px] text-tertiary">🔥 {p.streak} streak</p>
                  )}
                </div>
                <p className={`text-sm font-mono font-bold ${p.name === user?.name ? 'text-white' : 'text-on-surface'}`}>
                  {p.score.toLocaleString()}
                </p>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <p className="text-center text-on-surface-variant text-body-sm py-8">Waiting for answers...</p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
