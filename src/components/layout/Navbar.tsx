import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Zap, 
  Gamepad2, 
  PlusCircle, 
  LayoutDashboard, 
  Sparkles, 
  LogOut, 
  Menu as MenuIcon, 
  X, 
  Volume2, 
  VolumeX,
  Settings,
  HelpCircle,
  Layers,
  Compass
} from 'lucide-react';
import { QuizzoLogo } from '../common/QuizzoLogo';
import { useAuth } from '../../contexts/AuthContext';
import { sounds } from '../../utils/effects';
import { LiquidMetalButton } from '../ui/liquid-metal-button';
import { Menu, MenuItem } from '../ui/fluid-menu';

export const Navbar: React.FC = () => {
  const { user, isLoading, logout, loginAsDemo } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [soundActive, setSoundActive] = useState(sounds.isSoundEnabled());

  const handleToggleSound = () => {
    const newState = sounds.toggleSound();
    setSoundActive(newState);
  };

  const handleDemoSignIn = async () => {
    try {
      await loginAsDemo();
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-blue-100/80 bg-white/95 backdrop-blur-md shadow-xs transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo - Deep Royal Blue */}
        <Link to="/" className="flex items-center group">
          <QuizzoLogo size="md" />
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
          <Menu
            trigger={
              <span className="flex items-center gap-1 hover:text-blue-700 transition-colors cursor-pointer text-slate-600 font-semibold text-sm">
                Explore
              </span>
            }
            showChevron={true}
          >
            <MenuItem onClick={() => navigate('/features')} icon={<Zap className="h-4 w-4" />}>
              Features & Modes
            </MenuItem>
            <MenuItem onClick={() => navigate('/templates')} icon={<Sparkles className="h-4 w-4" />}>
              Quiz Templates
            </MenuItem>
            <MenuItem onClick={() => navigate('/about')} icon={<HelpCircle className="h-4 w-4" />}>
              About Quizzo
            </MenuItem>
          </Menu>
        </nav>

        {/* Action Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            aria-label="Toggle Sound Effects"
            className="p-2 text-slate-500 hover:text-blue-700 hover:bg-blue-50/60 rounded-lg transition-colors cursor-pointer"
            title={soundActive ? 'Mute Sound Effects' : 'Enable Sound Effects'}
          >
            {soundActive ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          {/* Conditional rendering based on authentication state */}
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-9 w-24 bg-slate-100 rounded-xl animate-pulse" />
              <div className="h-9 w-24 bg-slate-100 rounded-xl animate-pulse" />
            </div>
          ) : user ? (
            /* AUTHENTICATED NAVBAR: Join Game, Dashboard, Create Quiz, User Profile & Logout */
            <div className="flex items-center gap-2.5">
              {/* Join Game Button (AUTHENTICATED ONLY) */}
              <Link
                to="/join"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-bold rounded-xl text-blue-900 bg-blue-50/90 hover:bg-blue-100 border border-blue-200/80 transition-colors shadow-xs"
              >
                <Gamepad2 className="h-4 w-4 text-blue-700" />
                Join Game
              </Link>

              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>

              <Link to="/dashboard/quizzes/new">
                <LiquidMetalButton
                  size="sm"
                  width={140}
                  icon={<PlusCircle className="h-4 w-4 text-blue-400" />}
                >
                  Create Quiz
                </LiquidMetalButton>
              </Link>

              {/* User Profile / Avatar with Fluid Menu */}
              <div className="relative ml-1">
                <Menu
                  align="right"
                  showChevron={false}
                  trigger={
                    <div
                      className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                      title="Account Menu"
                    >
                      <span className="text-xs font-semibold text-slate-700 max-w-[100px] truncate">
                        {user.displayName}
                      </span>
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-700 to-blue-900 text-white flex items-center justify-center font-bold text-xs ring-2 ring-blue-100 shadow-xs">
                        {user.displayName.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  }
                >
                  <MenuItem onClick={() => navigate('/dashboard')} icon={<LayoutDashboard className="h-4 w-4" />}>
                    Dashboard
                  </MenuItem>
                  <MenuItem onClick={() => navigate('/dashboard/quizzes')} icon={<Layers className="h-4 w-4" />}>
                    My Quizzes
                  </MenuItem>
                  <MenuItem onClick={() => navigate('/dashboard/quizzes/new')} icon={<PlusCircle className="h-4 w-4" />}>
                    Create Quiz
                  </MenuItem>
                  <MenuItem onClick={() => navigate('/dashboard/templates')} icon={<Sparkles className="h-4 w-4" />}>
                    Quiz Templates
                  </MenuItem>
                  <MenuItem onClick={() => navigate('/dashboard/settings')} icon={<Settings className="h-4 w-4" />}>
                    Account Settings
                  </MenuItem>
                  <MenuItem onClick={handleLogout} icon={<LogOut className="h-4 w-4 text-rose-500" />}>
                    Log Out
                  </MenuItem>
                </Menu>
              </div>
            </div>
          ) : (
            /* PUBLIC UNTOUCHED NAVBAR: Demo Creator, Sign In, Get Started (NO Join Game) */
            <div className="flex items-center gap-2">
              <button
                onClick={handleDemoSignIn}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-blue-800 bg-blue-50/80 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                Demo Creator
              </button>
              <Link
                to="/login"
                className="px-3.5 py-2 text-sm font-semibold text-slate-700 hover:text-blue-700 transition-colors"
              >
                Sign In
              </Link>
              <Link to="/signup">
                <LiquidMetalButton
                  size="sm"
                  width={130}
                  icon={<Sparkles className="h-3.5 w-3.5 text-blue-400" />}
                >
                  Get Started
                </LiquidMetalButton>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Header Icons */}
        <div className="flex md:hidden items-center gap-2">
          {/* Join Game icon in mobile header only if authenticated */}
          {user && (
            <Link
              to="/join"
              className="p-2 text-blue-700 hover:bg-blue-50 rounded-lg"
              title="Join Game"
            >
              <Gamepad2 className="h-5 w-5" />
            </Link>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-blue-100 bg-[#fafcff] px-4 pt-2 pb-6 space-y-3">
          {/* Render Join Game in mobile drawer only when authenticated */}
          {user && (
            <Link
              to="/join"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-blue-900 bg-blue-50/90 border border-blue-200"
            >
              <Gamepad2 className="h-5 w-5 text-blue-700" />
              Join a Live Game
            </Link>
          )}

          <div className="pt-2 border-t border-slate-100 space-y-1">
            <Link
              to="/features"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold text-sm"
            >
              Features
            </Link>
            <Link
              to="/templates"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold text-sm"
            >
              Templates
            </Link>
            <Link
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold text-sm"
            >
              About
            </Link>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            {isLoading ? (
              <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
            ) : user ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 text-blue-900 font-bold"
                >
                  <LayoutDashboard className="h-5 w-5 text-blue-700" />
                  Dashboard ({user.displayName})
                </Link>
                <Link
                  to="/dashboard/quizzes/new"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-700 text-white font-bold"
                >
                  <PlusCircle className="h-5 w-5" />
                  Create Quiz
                </Link>
                <Link
                  to="/dashboard/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold text-sm"
                >
                  Account Settings
                </Link>
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-semibold text-left cursor-pointer"
                >
                  <LogOut className="h-5 w-5" />
                  Log Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { handleDemoSignIn(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-50 text-blue-900 font-bold border border-blue-200 cursor-pointer"
                >
                  <Sparkles className="h-4 w-4 text-blue-700" />
                  Sign In as Demo Creator
                </button>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center py-2 px-4 rounded-xl border border-slate-200 font-bold text-slate-700"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center py-2 px-4 rounded-xl bg-blue-700 text-white font-bold"
                  >
                    Get Started
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
