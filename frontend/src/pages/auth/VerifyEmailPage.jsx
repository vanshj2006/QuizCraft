import { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const token = searchParams.get('token');
    if (!token) { setStatus('error'); setMessage('No verification token found.'); return; }

    axios.get(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(({ data }) => { setStatus('success'); setMessage(data.message); })
      .catch((err) => {
        const msg = err.response?.data?.message || 'Verification failed';
        if (msg.toLowerCase().includes('already verified')) {
          setStatus('success'); setMessage('Email already verified.');
        } else {
          setStatus('error'); setMessage(msg);
        }
      });
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 dot-grid">
      <div className="w-full max-w-sm">

        {/* Loading */}
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary-container border-t-transparent rounded-full animate-spin" />
            <p className="text-on-surface-variant">Verifying your email...</p>
          </div>
        )}

        {/* Success */}
        {status === 'success' && (
          <div className="bg-surface-container border border-outline-variant/30 rounded-2xl p-8 text-center space-y-6">

            {/* Animated check */}
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full bg-tertiary/10 animate-ping opacity-25" />
              <div className="relative w-20 h-20 rounded-full bg-tertiary/15 border-2 border-tertiary/40 flex items-center justify-center">
                <svg className="w-9 h-9 text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
            </div>

            <div>
              <h2 className="text-h2 font-bold text-white mb-2">Verification Complete!</h2>
              <p className="text-on-surface-variant text-body-sm">
                Your email has been verified. Your account is now fully secured.
              </p>
            </div>

            <Link
              to="/login"
              className="w-full py-3 bg-primary-container text-white font-bold rounded-xl hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Sign In
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="bg-surface-container border border-outline-variant/30 rounded-2xl p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-error-container/20 rounded-full flex items-center justify-center mx-auto border border-error/30">
              <svg className="w-8 h-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <h2 className="text-h2 font-bold text-white mb-2">Verification Failed</h2>
              <p className="text-on-surface-variant text-body-sm">{message}</p>
            </div>
            <Link
              to="/login"
              className="w-full py-3 border border-outline-variant/30 text-on-surface font-bold rounded-xl hover:bg-surface-container-high transition-all flex items-center justify-center"
            >
              Back to Login
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}