import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

function EyeIcon({ open }) {
  return open ? (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  ) : (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const { resetPassword } = useAuthStore();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    if (form.password.length < 8) return setError('Password must be at least 8 characters');

    setStatus('loading');
    try {
      const data = await resetPassword(searchParams.get('token'), form.password);
      setMessage(data.message);
      setStatus('success');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Reset failed. The link may have expired.');
      setStatus('error');
    }
  };

  // ── Success ─────────────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 dot-grid">
        <div className="w-full max-w-sm">
          <div className="bg-surface-container border border-outline-variant/30 rounded-2xl p-8 text-center space-y-6">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full bg-tertiary/10 animate-ping opacity-25" />
              <div className="relative w-20 h-20 rounded-full bg-tertiary/15 border-2 border-tertiary/40 flex items-center justify-center">
                <svg className="w-9 h-9 text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
            </div>
            <div>
              <h2 className="text-h2 font-bold text-white mb-2">Password Reset Successful</h2>
              <p className="text-on-surface-variant text-body-sm">Your password has been updated. You can now sign in with your new password.</p>
            </div>
            <Link
              to="/login"
              className="w-full py-3 bg-primary-container text-white font-bold rounded-xl hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Go to Login
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Error (expired/invalid token) ───────────────────────────────────────────
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 dot-grid">
        <div className="w-full max-w-sm">
          <div className="bg-surface-container border border-outline-variant/30 rounded-2xl p-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-error-container/20 border-2 border-error/30 flex items-center justify-center mx-auto">
              <svg className="w-9 h-9 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <h2 className="text-h2 font-bold text-white mb-2">Reset Failed</h2>
              <p className="text-on-surface-variant text-body-sm">{message}</p>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                to="/forgot-password"
                className="w-full py-3 bg-primary-container text-white font-bold rounded-xl hover:brightness-110 transition-all active:scale-95 flex items-center justify-center"
              >
                Request New Link
              </Link>
              <Link
                to="/login"
                className="w-full py-3 border border-outline-variant/30 text-on-surface font-bold rounded-xl hover:bg-surface-container-high transition-all flex items-center justify-center"
              >
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 dot-grid">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-h2 font-bold text-white mb-2">New Password</h1>
          <p className="text-on-surface-variant text-body-sm">Choose a strong password for your account</p>
        </div>

        <div className="bg-surface-container border border-outline-variant/30 rounded-2xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-error-container/20 border border-error/30 rounded-lg text-error text-body-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-label-caps text-on-surface-variant mb-2">NEW PASSWORD</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 pr-11 text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container/20 outline-none transition-all"
                  placeholder="••••••••"
                />
                <button type="button" tabIndex={-1} onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors">
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-label-caps text-on-surface-variant mb-2">CONFIRM PASSWORD</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 pr-11 text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container/20 outline-none transition-all"
                  placeholder="••••••••"
                />
                <button type="button" tabIndex={-1} onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors">
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-3 bg-primary-container text-white font-bold rounded-xl hover:brightness-110 transition-all active:scale-95 disabled:opacity-50"
            >
              {status === 'loading' ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}