import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuthStore();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const data = await forgotPassword(email);
      setMessage(data.message);
      setStatus('success');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 dot-grid">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-h2 font-bold text-white mb-2">Reset Password</h1>
          <p className="text-on-surface-variant text-body-sm">Enter your email and we'll send a reset link</p>
        </div>

        <div className="bg-surface-container border border-outline-variant/30 rounded-2xl p-8">
          {status === 'success' ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-tertiary/15 border-2 border-tertiary/40 flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <p className="text-on-surface font-medium">{message}</p>
              <Link to="/login" className="inline-block text-primary text-body-sm hover:underline">
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {status === 'error' && (
                <div className="p-3 bg-error-container/20 border border-error/30 rounded-lg text-error text-body-sm">
                  {message}
                </div>
              )}
              <div>
                <label className="block text-label-caps text-on-surface-variant mb-2">EMAIL</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container/20 outline-none transition-all"
                  placeholder="you@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-3 bg-primary-container text-white font-bold rounded-xl hover:brightness-110 transition-all active:scale-95 disabled:opacity-50"
              >
                {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-body-sm text-on-surface-variant mt-6">
          <Link to="/login" className="text-primary hover:underline">← Back to login</Link>
        </p>
      </div>
    </div>
  );
}