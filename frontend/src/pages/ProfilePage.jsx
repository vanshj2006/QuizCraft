import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/axios';

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  if (!msg) return null;
  const styles = {
    success: 'bg-tertiary/10 border-tertiary/30 text-tertiary',
    error: 'bg-error-container/20 border-error/30 text-error',
    info: 'bg-primary/10 border-primary/30 text-primary',
  };
  const icons = {
    success: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    error: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />,
    info: <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />,
  };
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-body-sm font-medium animate-fade-in ${styles[type] || styles.info}`}>
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        {icons[type] || icons.info}
      </svg>
      {msg}
    </div>
  );
}

// ── Email Verification Card ───────────────────────────────────────────────────
function EmailVerificationCard({ user }) {
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: 'info' });
  const [verifyUrl, setVerifyUrl] = useState('');

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'info' }), 4000);
  };

  const handleSend = async () => {
    setSending(true);
    setVerifyUrl('');
    try {
      const { data } = await api.post('/auth/resend-verification', { email: user.email });
      showToast('Verification email sent! Check your inbox.', 'success');
      // backend may return direct link if email fails
      if (data.verificationUrl) setVerifyUrl(data.verificationUrl);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send email.';
      showToast(msg, 'error');
    } finally {
      setSending(false);
    }
  };

  if (user?.isEmailVerified) {
    return (
      <div className="bg-tertiary/10 border border-tertiary/30 rounded-xl p-4 flex items-center gap-3">
        <svg className="w-5 h-5 text-tertiary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-tertiary font-bold text-body-sm">Email verified — your account is fully secured.</p>
      </div>
    );
  }

  return (
    <>
      <Toast msg={toast.msg} type={toast.type} />
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-amber-400 font-bold mb-1">Email not verified</p>
            <p className="text-on-surface-variant text-body-sm">
              Send a verification link to <span className="text-on-surface font-medium">{user?.email}</span>
            </p>
          </div>
        </div>

        <button
          onClick={handleSend}
          disabled={sending}
          className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-white text-body-sm font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {sending ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending...</>
          ) : (
            <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg> Send Verification Email</>
          )}
        </button>

        {/* Fallback direct link if email delivery failed */}
        {verifyUrl && (
          <a
            href={verifyUrl}
            className="w-full py-2.5 border border-amber-500/40 text-amber-400 text-body-sm font-bold rounded-xl transition-all hover:bg-amber-500/10 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            Verify directly (email failed)
          </a>
        )}
      </div>
    </>
  );
}

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [attempts, setAttempts] = useState([]);
  const [stats, setStats] = useState(null);
  const [form, setForm] = useState({ name: user?.name || '', avatar: user?.avatar || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [tab, setTab] = useState(searchParams.get('tab') || 'overview');

  useEffect(() => {
    api.get('/users/me/attempts').then(({ data }) => setAttempts(data.attempts)).catch(() => {});
    api.get('/users/me/stats').then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/users/me', form);
      setUser(data.user);
      setMsg('Profile updated!');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) return setMsg('Passwords do not match');
    setSaving(true);
    try {
      await api.put('/users/me/password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setMsg('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const statCards = [
    { label: 'Total Quizzes', value: stats?.totalQuizzesTaken ?? 0, delta: null },
    { label: 'Accuracy', value: `${stats?.accuracy ?? 0}%`, delta: null },
    { label: 'Total XP', value: (stats?.xp ?? 0).toLocaleString(), delta: null },
    { label: 'Streak', value: `${stats?.streak ?? 0} days`, delta: null },
  ];

  const STATUS_COLORS = { COMPLETED: 'bg-tertiary/10 text-tertiary', FAILED: 'bg-error/10 text-error', PERFECT: 'bg-primary/10 text-primary' };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-10">
      {/* Profile Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-800">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 rounded-3xl bg-surface-container-high border-2 border-primary/30 flex items-center justify-center relative overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-5xl text-primary">person</span>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-h2 font-bold text-on-surface">{user?.name}</h2>
              <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-full text-label-caps">{user?.level || 'Novice'}</span>
              {user?.isEmailVerified && (
                <span className="px-3 py-1 bg-tertiary/10 border border-tertiary/20 text-tertiary rounded-full text-label-caps flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">verified</span> Verified
                </span>
              )}
            </div>
            <p className="text-on-surface-variant text-body-md">{user?.email}</p>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex bg-surface-container-high rounded-xl p-1 gap-1 w-fit">
        {['overview', 'settings', 'security'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-body-sm font-medium transition-all capitalize ${tab === t ? 'bg-primary-container text-white' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {msg && (
        <div className="p-3 bg-tertiary/10 border border-tertiary/30 rounded-lg text-tertiary text-body-sm">{msg}</div>
      )}

      {tab === 'overview' && (
        <div className="space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map(({ label, value }) => (
              <div key={label} className="bg-surface-container border border-slate-800 p-5 rounded-2xl hover:border-primary/50 transition-colors">
                <p className="text-label-caps text-on-surface-variant mb-2">{label}</p>
                <p className="text-h3 font-bold text-white">{value}</p>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="space-y-4">
            <h3 className="text-h3 font-bold text-white flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">history</span>
              Recent Activity
            </h3>
            <div className="bg-surface-container border border-slate-800 rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-container-high border-b border-slate-800">
                    <tr>
                      {['Quiz', 'Category', 'Score', 'Date', 'Status'].map((h) => (
                        <th key={h} className="px-6 py-4 text-label-caps text-on-surface-variant">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {attempts.map((a) => {
                      const status = a.percentage === 100 ? 'PERFECT' : a.percentage >= 60 ? 'COMPLETED' : 'FAILED';
                      return (
                        <tr key={a._id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-primary">quiz</span>
                              <span className="font-bold text-white text-sm">{a.quiz?.title}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-on-surface-variant">{a.quiz?.category}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-baseline gap-1">
                              <span className="text-white font-bold">{a.score}</span>
                              <span className="text-[10px] text-slate-500">/{a.totalPoints}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">{new Date(a.completedAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLORS[status]}`}>{status}</span>
                          </td>
                        </tr>
                      );
                    })}
                    {attempts.length === 0 && (
                      <tr><td colSpan={5} className="px-6 py-10 text-center text-on-surface-variant">No attempts yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div className="max-w-lg space-y-6">
          <h3 className="text-h3 font-bold text-white">Edit Profile</h3>
          <form onSubmit={handleUpdateProfile} className="bg-surface-container border border-slate-800 rounded-2xl p-6 space-y-4">
            {[
              { key: 'name', label: 'DISPLAY NAME', type: 'text' },
              { key: 'avatar', label: 'AVATAR URL', type: 'url' },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label className="block text-label-caps text-on-surface-variant mb-2">{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface focus:border-primary-container outline-none transition-all"
                />
              </div>
            ))}
            <button type="submit" disabled={saving} className="w-full py-3 bg-primary-container text-white font-bold rounded-xl hover:brightness-110 transition-all disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {tab === 'security' && (
        <div className="max-w-lg space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-h3 font-bold text-white">Change Password</h3>
            <button
              onClick={async () => {
                try {
                  const { data } = await api.post('/auth/forgot-password', { email: user.email });
                  setMsg(data.message);
                  setTimeout(() => setMsg(''), 5000);
                } catch (err) {
                  setMsg(err.response?.data?.message || 'Failed to send reset email.');
                  setTimeout(() => setMsg(''), 5000);
                }
              }}
              className="text-body-sm text-primary hover:underline font-medium"
            >
              Forgot password?
            </button>
          </div>
          <form onSubmit={handleChangePassword} className="bg-surface-container border border-slate-800 rounded-2xl p-6 space-y-4">
            {[
              { key: 'currentPassword', label: 'CURRENT PASSWORD' },
              { key: 'newPassword', label: 'NEW PASSWORD' },
              { key: 'confirm', label: 'CONFIRM NEW PASSWORD' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-label-caps text-on-surface-variant mb-2">{label}</label>
                <input
                  type="password"
                  value={pwForm[key]}
                  onChange={(e) => setPwForm({ ...pwForm, [key]: e.target.value })}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface focus:border-primary-container outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            ))}
            <button type="submit" disabled={saving} className="w-full py-3 bg-primary-container text-white font-bold rounded-xl hover:brightness-110 transition-all disabled:opacity-50">
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}