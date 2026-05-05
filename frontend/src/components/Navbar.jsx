import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, LogOut, User, LayoutDashboard, ShieldCheck } from 'lucide-react';

const Navbar = ({ darkMode, setDarkMode }) => {
  const { user, logout } = useAuth();

  return (
    <nav className="glass sticky top-0 z-50 border-b border-white/20 dark:border-white/10">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
          NEXUS WIFI
        </Link>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            {darkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-slate-600" />}
          </button>

          {user ? (
            <>
              <Link to="/dashboard" className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors" title="Dashboard">
                <LayoutDashboard size={20} className="text-slate-600 dark:text-slate-300" />
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors" title="Admin Panel">
                  <ShieldCheck size={20} className="text-primary-500" />
                </Link>
              )}
              <Link to="/profile" className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors" title="Profile">
                <User size={20} className="text-slate-600 dark:text-slate-300" />
              </Link>
              <button
                onClick={logout}
                className="p-2 rounded-xl hover:bg-red-500/10 text-red-500 transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary-500">
                Login
              </Link>
              <Link to="/register" className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
