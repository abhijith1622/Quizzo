import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  History, 
  Layers, 
  Gamepad2, 
  Play, 
  Download, 
  Search, 
  FileSpreadsheet, 
  Calendar, 
  Users, 
  Trophy, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Eye, 
  Edit3,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';
import { api } from '../../services/api';
import { Quiz } from '../../types/quiz';
import { sounds } from '../../utils/effects';

interface HostedSessionItem {
  id: string;
  quizId: string;
  quizTitle: string;
  joinCode: string;
  mode: string;
  status: string;
  participantCount: number;
  averageScore: number;
  slideCount: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export const QuizHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'quizzes' | 'sessions'>('quizzes');
  
  // Quizzes state
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizSearch, setQuizSearch] = useState('');
  const [quizStatusFilter, setQuizStatusFilter] = useState<string>('all');
  const [quizzesLoading, setQuizzesLoading] = useState(true);

  // Hosted Sessions state
  const [sessions, setSessions] = useState<HostedSessionItem[]>([]);
  const [sessionSearch, setSessionSearch] = useState('');
  const [sessionStatusFilter, setSessionStatusFilter] = useState<string>('all');
  const [sessionsLoading, setSessionsLoading] = useState(true);

  // Export state
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadCreatedQuizzes();
    loadHostedSessions();
  }, []);

  const loadCreatedQuizzes = async () => {
    setQuizzesLoading(true);
    try {
      const res = await api.getQuizzes({ filter: 'mine' });
      setQuizzes(res.quizzes || []);
    } catch (err: any) {
      console.error('Failed to load created quizzes:', err);
    } finally {
      setQuizzesLoading(false);
    }
  };

  const loadHostedSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await api.getHostedSessions();
      setSessions(res.sessions || []);
    } catch (err: any) {
      console.error('Failed to load hosted sessions:', err);
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleDownloadCsv = async (id: string, type: 'quiz' | 'session') => {
    setDownloadingId(id);
    setFeedbackMsg(null);
    sounds.playClick();
    try {
      await api.downloadSessionCsv(id, 'complete');
      setFeedbackMsg({
        type: 'success',
        text: `Export downloaded successfully! (${type === 'quiz' ? 'Quiz Analytics Report' : 'Session Standings & Performance'})`
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      console.error('Export failed:', err);
      setFeedbackMsg({
        type: 'error',
        text: err.message || 'Failed to generate CSV export file'
      });
      setTimeout(() => setFeedbackMsg(null), 5000);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleHostNewGame = async (quizId: string) => {
    try {
      sounds.playClick();
      const res = await api.createGame(quizId, 'live');
      navigate(`/host/${res.session.id}`);
    } catch (err: any) {
      console.error('Failed to create game session:', err);
    }
  };

  // Filtered lists
  const filteredQuizzes = quizzes.filter(q => {
    const matchesSearch = !quizSearch.trim() || 
      q.title.toLowerCase().includes(quizSearch.toLowerCase()) ||
      q.description.toLowerCase().includes(quizSearch.toLowerCase()) ||
      q.category.toLowerCase().includes(quizSearch.toLowerCase());
    
    const matchesStatus = quizStatusFilter === 'all' || q.status === quizStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredSessions = sessions.filter(s => {
    const matchesSearch = !sessionSearch.trim() ||
      s.quizTitle.toLowerCase().includes(sessionSearch.toLowerCase()) ||
      s.joinCode.toLowerCase().includes(sessionSearch.toLowerCase()) ||
      s.id.toLowerCase().includes(sessionSearch.toLowerCase());

    const matchesStatus = sessionStatusFilter === 'all' || s.status === sessionStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in pb-16 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <History className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-black text-slate-900">
                Quiz History
              </h1>
              <p className="text-xs text-slate-500">
                Comprehensive archives of all your created quizzes and hosted game sessions with CSV data exports.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              loadCreatedQuizzes();
              loadHostedSessions();
              sounds.playClick();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-xs cursor-pointer"
            title="Refresh history"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>

          <Link
            to="/dashboard/quizzes/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-xs"
          >
            <span>Create New Quiz</span>
          </Link>
        </div>
      </div>

      {/* Notification Toast */}
      {feedbackMsg && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-bold animate-in fade-in ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Metric Summaries Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Created Quizzes</p>
            <p className="text-2xl font-black text-slate-900">{quizzes.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {quizzes.filter(q => q.status === 'published').length} published, {quizzes.filter(q => q.status === 'draft').length} drafts
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Gamepad2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hosted Sessions</p>
            <p className="text-2xl font-black text-slate-900">{sessions.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {sessions.filter(s => s.status === 'completed').length} completed games
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Participants</p>
            <p className="text-2xl font-black text-slate-900">
              {sessions.reduce((acc, s) => acc + (s.participantCount || 0), 0)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Engaged players hosted</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Export Support</p>
            <p className="text-base font-black text-emerald-700">CSV Reports</p>
            <p className="text-[11px] text-slate-400 mt-0.5">UTF-8 BOM formatted</p>
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Created Quizzes vs Hosted Games */}
      <div className="border-b border-slate-200 bg-white rounded-2xl p-2 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 px-2 pt-2">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => { setActiveTab('quizzes'); sounds.playClick(); }}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black transition cursor-pointer ${
                activeTab === 'quizzes'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Created Quizzes</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'quizzes' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
              }`}>
                {quizzes.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('sessions'); sounds.playClick(); }}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black transition cursor-pointer ${
                activeTab === 'sessions'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Gamepad2 className="h-4 w-4" />
              <span>Hosted Games</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'sessions' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
              }`}>
                {sessions.length}
              </span>
            </button>
          </div>

          <p className="text-xs text-slate-500 hidden sm:block">
            {activeTab === 'quizzes' 
              ? 'View all created quiz definitions, play counts, and export overall quiz analytics.' 
              : 'Review past game sessions, individual player scores, and download complete session CSVs.'}
          </p>
        </div>
      </div>

      {/* TAB 1: CREATED QUIZZES */}
      {activeTab === 'quizzes' && (
        <div className="space-y-4">
          {/* Controls bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search created quizzes by title or category..."
                value={quizSearch}
                onChange={(e) => setQuizSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                <Filter className="h-3.5 w-3.5" />
                <span>Status:</span>
              </div>
              <select
                value={quizStatusFilter}
                onChange={(e) => setQuizStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Quizzes</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Quizzes Table / List */}
          {quizzesLoading ? (
            <div className="py-20 text-center bg-white rounded-2xl border border-slate-200">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-500">Loading your created quizzes history...</p>
            </div>
          ) : filteredQuizzes.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8">
              <div className="h-16 w-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                <Layers className="h-8 w-8" />
              </div>
              <h3 className="text-base font-black text-slate-800 mb-1">No quizzes found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
                {quizSearch ? 'No quizzes match your search criteria.' : 'You have not created any quizzes yet.'}
              </p>
              <Link
                to="/dashboard/quizzes/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs"
              >
                Create Your First Quiz
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                      <th className="py-3.5 px-4 sm:px-6">Quiz Title & Category</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Questions</th>
                      <th className="py-3.5 px-4">Total Plays</th>
                      <th className="py-3.5 px-4">Last Modified</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Actions & Exports</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredQuizzes.map((quiz) => (
                      <tr key={quiz.id} className="hover:bg-slate-50/60 transition-colors group">
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <img
                              src={quiz.coverImageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&auto=format&fit=crop&q=80'}
                              alt=""
                              className="h-11 w-11 rounded-xl object-cover shrink-0 border border-slate-200"
                            />
                            <div>
                              <p className="font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {quiz.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                                  {quiz.category}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  ID: {quiz.id}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold capitalize ${
                            quiz.status === 'published'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : quiz.status === 'draft'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              quiz.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'
                            }`} />
                            {quiz.status}
                          </span>
                        </td>

                        <td className="py-4 px-4 font-bold text-slate-700">
                          {quiz.slides.length} slides
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5 font-black text-slate-900">
                            <Gamepad2 className="h-3.5 w-3.5 text-blue-600" />
                            <span>{quiz.playCount || 0}</span>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-slate-500 font-medium text-[11px]">
                          {new Date(quiz.updatedAt || quiz.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>

                        <td className="py-4 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Host button */}
                            <button
                              onClick={() => handleHostNewGame(quiz.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 transition shadow-xs cursor-pointer"
                              title="Host Live Game Session"
                            >
                              <Play className="h-3 w-3 fill-current" />
                              <span className="hidden md:inline">Host Game</span>
                            </button>

                            {/* Download CSV button */}
                            <button
                              onClick={() => handleDownloadCsv(quiz.id, 'quiz')}
                              disabled={downloadingId === quiz.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer disabled:opacity-50"
                              title="Download Full Quiz Analytics CSV"
                            >
                              <FileSpreadsheet className="h-3.5 w-3.5" />
                              <span>{downloadingId === quiz.id ? 'Exporting...' : 'Export CSV'}</span>
                            </button>

                            {/* Edit link */}
                            <Link
                              to={`/dashboard/quizzes/${quiz.id}/edit`}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                              title="Edit Quiz"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HOSTED GAMES SESSIONS */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          {/* Controls bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search hosted games by quiz, PIN code, or session ID..."
                value={sessionSearch}
                onChange={(e) => setSessionSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                <Filter className="h-3.5 w-3.5" />
                <span>Session Status:</span>
              </div>
              <select
                value={sessionStatusFilter}
                onChange={(e) => setSessionStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Sessions</option>
                <option value="completed">Completed</option>
                <option value="waiting">In Lobby / Waiting</option>
                <option value="active_question">Live In Progress</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Sessions Table */}
          {sessionsLoading ? (
            <div className="py-20 text-center bg-white rounded-2xl border border-slate-200">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-500">Loading hosted games history...</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8">
              <div className="h-16 w-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
                <Gamepad2 className="h-8 w-8" />
              </div>
              <h3 className="text-base font-black text-slate-800 mb-1">No hosted game sessions</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
                {sessionSearch 
                  ? 'No sessions matched your search terms.' 
                  : 'You have not hosted any live game sessions yet.'}
              </p>
              <button
                onClick={() => setActiveTab('quizzes')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs cursor-pointer"
              >
                Pick a Quiz to Host
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                      <th className="py-3.5 px-4 sm:px-6">Quiz & Session ID</th>
                      <th className="py-3.5 px-4">Join PIN</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Players</th>
                      <th className="py-3.5 px-4">Average Score</th>
                      <th className="py-3.5 px-4">Date Played</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Actions & Exports</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-slate-50/60 transition-colors group">
                        <td className="py-4 px-4 sm:px-6">
                          <div>
                            <p className="font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {session.quizTitle}
                            </p>
                            <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                              {session.id}
                            </p>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60">
                            {session.joinCode}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold capitalize ${
                            session.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : session.status === 'waiting'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                              : session.status === 'cancelled'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              session.status === 'completed' 
                                ? 'bg-emerald-500' 
                                : session.status === 'cancelled' 
                                ? 'bg-rose-500' 
                                : 'bg-indigo-500 animate-pulse'
                            }`} />
                            {session.status.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5 font-black text-slate-800">
                            <Users className="h-3.5 w-3.5 text-slate-400" />
                            <span>{session.participantCount}</span>
                          </div>
                        </td>

                        <td className="py-4 px-4 font-black text-slate-900">
                          {session.averageScore.toLocaleString()} pts
                        </td>

                        <td className="py-4 px-4 text-slate-500 font-medium text-[11px]">
                          {new Date(session.completedAt || session.startedAt || session.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>

                        <td className="py-4 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Rejoin / Resume Host Room if active/waiting */}
                            {session.status !== 'completed' && session.status !== 'cancelled' && (
                              <Link
                                to={`/host/${session.id}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs"
                              >
                                <Play className="h-3 w-3 fill-current" />
                                <span>Resume</span>
                              </Link>
                            )}

                            {/* View Full Analytics in Analytics Page */}
                            <Link
                              to="/dashboard/analytics"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                              title="View session analytics"
                            >
                              <Eye className="h-3.5 w-3.5 text-slate-500" />
                              <span className="hidden sm:inline">Analytics</span>
                            </Link>

                            {/* Download CSV */}
                            <button
                              onClick={() => handleDownloadCsv(session.id, 'session')}
                              disabled={downloadingId === session.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer disabled:opacity-50"
                              title="Download complete session CSV spreadsheet"
                            >
                              <FileSpreadsheet className="h-3.5 w-3.5" />
                              <span>{downloadingId === session.id ? 'Exporting...' : 'Export CSV'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
