import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

export default function LiveSessionPage() {
  const { code } = useParams();
  const sessionCode = code.replace('-', ' ');
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [question, setQuestion] = useState(null);
  const [qIndex, setQIndex] = useState(0);
  const [qTotal, setQTotal] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [streak, setStreak] = useState(0);
  const [myScore, setMyScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [finalBoard, setFinalBoard] = useState([]);
  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const socket = io('/', { withCredentials: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('lobby:join', { code: sessionCode, userId: user?._id, guestName: user?.name });
    });

    socket.on('quiz:question', ({ index, total, question: q, startTime }) => {
      setQuestion(q);
      setQIndex(index);
      setQTotal(total);
      setTimeLeft(q.timeLimit || 30);
      setSelected(null);
      setResult(null);
      startTimeRef.current = new Date(startTime).getTime();

      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const remaining = Math.max(0, (q.timeLimit || 30) - elapsed);
        setTimeLeft(remaining);
        if (remaining === 0) clearInterval(timerRef.current);
      }, 500);
    });

    socket.on('quiz:answer_result', ({ isCorrect, points, correctAnswer }) => {
      setResult({ isCorrect, correctAnswer });
      if (isCorrect) {
        setStreak((s) => s + 1);
        setMyScore((s) => s + points);
      } else {
        setStreak(0);
      }
    });

    socket.on('quiz:leaderboard', ({ leaderboard: lb }) => {
      setLeaderboard(lb);
    });

    socket.on('quiz:finished', ({ leaderboard: lb }) => {
      setFinished(true);
      setFinalBoard(lb);
      clearInterval(timerRef.current);
    });

    socket.on('session:ended', () => {
      navigate('/dashboard');
    });

    return () => {
      clearInterval(timerRef.current);
      socket.disconnect();
    };
  }, [code]);

  const handleAnswer = (label) => {
    if (selected !== null || !question) return;
    setSelected(label);
    const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);
    socketRef.current?.emit('quiz:answer', {
      code: sessionCode,
      questionId: question._id,
      answer: label,
      timeTaken,
    });
  };

  if (finished) {
    const myRank = finalBoard.findIndex((p) => p.name === user?.name) + 1;
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="w-full max-w-2xl space-y-6">
          <div className="text-center">
            <h2 className="text-h1 font-black text-white mb-2">Session Complete!</h2>
            <p className="text-on-surface-variant">Final Leaderboard</p>
          </div>
          <div className="bg-surface-container rounded-xl border border-outline-variant overflow-hidden">
            {finalBoard.slice(0, 10).map((p, i) => (
              <div key={i} className={`flex items-center gap-md p-md border-b border-outline-variant/30 ${p.name === user?.name ? 'bg-primary-container/20' : ''}`}>
                <span className={`font-mono w-6 font-bold ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-orange-500' : 'text-on-surface-variant'}`}>{i + 1}</span>
                <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">person</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-on-surface">{p.name}</p>
                  <p className="text-[10px] text-on-surface-variant">Streak: {p.streak}</p>
                </div>
                <p className="font-mono font-bold text-on-surface">{p.score.toLocaleString()}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-center">
            <button onClick={() => navigate('/dashboard')} className="px-8 py-3 bg-primary-container text-white font-bold rounded-xl hover:brightness-110 transition-all">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary-container border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-on-surface-variant">Waiting for host to start...</p>
        </div>
      </div>
    );
  }

  const progress = qTotal > 0 ? ((qIndex) / qTotal) * 100 : 0;

  return (
    <div className="max-w-[1600px] mx-auto p-md md:p-xl grid grid-cols-1 lg:grid-cols-12 gap-lg min-h-full">
      {/* Left: Question */}
      <section className="lg:col-span-8 flex flex-col gap-lg">
        {/* Progress */}
        <div className="flex items-center gap-md bg-surface-container-low p-md rounded-xl border border-outline-variant">
          <div className="flex-1">
            <div className="flex justify-between mb-2">
              <span className="text-label-caps text-on-surface-variant uppercase">Question {qIndex + 1} of {qTotal}</span>
              <span className="text-label-caps text-primary uppercase">{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-surface-variant h-2 rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${progress}%`, boxShadow: '0 0 10px rgba(179,197,255,0.5)' }} />
            </div>
          </div>
          <div className="flex flex-col items-center px-lg border-l border-outline-variant">
            <span className={`text-h3 font-mono ${timeLeft <= 5 ? 'text-error' : 'text-secondary-container'}`}>{timeLeft}s</span>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Left</span>
          </div>
        </div>

        {/* Question */}
        <div className="bg-surface-container rounded-xl border border-outline-variant p-xl space-y-lg">
          <h1 className="text-h2 font-bold text-on-surface">{question.stem}</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            {question.options?.map((opt) => {
              let cls = 'bg-surface-container-high border-outline-variant hover:border-primary hover:bg-surface-container-highest';
              if (selected !== null) {
                if (opt.label === result?.correctAnswer) cls = 'bg-tertiary/10 border-tertiary';
                else if (opt.label === selected && !result?.isCorrect) cls = 'bg-error-container/20 border-error';
                else cls = 'bg-surface-container-high border-outline-variant opacity-50';
              }
              return (
                <button
                  key={opt.label}
                  onClick={() => handleAnswer(opt.label)}
                  disabled={selected !== null}
                  className={`text-left border p-lg rounded-xl flex items-center gap-md transition-all duration-200 ${cls}`}
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold shrink-0 ${selected !== null && opt.label === result?.correctAnswer ? 'bg-tertiary text-on-tertiary' : selected === opt.label && !result?.isCorrect ? 'bg-error text-on-error' : 'bg-surface-variant text-primary'}`}>
                    {opt.label}
                  </div>
                  <span className="text-body-lg text-on-surface">{opt.text}</span>
                </button>
              );
            })}
          </div>
          {result && (
            <div className={`p-md rounded-xl border ${result.isCorrect ? 'bg-tertiary/10 border-tertiary/30' : 'bg-error-container/20 border-error/30'}`}>
              <p className={`font-bold ${result.isCorrect ? 'text-tertiary' : 'text-error'}`}>
                {result.isCorrect ? '✓ Correct!' : `✗ Incorrect — Answer: ${result.correctAnswer}`}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Right: Leaderboard */}
      <aside className="lg:col-span-4 flex flex-col gap-lg">
        {streak >= 3 && (
          <div className="bg-tertiary-container/20 border border-tertiary/30 p-md rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-md">
              <div className="w-10 h-10 rounded-full bg-tertiary flex items-center justify-center">
                <span className="material-symbols-outlined text-on-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
              </div>
              <div>
                <h4 className="text-tertiary font-bold">{streak} Streak!</h4>
                <p className="text-xs text-on-tertiary-container font-medium">You're on fire!</p>
              </div>
            </div>
            <div className="text-tertiary font-mono text-lg font-bold">{myScore.toLocaleString()} pts</div>
          </div>
        )}

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
              <div key={i} className={`flex items-center gap-md p-md rounded-lg ${p.name === user?.name ? 'bg-primary-container border border-primary/40' : 'hover:bg-surface-container-high'} transition-colors`}>
                <span className={`font-mono w-4 font-bold ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-orange-500' : 'text-on-surface-variant'}`}>{i + 1}</span>
                <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center">
                  <span className={`material-symbols-outlined ${p.name === user?.name ? 'text-white' : 'text-on-surface-variant'}`}>person</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-body-sm font-semibold truncate ${p.name === user?.name ? 'text-white' : 'text-on-surface'}`}>{p.name}</p>
                  <p className="text-[10px] text-on-surface-variant uppercase">Streak: {p.streak}</p>
                </div>
                <p className={`text-sm font-mono font-bold ${p.name === user?.name ? 'text-white' : 'text-on-surface'}`}>{p.score.toLocaleString()}</p>
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