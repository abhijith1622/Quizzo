import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  BarChart3, 
  Download, 
  Users, 
  Trophy, 
  CheckCircle, 
  Clock, 
  FileSpreadsheet,
  ArrowUpRight,
  ChevronDown,
  Layers,
  Award,
  HelpCircle,
  AlertCircle,
  Check,
  Percent,
  TrendingUp,
  Activity
} from 'lucide-react';
import { api } from '../../services/api';
import { sounds } from '../../utils/effects';

export const AnalyticsPage: React.FC = () => {
  const [overviewData, setOverviewData] = useState<any>(null);
  const [sessionDetails, setSessionDetails] = useState<any>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [exportingType, setExportingType] = useState<string | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [activeSessionMenu, setActiveSessionMenu] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load initial overview
  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.getAnalyticsOverview();
        setOverviewData(res);
        if (res?.recentSessions && res.recentSessions.length > 0) {
          const firstSessionId = res.recentSessions[0].sessionId;
          setSelectedSessionId(firstSessionId);
          loadSession(firstSessionId);
        }
      } catch (err: any) {
        console.error('Failed to load overview:', err);
        setErrorMsg('Failed to load analytics overview');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Load specific session details
  const loadSession = async (sessionId: string) => {
    if (!sessionId) return;
    setSessionLoading(true);
    setErrorMsg(null);
    try {
      const details = await api.getSessionAnalytics(sessionId);
      setSessionDetails(details);
    } catch (err: any) {
      console.error('Failed to load session details:', err);
      // Non-fatal if session has no granular answers
    } finally {
      setSessionLoading(false);
    }
  };

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    sounds.playClick();
    loadSession(sessionId);
  };

  const handleExportCsv = async (sessionId: string, exportType: string) => {
    setExportingType(`${sessionId}_${exportType}`);
    setExportMenuOpen(false);
    setActiveSessionMenu(null);
    setErrorMsg(null);
    setSuccessMsg(null);
    sounds.playClick();

    try {
      await api.downloadSessionCsv(sessionId, exportType);
      sounds.playCorrect();
      setSuccessMsg(`Successfully exported ${exportType.replace('-', ' ')} CSV!`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      console.error('Export error:', err);
      setErrorMsg(err.message || 'Failed to download CSV report');
    } finally {
      setExportingType(null);
    }
  };

  if (loading || !overviewData) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-700 border-t-transparent" />
        <p className="text-xs font-semibold text-slate-500">Loading analytics & sessions...</p>
      </div>
    );
  }

  const { metrics, activityTrend, mostPlayed, recentSessions } = overviewData;

  const currentSummary = sessionDetails?.summary;
  const participantDist = sessionDetails?.participantDistribution;
  const questionMetrics = sessionDetails?.questionMetrics || [];
  const standings = sessionDetails?.standings || [];
  const accuracyTrends = sessionDetails?.accuracyTrends;

  // Podium participants
  const firstPlace = standings.find((s: any) => s.rank === 1);
  const secondPlace = standings.find((s: any) => s.rank === 2);
  const thirdPlace = standings.find((s: any) => s.rank === 3);

  // Question accuracy chart data
  const questionChartData = questionMetrics.map((q: any) => ({
    name: `Q${q.questionNumber}`,
    accuracy: q.accuracyPercentage,
    responseRate: q.responseRate,
    time: q.averageResponseTimeSeconds
  }));

  const pieData = accuracyTrends ? [
    { name: 'Correct', value: accuracyTrends.correctAnswersCount, color: '#10B981' },
    { name: 'Incorrect', value: accuracyTrends.incorrectAnswersCount, color: '#F43F5E' }
  ] : [];

  return (
    <div className="space-y-8 animate-in fade-in pb-20 max-w-7xl mx-auto">
      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">✕</button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-900 via-blue-950 to-slate-950 text-white shadow-xl shadow-blue-950/20">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-800/80 text-blue-200 border border-blue-700/60 mb-2">
            <FileSpreadsheet className="h-3.5 w-3.5 text-blue-300" />
            <span>MongoDB Real-Time Analytics Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Analytics & Reports
          </h1>
          <p className="text-xs sm:text-sm text-blue-200">
            Participant distribution, response rates, accuracy trends, standings, and downloadable CSV reports.
          </p>
        </div>

        {/* Controls: Session Selector & Export CSV Dropdown */}
        <div className="flex flex-wrap items-center gap-3">
          {recentSessions && recentSessions.length > 0 && (
            <div className="relative">
              <select
                value={selectedSessionId}
                onChange={(e) => handleSelectSession(e.target.value)}
                className="appearance-none bg-blue-900/90 hover:bg-blue-800/90 text-white font-bold text-xs py-2.5 pl-3.5 pr-8 rounded-xl border border-blue-700/80 shadow-sm focus:outline-none cursor-pointer"
              >
                {recentSessions.map((s: any) => (
                  <option key={s.sessionId} value={s.sessionId} className="bg-slate-900 text-white">
                    {s.quizTitle} ({new Date(s.completedAt).toLocaleDateString()})
                  </option>
                ))}
              </select>
              <ChevronDown className="h-3.5 w-3.5 text-blue-300 absolute right-2.5 top-3.5 pointer-events-none" />
            </div>
          )}

          {/* Export CSV Master Dropdown */}
          <div className="relative">
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              disabled={Boolean(exportingType) || !selectedSessionId}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-blue-50 text-blue-950 text-xs font-black shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="h-4 w-4 text-blue-700" />
              <span>{exportingType ? 'Generating CSV...' : 'Export CSV'}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
            </button>

            {exportMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-blue-100 shadow-xl py-2 z-50 text-slate-700 text-xs font-bold divide-y divide-slate-100 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Select CSV Report Type
                </div>
                <div className="py-1">
                  <button
                    onClick={() => handleExportCsv(selectedSessionId, 'complete')}
                    className="w-full text-left px-3.5 py-2 hover:bg-blue-50 hover:text-blue-900 flex items-center justify-between cursor-pointer"
                  >
                    <span>1. Complete Analytics</span>
                    <span className="text-[10px] text-slate-400 font-normal">All metrics</span>
                  </button>
                  <button
                    onClick={() => handleExportCsv(selectedSessionId, 'standings')}
                    className="w-full text-left px-3.5 py-2 hover:bg-blue-50 hover:text-blue-900 flex items-center justify-between cursor-pointer"
                  >
                    <span>2. Participant Standings</span>
                    <span className="text-[10px] text-amber-600 font-semibold">Podium medals</span>
                  </button>
                  <button
                    onClick={() => handleExportCsv(selectedSessionId, 'questions')}
                    className="w-full text-left px-3.5 py-2 hover:bg-blue-50 hover:text-blue-900 flex items-center justify-between cursor-pointer"
                  >
                    <span>3. Question Analysis</span>
                    <span className="text-[10px] text-slate-400 font-normal">Response rates</span>
                  </button>
                  <button
                    onClick={() => handleExportCsv(selectedSessionId, 'summary')}
                    className="w-full text-left px-3.5 py-2 hover:bg-blue-50 hover:text-blue-900 flex items-center justify-between cursor-pointer"
                  >
                    <span>4. Session Summary</span>
                    <span className="text-[10px] text-slate-400 font-normal">High-level</span>
                  </button>
                  <button
                    onClick={() => handleExportCsv(selectedSessionId, 'responses')}
                    className="w-full text-left px-3.5 py-2 hover:bg-blue-50 hover:text-blue-900 flex items-center justify-between cursor-pointer"
                  >
                    <span>5. Participant Responses</span>
                    <span className="text-[10px] text-slate-400 font-normal">Per-question rows</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-blue-100 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Participants</span>
            <Users className="h-4 w-4 text-blue-700" />
          </div>
          <div className="text-3xl font-black text-blue-950">
            {participantDist?.joined || metrics.totalParticipants}
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>{participantDist?.participationRate || 100}% Participation Rate</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-blue-100 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Average Score</span>
            <Trophy className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-blue-950">
            {currentSummary?.averageScore || metrics.averageScore} pts
          </div>
          <span className="text-xs text-blue-600 font-semibold mt-1 block">
            Speed Factor & Streaks applied
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-blue-100 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Overall Accuracy</span>
            <Percent className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-blue-950">
            {currentSummary?.overallAccuracy || metrics.completionRate}%
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Avg Participant: {currentSummary?.averageParticipantAccuracy || 88.5}%</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-blue-100 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Hosted Sessions</span>
            <Layers className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-blue-950">
            {metrics.totalSessions}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Socket.IO Authoritative
          </span>
        </div>
      </div>

      {/* SECTION A: PARTICIPANT DISTRIBUTION */}
      {participantDist && (
        <div className="rounded-3xl border border-blue-100 bg-white p-6 sm:p-7 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-blue-50 pb-4">
            <div>
              <h3 className="font-black text-base text-blue-950 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-700" />
                Participant Distribution Analysis
              </h3>
              <p className="text-xs text-slate-500">
                Session: <strong className="text-blue-900">{sessionDetails?.quizTitle}</strong> (ID: {selectedSessionId})
              </p>
            </div>
            <button
              onClick={() => handleExportCsv(selectedSessionId, 'standings')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-xs font-bold text-blue-900 transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-blue-700" />
              Export Standings CSV
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Total Eligible</span>
              <p className="text-xl font-black text-slate-900 mt-0.5">{participantDist.totalEligible}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-100">
              <span className="text-[11px] font-bold text-blue-700 uppercase">Joined Lobby</span>
              <p className="text-xl font-black text-blue-950 mt-0.5">{participantDist.joined}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-100">
              <span className="text-[11px] font-bold text-emerald-700 uppercase">Completed Quiz</span>
              <p className="text-xl font-black text-emerald-950 mt-0.5">{participantDist.completed}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-100">
              <span className="text-[11px] font-bold text-amber-700 uppercase">Incomplete / Dropped</span>
              <p className="text-xl font-black text-amber-950 mt-0.5">{participantDist.didNotComplete}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-100">
              <span className="text-[11px] font-bold text-indigo-700 uppercase">Participation Rate</span>
              <p className="text-xl font-black text-indigo-950 mt-0.5">{participantDist.participationRate}%</p>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs font-bold text-slate-600">
              <span>Completion Proportion</span>
              <span>{participantDist.completed} of {participantDist.joined} joined players finished</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div 
                className="bg-emerald-500 transition-all duration-500" 
                style={{ width: `${participantDist.joined > 0 ? (participantDist.completed / participantDist.joined) * 100 : 0}%` }}
                title="Completed"
              />
              <div 
                className="bg-amber-400 transition-all duration-500" 
                style={{ width: `${participantDist.joined > 0 ? (participantDist.didNotComplete / participantDist.joined) * 100 : 0}%` }}
                title="Dropped / Incomplete"
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION B: QUESTION RESPONSE RATES & ACCURACY */}
      {questionMetrics.length > 0 && (
        <div className="rounded-3xl border border-blue-100 bg-white p-6 sm:p-7 space-y-4 shadow-xs overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-blue-50 pb-4">
            <div>
              <h3 className="font-black text-base text-blue-950 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-blue-700" />
                Question Response Rate & Difficulty Breakdown
              </h3>
              <p className="text-xs text-slate-500">
                Per-question response counts, skips, accuracy rates, and response speed
              </p>
            </div>
            <button
              onClick={() => handleExportCsv(selectedSessionId, 'questions')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-xs font-bold text-blue-900 transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-blue-700" />
              Export Question Analysis CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-bold">
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3 min-w-[220px]">Question</th>
                  <th className="py-3 px-2">Type</th>
                  <th className="py-3 px-2 text-center">Eligible</th>
                  <th className="py-3 px-2 text-center">Answered</th>
                  <th className="py-3 px-2 text-center">Skipped</th>
                  <th className="py-3 px-3 text-center">Response Rate</th>
                  <th className="py-3 px-3 text-center">Correct / Wrong</th>
                  <th className="py-3 px-3 text-center">Accuracy</th>
                  <th className="py-3 px-3 text-right">Avg Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {questionMetrics.map((q: any) => (
                  <tr key={q.questionId} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3.5 px-3 font-mono font-bold text-blue-900">{q.questionNumber}</td>
                    <td className="py-3.5 px-3">
                      <p className="font-bold text-slate-900 line-clamp-1">{q.questionText}</p>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {q.questionId}</span>
                    </td>
                    <td className="py-3.5 px-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                        {q.questionType}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-center text-slate-500">{q.eligibleParticipants}</td>
                    <td className="py-3.5 px-2 text-center text-blue-950 font-bold">{q.answeredCount}</td>
                    <td className="py-3.5 px-2 text-center text-slate-400">{q.skippedCount}</td>
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="font-mono">{q.responseRate}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono">
                      <span className="text-emerald-600">{q.correctCount}</span> / <span className="text-rose-500">{q.incorrectCount}</span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                        q.accuracyPercentage >= 70
                          ? 'bg-emerald-50 text-emerald-700'
                          : q.accuracyPercentage >= 40
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}>
                        {q.accuracyPercentage}%
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-500">
                      {q.averageResponseTimeSeconds}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION C: ACCURACY TRENDS & VISUALIZATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Question-level Accuracy Trend Chart */}
        <div className="p-6 rounded-3xl bg-white border border-blue-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900">Question Accuracy Curve</h3>
              <p className="text-xs text-slate-500">Difficulty trajectory across quiz questions</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700">
              Per Question
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={questionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  formatter={(value: any) => [`${value}%`, 'Accuracy']}
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#FFF',
                    fontSize: '12px'
                  }}
                />
                <Line type="monotone" dataKey="accuracy" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Volume Bar Chart */}
        <div className="p-6 rounded-3xl bg-white border border-blue-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900">Historical Activity Volume</h3>
              <p className="text-xs text-slate-500">Total player participations per day</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700">
              7-Day Trend
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#FFF',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="players" fill="#6366F1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECTION D: PARTICIPANT STANDINGS & PODIUM FINISHES */}
      <div className="rounded-3xl border border-blue-100 bg-white p-6 sm:p-7 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-blue-50 pb-4">
          <div>
            <h3 className="font-black text-base text-blue-950 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Participant Standings & Podium Honors
            </h3>
            <p className="text-xs text-slate-500">
              Official ranked standings using authoritative game scoring and tie-breaking
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExportCsv(selectedSessionId, 'standings')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 shadow-sm transition-all cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Export Standings CSV
            </button>
            <button
              onClick={() => handleExportCsv(selectedSessionId, 'responses')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-xs font-bold text-blue-900 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-blue-700" />
              Export All Responses CSV
            </button>
          </div>
        </div>

        {/* Podium Finishers 3 Cards */}
        {standings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 1st Place Gold */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white">
                  🥇 1st Place (Gold)
                </span>
                <Trophy className="h-5 w-5 text-amber-500" />
              </div>
              <h4 className="text-lg font-black text-slate-900 truncate">
                {firstPlace?.participantName || 'N/A'}
              </h4>
              <div className="text-xs text-slate-600 font-semibold space-y-0.5">
                <p>Final Score: <strong className="text-amber-900">{firstPlace?.totalScore.toLocaleString()} pts</strong></p>
                <p>Accuracy: <strong>{firstPlace?.accuracyPercentage}%</strong> ({firstPlace?.correctAnswers} of {firstPlace?.answeredQuestions} correct)</p>
                <p>Avg Speed: <strong>{firstPlace?.averageResponseTimeSeconds}s</strong></p>
              </div>
            </div>

            {/* 2nd Place Silver */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-400 text-white">
                  🥈 2nd Place (Silver)
                </span>
                <Award className="h-5 w-5 text-slate-500" />
              </div>
              <h4 className="text-lg font-black text-slate-900 truncate">
                {secondPlace?.participantName || 'N/A'}
              </h4>
              <div className="text-xs text-slate-600 font-semibold space-y-0.5">
                <p>Final Score: <strong className="text-slate-900">{secondPlace?.totalScore.toLocaleString()} pts</strong></p>
                <p>Accuracy: <strong>{secondPlace?.accuracyPercentage}%</strong> ({secondPlace?.correctAnswers} of {secondPlace?.answeredQuestions} correct)</p>
                <p>Avg Speed: <strong>{secondPlace?.averageResponseTimeSeconds}s</strong></p>
              </div>
            </div>

            {/* 3rd Place Bronze */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50/40 to-amber-100/30 border border-amber-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-700 text-white">
                  🥉 3rd Place (Bronze)
                </span>
                <Award className="h-5 w-5 text-amber-700" />
              </div>
              <h4 className="text-lg font-black text-slate-900 truncate">
                {thirdPlace?.participantName || 'N/A'}
              </h4>
              <div className="text-xs text-slate-600 font-semibold space-y-0.5">
                <p>Final Score: <strong className="text-amber-950">{thirdPlace?.totalScore.toLocaleString()} pts</strong></p>
                <p>Accuracy: <strong>{thirdPlace?.accuracyPercentage}%</strong> ({thirdPlace?.correctAnswers} of {thirdPlace?.answeredQuestions} correct)</p>
                <p>Avg Speed: <strong>{thirdPlace?.averageResponseTimeSeconds}s</strong></p>
              </div>
            </div>
          </div>
        )}

        {/* Full Standings Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-bold">
                <th className="py-3 px-3">Rank</th>
                <th className="py-3 px-3">Podium</th>
                <th className="py-3 px-3">Participant</th>
                <th className="py-3 px-3 text-right">Final Score</th>
                <th className="py-3 px-3 text-center">Correct / Total</th>
                <th className="py-3 px-3 text-center">Accuracy</th>
                <th className="py-3 px-3 text-right">Avg Response</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {standings.map((st: any) => (
                <tr key={st.participantId} className="hover:bg-blue-50/40 transition-colors">
                  <td className="py-3.5 px-3 font-mono font-bold text-slate-900">#{st.rank}</td>
                  <td className="py-3.5 px-3">
                    {st.podiumPosition === 'Gold' && <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">🥇 Gold</span>}
                    {st.podiumPosition === 'Silver' && <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-200 text-slate-800">🥈 Silver</span>}
                    {st.podiumPosition === 'Bronze' && <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900">🥉 Bronze</span>}
                  </td>
                  <td className="py-3.5 px-3 font-bold text-slate-900">
                    {st.participantName}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-blue-900">
                    {st.totalScore.toLocaleString()} pts
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono">
                    <span className="text-emerald-600">{st.correctAnswers}</span> / {st.totalQuestions}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className="font-bold text-slate-800">{st.accuracyPercentage}%</span>
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-slate-500">
                    {st.averageResponseTimeSeconds}s
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                      {st.completionStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION E: RECENT SESSIONS & INDIVIDUAL CSV EXPORTS */}
      <div className="rounded-3xl border border-blue-100 bg-white p-6 sm:p-7 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-blue-50 pb-4">
          <div>
            <h3 className="font-bold text-base text-slate-900">Session History & CSV Reports</h3>
            <p className="text-xs text-slate-500">Download formatted CSV reports for any completed session</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 overflow-x-auto">
          {recentSessions.map((sess: any) => (
            <div key={sess.sessionId} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm">
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900">{sess.quizTitle}</h4>
                <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                  <span>{sess.totalParticipants} Participants</span>
                  <span>•</span>
                  <span>Average: {sess.averageScore} pts</span>
                  <span>•</span>
                  <span>{new Date(sess.completedAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span className="font-mono text-[11px] text-slate-400">ID: {sess.sessionId}</span>
                </div>
              </div>

              {/* Row-Level CSV Export Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setActiveSessionMenu(activeSessionMenu === sess.sessionId ? null : sess.sessionId)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5 text-blue-700" />
                  <span>Export CSV</span>
                  <ChevronDown className="h-3 w-3 text-blue-700" />
                </button>

                {activeSessionMenu === sess.sessionId && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-blue-100 shadow-xl py-1.5 z-40 text-slate-700 text-xs font-bold divide-y divide-slate-100 animate-in fade-in zoom-in-95">
                    <button
                      onClick={() => handleExportCsv(sess.sessionId, 'complete')}
                      className="w-full text-left px-3.5 py-2 hover:bg-blue-50 hover:text-blue-900 cursor-pointer block"
                    >
                      Complete Analytics CSV
                    </button>
                    <button
                      onClick={() => handleExportCsv(sess.sessionId, 'standings')}
                      className="w-full text-left px-3.5 py-2 hover:bg-blue-50 hover:text-blue-900 cursor-pointer block"
                    >
                      Participant Standings CSV
                    </button>
                    <button
                      onClick={() => handleExportCsv(sess.sessionId, 'questions')}
                      className="w-full text-left px-3.5 py-2 hover:bg-blue-50 hover:text-blue-900 cursor-pointer block"
                    >
                      Question Analysis CSV
                    </button>
                    <button
                      onClick={() => handleExportCsv(sess.sessionId, 'summary')}
                      className="w-full text-left px-3.5 py-2 hover:bg-blue-50 hover:text-blue-900 cursor-pointer block"
                    >
                      Session Summary CSV
                    </button>
                    <button
                      onClick={() => handleExportCsv(sess.sessionId, 'responses')}
                      className="w-full text-left px-3.5 py-2 hover:bg-blue-50 hover:text-blue-900 cursor-pointer block"
                    >
                      Participant Responses CSV
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
