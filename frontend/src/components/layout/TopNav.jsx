import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/axios';

export default function TopNav() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: '' });
  const [verifyUrl, setVerifyUrl] = useState('');
  const popupRef = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: '' }), 4000);
  };

  // Close popup on outside click
  useEffect(() => {
    const handler = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setShowPopup(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSendVerification = async () => {
    setSending(true);
    setVerifyUrl('');
    try {
      const { data } = await api.post('/auth/resend-verification', { email: user.email });
      showToast(data.message || 'Verification email sent!', 'success');
      if (data.verificationUrl) setVerifyUrl(data.verificationUrl);
      setShowPopup(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send email.', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Toast */}
      {toast.msg && (
        <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-body-sm font-medium transition-all
          ${toast.type === 'success' ? 'bg-tertiary/10 border-tertiary/30 text-tertiary' : 'bg-error-container/20 border-error/30 text-error'}`}>
          {toast.type === 'success' ? (
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          )}
          {toast.msg}
          {verifyUrl && (
            <a href={verifyUrl} className="underline font-bold ml-1 hover:opacity-80">Verify now</a>
          )}
        </div>
      )}

      <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 flex justify-between items-center px-6 py-3 sticky top-0 z-50 w-full">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-full max-w-md hidden lg:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border-none rounded-lg py-2 pl-10 pr-4 text-body-sm text-on-surface focus:ring-1 focus:ring-primary-container placeholder-slate-600 outline-none"
              placeholder="Search quizzes, questions..."
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="text-slate-400 hover:text-blue-400 transition-colors p-2">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <div className="w-px h-6 bg-slate-800" />

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-on-surface leading-none">{user?.name}</p>
              <p className="text-[10px] text-primary mt-0.5">{user?.level || 'Novice'}</p>
            </div>

            {/* Avatar + ⚠ badge */}
            <div className="relative" ref={popupRef}>
              <button
                onClick={() => {
                  if (!user?.isEmailVerified) setShowPopup(v => !v);
                  else navigate('/profile');
                }}
                className="relative hover:opacity-80 transition-opacity"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt="avatar" className="w-9 h-9 rounded-full border-2 border-primary-container object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full border-2 border-primary-container bg-surface-container-high flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-lg">person</span>
                  </div>
                )}
                {!user?.isEmailVerified && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center border-2 border-background shadow-[0_0_6px_rgba(245,158,11,0.7)]">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>

              {/* Popup */}
              {showPopup && !user?.isEmailVerified && (
                <div className="absolute right-0 top-12 w-72 bg-surface-container border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden z-50">
                  {/* Header */}
                  <div className="bg-amber-500/10 px-4 py-3 flex items-center gap-2 border-b border-amber-500/20">
                    <svg className="w-4 h-4 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    <p className="text-amber-400 text-xs font-bold uppercase tracking-widest">Verification Pending</p>
                  </div>

                  {/* Body */}
                  <div className="px-4 py-4 space-y-3">
                    <p className="text-on-surface-variant text-xs leading-relaxed">
                      Your email is not verified. Complete verification to secure your account.
                    </p>
                    <button
                      onClick={handleSendVerification}
                      disabled={sending}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {sending ? (
                        <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending...</>
                      ) : 'Complete Verification'}
                    </button>
                    <button
                      onClick={() => { setShowPopup(false); navigate('/profile'); }}
                      className="w-full py-2 text-on-surface-variant text-xs font-medium hover:text-on-surface transition-colors"
                    >
                      Go to Profile
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}