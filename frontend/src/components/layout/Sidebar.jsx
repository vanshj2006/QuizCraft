import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/quizzes', icon: 'quiz', label: 'Quizzes' },
  { to: '/bank', icon: 'account_balance', label: 'Bank' },
];

export default function Sidebar() {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 bg-slate-900 border-r border-slate-800 py-6 shrink-0">
      {/* Logo */}
      <div className="px-6 mb-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-container rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>terminal</span>
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tighter">Quiz Craft</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Expert Learning</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600/10 text-blue-500 border-r-4 border-blue-500'
                  : 'text-slate-400 hover:bg-slate-800/50'
              }`
            }
          >
            <span className="material-symbols-outlined">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-4 mt-auto">
        <button
          onClick={() => navigate('/quizzes/create')}
          className="w-full py-3 px-4 bg-primary-container text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-95 mb-6"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Create New Quiz
        </button>
        <div className="pt-4 border-t border-slate-800 space-y-1">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive ? 'text-blue-400' : 'text-slate-400 hover:bg-slate-800/50'
              }`
            }
          >
            <span className="material-symbols-outlined">person</span>
            <span>{user?.name?.split(' ')[0] || 'Profile'}</span>
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-error transition-all"
          >
            <span className="material-symbols-outlined">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}