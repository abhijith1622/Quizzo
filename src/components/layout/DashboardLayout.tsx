import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Layers, 
  PlusCircle, 
  Copy, 
  BarChart3, 
  History,
  Settings, 
  LogOut 
} from 'lucide-react';
import { QuizzoLogo } from '../common/QuizzoLogo';
import { useAuth } from '../../contexts/AuthContext';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { path: '/dashboard/quizzes', label: 'My Quizzes', icon: Layers },
    { path: '/dashboard/history', label: 'Quiz History', icon: History },
    { path: '/dashboard/quizzes/new', label: 'Create Quiz', icon: PlusCircle },
    { path: '/dashboard/templates', label: 'Templates', icon: Copy },
    { path: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#fafcff] flex flex-col md:flex-row">
      {/* Sidebar - Soft Snow White with Deep Royal Blue accents */}
      <aside className="w-full md:w-64 border-r border-blue-100 bg-white flex flex-col justify-between shrink-0 shadow-xs">
        <div>
          {/* Brand header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-blue-50">
            <Link to="/" className="flex items-center">
              <QuizzoLogo size="sm" />
            </Link>
          </div>

          {/* Nav links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    isActive
                      ? 'bg-blue-50/90 text-blue-900 shadow-xs border border-blue-200/80'
                      : 'text-slate-600 hover:text-blue-900 hover:bg-blue-50/50'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-blue-700' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card at bottom */}
        <div className="p-4 border-t border-blue-50 bg-[#fafcff]/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-700 to-blue-950 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-xs text-blue-950 truncate">
                  {user?.displayName || 'Creator'}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {user?.email || 'demo@quizzo.com'}
                </p>
              </div>
            </div>

            <button
              onClick={() => { logout(); navigate('/'); }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Log Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
};
