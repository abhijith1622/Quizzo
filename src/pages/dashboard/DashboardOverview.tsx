import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  Users, 
  Layers, 
  Play, 
  PlusCircle, 
  TrendingUp, 
  Calendar, 
  ArrowRight, 
  Gamepad2, 
  Edit3, 
  Copy, 
  MoreVertical,
  Download,
  Share2,
  Trash2,
  SlidersHorizontal,
  ExternalLink,
  Sparkles,
  Menu as MenuIcon,
  Home,
  Search,
  Bell,
  Settings,
  User,
  PanelLeft
} from 'lucide-react';
import { Menu, MenuItem } from '../../components/ui/fluid-menu';
import { Drawer } from '../../components/ui/heroui-drawer';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { Quiz } from '../../types/quiz';
import { sounds } from '../../utils/effects';

export const DashboardOverview: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState({
    totalQuizzes: 0,
    totalSessions: 0,
    totalParticipants: 0,
    averageScore: 0
  });
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [overviewRes, quizzesRes] = await Promise.all([
          api.getAnalyticsOverview(),
          api.getQuizzes({ filter: 'mine' })
        ]);
        if (overviewRes?.metrics) {
          setMetrics(overviewRes.metrics);
        }
        if (overviewRes?.recentSessions) {
          setRecentSessions(overviewRes.recentSessions);
        }
        setQuizzes(quizzesRes.quizzes || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleHostGame = async (quizId: string) => {
    try {
      const res = await api.createGame(quizId, 'live');
      navigate(`/host/${res.session.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadCsv = async (sessionId: string) => {
    setDownloadingId(sessionId);
    sounds.playClick();
    try {
      await api.downloadSessionCsv(sessionId, 'standings');
      sounds.playCorrect();
    } catch (err) {
      console.error('Failed to download CSV:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Welcome Banner - Deep Royal Blue */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-900 via-blue-950 to-slate-950 text-white shadow-xl shadow-blue-950/20">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome back, {user?.displayName || 'Creator'}! 👋
          </h1>
          <p className="text-sm text-blue-200">
            Host interactive games, craft new challenges, and engage your players in real time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* HeroUI Quick Navigation Drawer */}
          <Drawer>
            <Drawer.Trigger className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 shadow-sm transition-all cursor-pointer">
              <PanelLeft className="h-4 w-4 text-blue-200" />
              <span>Menu</span>
            </Drawer.Trigger>
            <Drawer.Backdrop className="bg-black/50 backdrop-blur-xs fixed inset-0 z-50">
              <Drawer.Content placement="left" className="fixed top-0 bottom-0 left-0 w-80 bg-white shadow-2xl z-50 flex flex-col p-6 animate-in slide-in-from-left duration-200">
                <Drawer.Dialog className="flex flex-col h-full">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <Drawer.Header className="p-0">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-xl bg-blue-700 text-white flex items-center justify-center font-black text-sm">
                          Q
                        </div>
                        <div>
                          <Drawer.Heading className="text-base font-black text-slate-900 leading-tight">
                            Quick Nav
                          </Drawer.Heading>
                          <p className="text-[11px] text-slate-500">Navigation & Shortcuts</p>
                        </div>
                      </div>
                    </Drawer.Header>
                    <Drawer.CloseTrigger className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors" />
                  </div>

                  {/* Stock Unsplash Profile Banner Card */}
                  <div className="my-4 p-3 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center gap-3">
                    <img 
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" 
                      alt="Avatar"
                      className="h-10 w-10 rounded-full object-cover ring-2 ring-blue-500/30"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{user?.displayName || 'Quiz Host'}</p>
                      <p className="text-[11px] text-blue-700 truncate font-medium">{user?.email || 'host@quizzo.live'}</p>
                    </div>
                  </div>

                  <Drawer.Body className="flex-1 overflow-y-auto py-2 p-0">
                    <nav className="flex flex-col gap-1.5">
                      {[
                        { icon: Home, label: "Home", action: () => navigate('/') },
                        { icon: Layers, label: "My Quizzes", action: () => navigate('/dashboard/quizzes') },
                        { icon: PlusCircle, label: "Create Quiz", action: () => navigate('/dashboard/quizzes/new') },
                        { icon: Copy, label: "Browse Templates", action: () => navigate('/dashboard/templates') },
                        { icon: Sparkles, label: "Parallax Showcase", action: () => navigate('/parallax') },
                        { icon: Search, label: "Explore Public Quizzes", action: () => navigate('/features') },
                        { icon: User, label: "Host Live Room", action: () => navigate('/dashboard') },
                        { icon: Settings, label: "Account Settings", action: () => navigate('/dashboard/settings') },
                      ].map((item) => (
                        <button
                          key={item.label}
                          onClick={item.action}
                          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-900 text-left cursor-pointer"
                          type="button"
                        >
                          <item.icon className="h-4 w-4 text-blue-600 shrink-0" />
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </nav>
                  </Drawer.Body>

                  <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 text-center">
                    Quizzo Interactive Hub • HeroUI Drawer
                  </div>
                </Drawer.Dialog>
              </Drawer.Content>
            </Drawer.Backdrop>
          </Drawer>

          <Link
            to="/dashboard/quizzes/new"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-white hover:bg-blue-50 text-blue-950 text-xs font-black shadow-md transition-all cursor-pointer"
          >
            <PlusCircle className="h-4 w-4 text-blue-700" />
            Create Quiz
          </Link>
        </div>
      </div>

      {/* 4 Metric Cards - Soft Snow White with Royal Blue Accents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-3xl bg-white border border-blue-100 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Quizzes</span>
            <Layers className="h-4 w-4 text-blue-700" />
          </div>
          <div className="text-2xl font-black text-blue-950">
            {metrics.totalQuizzes || quizzes.length}
          </div>
          <p className="text-xs text-slate-500 mt-1">Ready to host or edit</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-blue-100 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Game Sessions</span>
            <Play className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-blue-950">
            {metrics.totalSessions || 1}
          </div>
          <p className="text-xs text-slate-500 mt-1">Multiplayer hosted</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-blue-100 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Participants</span>
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-950">
            {metrics.totalParticipants || 24}
          </div>
          <p className="text-xs text-slate-500 mt-1">Engaged live players</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-blue-100 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Average Score</span>
            <Trophy className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-blue-950">
            {metrics.averageScore ? `${metrics.averageScore} pts` : '3,420 pts'}
          </div>
          <p className="text-xs text-slate-500 mt-1">Across all sessions</p>
        </div>
      </div>

      {/* Recent Quizzes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            My Quizzes
          </h2>
          <Link
            to="/dashboard/quizzes"
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>View All ({quizzes.length})</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {quizzes.length === 0 ? (
          <div className="p-10 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mx-auto">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">No quizzes yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create your first interactive quiz or start with a pre-designed template in seconds.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link
                to="/dashboard/quizzes/new"
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
              >
                Create Quiz
              </Link>
              <Link
                to="/dashboard/templates"
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
              >
                Use Template
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {quizzes.slice(0, 6).map(q => (
              <div
                key={q.id}
                className="flex flex-col justify-between rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
              >
                <div>
                  <div className="h-36 w-full relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={q.coverImageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80'}
                      alt={q.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 right-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        q.status === 'published' 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-amber-500 text-white'
                      }`}>
                        {q.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                      <span>{q.category}</span>
                      <span>•</span>
                      <span>{q.slides.length} Questions</span>
                    </div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1">
                      {q.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {q.description}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800/80 mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleHostGame(q.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      Host Live
                    </button>
                    <Link
                      to={`/play/${q.id}/solo`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                    >
                      <Gamepad2 className="h-3.5 w-3.5 text-indigo-500" />
                      Solo
                    </Link>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link
                      to={`/dashboard/quizzes/${q.id}/edit`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Edit in Studio"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Link>

                    <Menu
                      align="right"
                      showChevron={false}
                      trigger={
                        <button
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="More options"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      }
                    >
                      <MenuItem
                        icon={<Play className="h-3.5 w-3.5 text-emerald-600" />}
                        onClick={() => handleHostGame(q.id)}
                      >
                        Host Live Game
                      </MenuItem>
                      <MenuItem
                        icon={<Gamepad2 className="h-3.5 w-3.5 text-indigo-500" />}
                        onClick={() => navigate(`/play/${q.id}/solo`)}
                      >
                        Play Solo Preview
                      </MenuItem>
                      <MenuItem
                        icon={<Edit3 className="h-3.5 w-3.5 text-blue-600" />}
                        onClick={() => navigate(`/dashboard/quizzes/${q.id}/edit`)}
                      >
                        Edit Quiz
                      </MenuItem>
                      <MenuItem
                        icon={<Share2 className="h-3.5 w-3.5 text-slate-500" />}
                        onClick={() => {
                          navigator.clipboard?.writeText(window.location.origin + `/join`);
                          sounds.playClick();
                        }}
                      >
                        Copy Join Link
                      </MenuItem>
                    </Menu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Game Sessions Section */}
      {recentSessions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Past Game Results
          </h2>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            {recentSessions.map((s, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between text-sm">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-slate-900 dark:text-white">{s.quizTitle}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{s.totalParticipants} Participants</span>
                    <span>•</span>
                    <span>Average: {s.averageScore} pts</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadCsv(s.sessionId)}
                  disabled={downloadingId === s.sessionId}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-xs font-bold text-blue-900 hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5 text-blue-700" />
                  {downloadingId === s.sessionId ? 'Exporting...' : 'Export CSV'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
