import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuizStore } from '../store/quizStore';

export default function QuizPlayPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchQuiz, submitAttempt } = useQuizStore();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [phase, setPhase] = useState('playing'); // playing | result | finished
  const [result, setResult] = useState(null);
  const [finalResult, setFinalResult] = useState(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    fetchQuiz(id).then((q) => {
      setQuiz(q);
      const qs = q.shuffleQuestions ? [...q.questions].sort(() => Math.random() - 0.5) : q.questions;
      setQuestions(qs);
      setTimeLeft(q.timeLimit || 30);
    });
  }, [id]);

  useEffect(() => {
    if (!quiz || phase !== 'playing') return;
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current); handleNext(null); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [current, quiz, phase]);

  const handleSelect = (label) => {
    if (selected !== null) return;
    clearInterval(timerRef.current);
    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
    setSelected(label);
    const q = questions[current];
    const isCorrect = q.correctAnswer === label;
    setResult({ isCorrect, correctAnswer: q.correctAnswer, explanation: q.explanation });
    setAnswers((prev) => [...prev, { questionId: q._id, selectedAnswer: label, timeTaken }]);
  };

  const handleNext = (label) => {
    if (label !== null && selected === null) handleSelect(label);
    setTimeout(() => {
      if (current + 1 >= questions.length) {
        finishQuiz();
      } else {
        setCurrent((c) => c + 1);
        setSelected(null);
        setResult(null);
        setTimeLeft(quiz.timeLimit || 30);
        setPhase('playing');
      }
    }, label !== null ? 1500 : 0);
  };

  const finishQuiz = async () => {
    setPhase('finished');
    try {
      const totalTime = Math.round((Date.now() - startTimeRef.current) / 1000);
      const data = await submitAttempt(id, answers, totalTime);
      setFinalResult(data);
    } catch { /* ignore */ }
  };

  if (!quiz || questions.length === 0) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-container border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (phase === 'finished') {
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="w-full max-w-lg text-center space-y-6">
          <div className="w-24 h-24 rounded-full bg-primary-container/20 border-4 border-primary-container flex items-center justify-center mx-auto glow-primary">
            <span className="text-h1 font-black text-white">{finalResult?.percentage ?? '—'}%</span>
          </div>
          <h2 className="text-h2 font-bold text-white">Quiz Complete!</h2>
          <p className="text-on-surface-variant">
            You scored <span className="text-primary font-bold">{finalResult?.score ?? 0}</span> / {finalResult?.totalPoints ?? 0} points
          </p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => { setCurrent(0); setAnswers([]); setSelected(null); setResult(null); setPhase('playing'); setTimeLeft(quiz.timeLimit || 30); }} className="px-6 py-3 border border-outline-variant rounded-xl text-on-surface font-bold hover:bg-surface-variant transition-all">
              Try Again
            </button>
            <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-primary-container text-white font-bold rounded-xl hover:brightness-110 transition-all">
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const progress = ((current) / questions.length) * 100;
  const timerPct = (timeLeft / (quiz.timeLimit || 30)) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-md bg-surface-container-low p-md rounded-xl border border-outline-variant">
        <div className="flex-1">
          <div className="flex justify-between mb-2">
            <span className="text-label-caps text-on-surface-variant">Question {current + 1} of {questions.length}</span>
            <span className="text-label-caps text-primary">{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-surface-variant h-2 rounded-full overflow-hidden">
            <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="flex flex-col items-center px-lg border-l border-outline-variant">
          <span className={`text-h3 font-bold ${timeLeft <= 5 ? 'text-error' : 'text-secondary-container'}`}>{timeLeft}s</span>
          <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Left</span>
        </div>
      </div>

      {/* Question */}
      <div className="bg-surface-container rounded-xl border border-outline-variant p-xl space-y-lg">
        <h1 className="text-h2 font-bold text-on-surface">{q.stem}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {q.options.map((opt) => {
            let cls = 'bg-surface-container-high border-outline-variant hover:border-primary hover:bg-surface-container-highest';
            if (selected !== null) {
              if (opt.label === q.correctAnswer) cls = 'bg-tertiary/10 border-tertiary';
              else if (opt.label === selected && !result?.isCorrect) cls = 'bg-error-container/20 border-error';
              else cls = 'bg-surface-container-high border-outline-variant opacity-50';
            }
            return (
              <button
                key={opt.label}
                onClick={() => handleSelect(opt.label)}
                disabled={selected !== null}
                className={`text-left border p-lg rounded-xl flex items-center gap-md transition-all duration-200 ${cls}`}
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${selected !== null && opt.label === q.correctAnswer ? 'bg-tertiary text-on-tertiary' : selected === opt.label && !result?.isCorrect ? 'bg-error text-on-error' : 'bg-surface-variant text-primary'}`}>
                  {opt.label}
                </div>
                <span className="text-body-lg text-on-surface">{opt.text}</span>
              </button>
            );
          })}
        </div>

        {result && (
          <div className={`p-md rounded-xl border ${result.isCorrect ? 'bg-tertiary/10 border-tertiary/30' : 'bg-error-container/20 border-error/30'}`}>
            <p className={`font-bold mb-1 ${result.isCorrect ? 'text-tertiary' : 'text-error'}`}>
              {result.isCorrect ? '✓ Correct!' : '✗ Incorrect'}
            </p>
            {q.explanation && <p className="text-body-sm text-on-surface-variant">{q.explanation}</p>}
          </div>
        )}
      </div>

      {result && (
        <div className="flex justify-end">
          <button
            onClick={() => handleNext(selected)}
            className="px-xl py-3 bg-primary-container text-white font-bold rounded-xl hover:brightness-110 transition-all active:scale-95"
          >
            {current + 1 >= questions.length ? 'Finish' : 'Next Question'}
          </button>
        </div>
      )}
    </div>
  );
}