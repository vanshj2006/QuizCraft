import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';

export default function JoinPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [code, setCode] = useState(searchParams.get('code') || '');
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);

  // Auto-preview if code comes from URL
  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode) {
      // URL has XXX-XXX format — display as "XXX XXX" in the input
      const digits = urlCode.replace(/\D/g, '');
      const formatted = digits.length > 3 ? digits.slice(0, 3) + ' ' + digits.slice(3) : digits;
      setCode(formatted);
      fetchPreview(urlCode); // pass original slug directly
    }
  }, []);

  const fetchPreview = async (rawCode) => {
    // Normalize: strip non-digits, then format as XXX-XXX for the URL
    const digits = (rawCode !== undefined ? rawCode : code).replace(/\D/g, '');
    if (digits.length < 6) return;
    const slug = digits.slice(0, 3) + '-' + digits.slice(3, 6);
    setLoading(true);
    setError('');
    setPreview(null);
    try {
      const { data } = await api.get(`/live/join/${slug}`);
      setPreview(data);
    } catch (err) {
      setError(
        err.response?.status === 410
          ? 'This session has ended'
          : err.response?.data?.message || 'Session not found'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = () => {
    if (!preview) return;
    const digits = code.replace(/\D/g, '');
    const slug = digits.slice(0, 3) + '-' + digits.slice(3, 6);
    if (!user) {
      navigate(`/login?redirect=/live/${slug}/lobby`);
    } else {
      navigate(`/live/${slug}/lobby`);
    }
  };

  const handleCodeInput = (e) => {
    // Only allow digits, auto-insert space after 3 digits
    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
    const formatted = digits.length > 3 ? digits.slice(0, 3) + ' ' + digits.slice(3) : digits;
    setCode(formatted);
    setPreview(null);
    setError('');
  };

  const isValidCode = code.replace(/\D/g, '').length >= 6;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 dot-grid">
      {/* Nav strip */}
      <div className="fixed top-0 inset-x-0 z-50 border-b border-white/5 backdrop-blur-md bg-background/80">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-container rounded-lg flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
              </svg>
            </div>
            <span className="text-sm font-black tracking-tighter text-white">Quiz Craft</span>
          </Link>
          {user ? (
            <Link to="/dashboard" className="text-body-sm text-primary hover:underline font-medium">
              Back to Dashboard
            </Link>
          ) : (
            <Link to="/login" className="px-4 py-1.5 bg-primary-container text-white text-body-sm font-bold rounded-xl hover:brightness-110 transition-all">
              Sign In
            </Link>
          )}
        </div>
      </div>

      <div className="w-full max-w-md mt-14">
        {/* Card */}
        <div className="bg-surface-container border border-outline-variant/30 rounded-2xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="bg-primary-container/10 border-b border-primary/20 px-8 py-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary-container/20 border border-primary/30 flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>live_tv</span>
            </div>
            <h1 className="text-h2 font-bold text-white">Join a Live Quiz</h1>
            <p className="text-on-surface-variant text-body-sm mt-1">Enter the session code shared by your host</p>
          </div>

          <div className="p-8 space-y-5">
            {/* Code input */}
            <div className="space-y-2">
              <label className="text-label-caps text-on-surface-variant">SESSION CODE</label>
              <input
                value={code}
                onChange={handleCodeInput}
                onKeyDown={(e) => e.key === 'Enter' && isValidCode && fetchPreview()}
                maxLength={7}
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-4 text-center text-2xl font-black tracking-[0.3em] text-white focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 outline-none transition-all placeholder:text-slate-600 placeholder:tracking-normal placeholder:text-base placeholder:font-normal"
                placeholder="123 456"
                autoFocus
              />
            </div>

            {/* Error */}
            <div className={`overflow-hidden transition-all duration-300 ${error ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="flex items-center gap-2 p-3 bg-error-container/20 border border-error/30 rounded-lg text-error text-body-sm">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {error}
              </div>
            </div>

            {/* Preview card */}
            {preview && (
              <div className="p-4 bg-surface-container-low rounded-xl border border-primary/25 space-y-3">
                <div className="flex items-center gap-3">
                  {preview.hostAvatar ? (
                    <img src={preview.hostAvatar} className="w-10 h-10 rounded-full object-cover border border-primary/30" alt="host" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-lg">person</span>
                    </div>
                  )}
                  <div>
                    <p className="text-white font-bold text-body-md">{preview.quizTitle}</p>
                    <p className="text-on-surface-variant text-body-sm">Hosted by {preview.hostName}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-body-sm">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="material-symbols-outlined text-[14px]">category</span>
                    {preview.quizCategory}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="material-symbols-outlined text-[14px]">group</span>
                    {preview.participantCount} joined
                  </div>
                  <div className={`flex items-center gap-1.5 font-medium ${preview.status === 'waiting' ? 'text-tertiary' : 'text-primary'}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                    {preview.status === 'waiting' ? 'Waiting' : 'In progress'}
                  </div>
                </div>
              </div>
            )}

            {/* Buttons */}
            {!preview ? (
              <button
                onClick={() => fetchPreview()}
                disabled={!isValidCode || loading}
                className="w-full py-3 bg-surface-container-high border border-outline-variant/40 text-on-surface font-bold rounded-xl hover:bg-surface-variant transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-on-surface/30 border-t-on-surface rounded-full animate-spin" /> Looking up...</>
                ) : (
                  <><span className="material-symbols-outlined text-sm">search</span> Find Session</>
                )}
              </button>
            ) : (
              <button
                onClick={handleJoin}
                disabled={joining}
                className="w-full py-3 bg-primary-container text-white font-bold rounded-xl hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>login</span>
                {user ? 'Join Session' : 'Sign in to Join'}
              </button>
            )}

            {preview && (
              <button
                onClick={() => { setPreview(null); setCode(''); setError(''); }}
                className="w-full py-2 text-on-surface-variant text-body-sm hover:text-on-surface transition-colors"
              >
                Enter a different code
              </button>
            )}
          </div>
        </div>

        {!user && (
          <p className="text-center text-body-sm text-slate-600 mt-4">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline">Sign up free</Link>
          </p>
        )}
      </div>
    </div>
  );
}
