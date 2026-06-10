import { Link } from 'react-router-dom';

const FEATURES = [
  {
    icon: 'auto_awesome',
    title: 'AI-Powered Generation',
    desc: 'Generate complete quizzes from a topic, a document, or a file in seconds using Gemini.',
    color: 'text-primary',
    bg: 'bg-primary/10 border-primary/20',
  },
  {
    icon: 'live_tv',
    title: 'Live Quiz Sessions',
    desc: 'Host real-time sessions where participants join with a code and compete on a live leaderboard.',
    color: 'text-secondary-fixed-dim',
    bg: 'bg-secondary-fixed-dim/10 border-secondary-fixed-dim/20',
  },
  {
    icon: 'account_balance',
    title: 'Question Bank',
    desc: 'Build a reusable library of questions and add them to any quiz with a single click.',
    color: 'text-tertiary',
    bg: 'bg-tertiary/10 border-tertiary/20',
  },
  {
    icon: 'insights',
    title: 'Analytics & Tracking',
    desc: 'Track accuracy, streaks, XP earned and dive into per-question success rates.',
    color: 'text-primary',
    bg: 'bg-primary/10 border-primary/20',
  },
  {
    icon: 'groups',
    title: 'Community Quizzes',
    desc: 'Discover and play quizzes published by the community across every category.',
    color: 'text-tertiary',
    bg: 'bg-tertiary/10 border-tertiary/20',
  },
  {
    icon: 'tune',
    title: 'Full Customisation',
    desc: 'Set time limits, difficulty, visibility, shuffle questions and more per quiz.',
    color: 'text-secondary-fixed-dim',
    bg: 'bg-secondary-fixed-dim/10 border-secondary-fixed-dim/20',
  },
];

const STEPS = [
  { num: '01', title: 'Create a Quiz', desc: 'Write questions manually, generate them with AI, or pull from your question bank.' },
  { num: '02', title: 'Invite Players', desc: 'Share a join code or link. Players jump in from any device — no account needed to play.' },
  { num: '03', title: 'Host Live', desc: 'Run the session in real time. Watch the leaderboard update as answers come in.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-on-surface font-lexend overflow-x-hidden">

      {/* ── Nav ── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 backdrop-blur-md bg-background/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary-container rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
              </svg>
            </div>
            <span className="text-lg font-black tracking-tighter text-white">Quiz Craft</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="px-4 py-2 text-body-sm font-semibold text-on-surface-variant hover:text-white transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="px-4 py-2 bg-primary-container text-white text-body-sm font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-40 pb-32 px-6 overflow-hidden dot-grid">
        {/* glow blobs */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary-container/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-40 left-1/4 w-72 h-72 bg-tertiary/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white leading-tight">
            Build smarter quizzes,<br />
            <span className="text-primary-container">faster than ever.</span>
          </h1>

          <p className="text-body-lg text-on-surface-variant max-w-2xl mx-auto">
            Create, host, and share quizzes with AI generation, live sessions, and a powerful question bank — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 bg-primary-container text-white font-bold rounded-xl text-body-md hover:brightness-110 active:scale-95 transition-all glow-primary flex items-center justify-center gap-2"
            >
              Start for free
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 border border-outline-variant/60 text-on-surface font-bold rounded-xl text-body-md hover:bg-surface-variant transition-all flex items-center justify-center gap-2"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Hero mockup card */}
        <div className="relative max-w-3xl mx-auto mt-20">
          <div className="glass-panel rounded-2xl border border-white/10 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 h-6 bg-surface-container rounded-md flex items-center px-3">
                <span className="text-[11px] text-slate-500">quizcraft.app/live/XK-49</span>
              </div>
            </div>
            {/* Fake quiz UI */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-label-caps text-primary">QUESTION 3 OF 10</span>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-tertiary">timer</span>
                  <span className="text-tertiary font-bold text-body-sm">18s</span>
                </div>
              </div>
              <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-primary-container rounded-full w-[30%]" />
              </div>
              <p className="text-white font-bold text-body-md pt-2">
                Which data structure uses LIFO (Last In, First Out) order?
              </p>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {['Queue', 'Stack', 'Linked List', 'Tree'].map((opt, i) => (
                  <div
                    key={opt}
                    className={`p-3 rounded-xl border text-body-sm font-medium transition-all ${
                      i === 1
                        ? 'border-primary-container bg-primary-container/20 text-white'
                        : 'border-outline-variant/30 bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    <span className="font-bold mr-2 text-primary">{['A', 'B', 'C', 'D'][i]}.</span>
                    {opt}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <div className="flex -space-x-2">
                  {['#4285F4', '#34A853', '#EA4335', '#FBBC05'].map((c) => (
                    <div key={c} className="w-7 h-7 rounded-full border-2 border-background" style={{ background: c }} />
                  ))}
                  <div className="w-7 h-7 rounded-full border-2 border-background bg-surface-container flex items-center justify-center">
                    <span className="text-[10px] text-slate-400">+12</span>
                  </div>
                </div>
                <span className="text-label-caps text-slate-500">16 players online</span>
              </div>
            </div>
          </div>
          {/* Floating badges */}
          <div className="absolute -top-4 -right-4 md:-right-8 glass-panel rounded-xl px-3 py-2 border border-white/10 flex items-center gap-2 shadow-lg">
            <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>leaderboard</span>
            <span className="text-[12px] font-bold text-white">Live leaderboard</span>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <p className="text-label-caps text-primary tracking-widest">FEATURES</p>
            <h2 className="text-h1 font-black text-white">Everything you need</h2>
            <p className="text-on-surface-variant text-body-lg max-w-xl mx-auto">
              From creation to analysis — Quiz Craft handles the whole workflow.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon, title, desc, color, bg }) => (
              <div key={title} className="glass-panel rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-all group hover:-translate-y-1">
                <div className={`w-11 h-11 rounded-xl ${bg} border flex items-center justify-center mb-4`}>
                  <span className={`material-symbols-outlined ${color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                </div>
                <h3 className="text-body-md font-bold text-white mb-2">{title}</h3>
                <p className="text-body-sm text-on-surface-variant leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-50 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-container/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <p className="text-label-caps text-primary tracking-widest">HOW IT WORKS</p>
            <h2 className="text-h1 font-black text-white">Up and running in minutes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map(({ num, title, desc }, i) => (
              <div key={num} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px border-t border-dashed border-outline-variant/40 -translate-y-px z-0" style={{ width: 'calc(100% - 2rem)', left: '60%' }} />
                )}
                <div className="relative z-10 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-surface-container border border-outline-variant/30 flex items-center justify-center">
                    <span className="text-2xl font-black text-primary-container">{num}</span>
                  </div>
                  <h3 className="text-body-md font-bold text-white">{title}</h3>
                  <p className="text-body-sm text-on-surface-variant leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="py-16 px-6 border-y border-white/5">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { val: 'AI', label: 'Powered by Gemini' },
            { val: '∞', label: 'Questions in your bank' },
            { val: 'Live', label: 'Real-time sessions' },
            { val: 'Free', label: 'To get started' },
          ].map(({ val, label }) => (
            <div key={label} className="text-center space-y-1">
              <p className="text-4xl font-black text-white">{val}</p>
              <p className="text-body-sm text-on-surface-variant">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-32 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-80 h-80 bg-primary-container/20 rounded-full blur-[80px]" />
            </div>
            <div className="relative space-y-6">
              <h2 className="text-5xl md:text-6xl font-black text-white leading-tight">
                Ready to quiz smarter?
              </h2>
              <p className="text-body-lg text-on-surface-variant max-w-xl mx-auto">
                Join thousands of educators and learners building better quizzes with AI.
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-10 py-4 bg-primary-container text-white font-bold text-body-md rounded-xl hover:brightness-110 active:scale-95 transition-all glow-primary-lg"
              >
                Create your first quiz
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
              <p className="text-body-sm text-slate-600">No credit card required.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary-container rounded-md flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
              </svg>
            </div>
            <span className="text-sm font-black tracking-tighter text-white">Quiz Craft</span>
          </div>
          <p className="text-body-sm text-slate-600">© {new Date().getFullYear()} Quiz Craft. Built with AI.</p>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-body-sm text-slate-500 hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="text-body-sm text-slate-500 hover:text-white transition-colors">Register</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
