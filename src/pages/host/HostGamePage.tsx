import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Users, 
  Trophy, 
  Play, 
  Lock, 
  Unlock, 
  CheckCircle, 
  Timer, 
  ArrowRight, 
  ArrowLeft,
  RotateCcw,
  Copy, 
  Check, 
  Sparkles, 
  Flame, 
  Download, 
  BarChart3, 
  Volume2, 
  VolumeX, 
  Layers
} from 'lucide-react';
import QRCode from 'qrcode';
import { getSocket } from '../../services/socket';
import { api } from '../../services/api';
import { GameSession, QuizSlide, LeaderboardEntry, Participant } from '../../types/quiz';
import { getAvatar } from '../../utils/avatars';
import { sounds, triggerConfetti, triggerWinnerConfetti } from '../../utils/effects';
import { exportClientStandingsCsv } from '../../utils/csvExport';
import { QuizzoIcon } from '../../components/common/QuizzoLogo';

export const HostGamePage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<GameSession | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [distribution, setDistribution] = useState<Record<string, number>>({});
  const [revealedSlide, setRevealedSlide] = useState<QuizSlide | null>(null);
  const [reactions, setReactions] = useState<{ id: string; emoji: string; nickname: string }[]>([]);

  const socket = getSocket();

  // Load session from API and connect socket
  useEffect(() => {
    if (!sessionId) return;

    api.getGameSession(sessionId).then(res => {
      setSession(res.session);

      // Generate QR Code for mobile players
      const joinUrl = `${window.location.origin}/join?code=${res.session.joinCode}`;
      QRCode.toDataURL(joinUrl, { margin: 1, width: 220 }, (err, url) => {
        if (!err && url) {
          setQrCodeDataUrl(url);
        }
      });

      // Join socket as host
      socket.emit('host:join', { sessionId: res.session.id, hostId: res.session.hostId }, (resp: any) => {
        if (!resp?.success) {
          console.warn('Host socket registration warning:', resp?.error);
        }
      });
    }).catch(err => {
      console.error('Error fetching session:', err);
    });

    // Listen to lobby updates
    socket.on('lobby:update', (data: { participants: Participant[]; teams: any[]; isLobbyLocked: boolean; status: any }) => {
      setSession(prev => prev ? {
        ...prev,
        participants: data.participants,
        teams: data.teams,
        isLobbyLocked: data.isLobbyLocked,
        status: data.status
      } : null);
    });

    // Real-time answer counter
    socket.on('answer:count', (data: { answeredCount: number }) => {
      setAnsweredCount(data.answeredCount);
      sounds.playClick();
    });

    // Question / Slide started (when host starts quiz or advances)
    socket.on('question:started', (data: { slideIndex: number; slide: QuizSlide; durationSeconds?: number }) => {
      setSession(prev => prev ? {
        ...prev,
        status: 'active_question',
        currentSlideIndex: data.slideIndex
      } : null);
      setRevealedSlide(null);
      setDistribution({});
      setAnsweredCount(0);
      setTimeLeft(data.durationSeconds || 20);
      sounds.playClick();
    });

    socket.on('host:slide_started', (data: { slideIndex: number; slide: QuizSlide }) => {
      setSession(prev => prev ? {
        ...prev,
        status: 'active_question',
        currentSlideIndex: data.slideIndex
      } : null);
      setRevealedSlide(null);
      setDistribution({});
      setAnsweredCount(0);
      setTimeLeft(data.slide?.timeLimitSeconds || 20);
    });

    // Question locked
    socket.on('question:locked', () => {
      setSession(prev => prev ? { ...prev, status: 'question_locked' } : null);
      sounds.playClick();
    });

    // Question unlocked
    socket.on('question:unlocked', () => {
      setSession(prev => prev ? { ...prev, status: 'active_question' } : null);
      sounds.playClick();
    });

    // Answer revealed
    socket.on('answer:revealed', (data: { slide: QuizSlide; distribution: Record<string, number> }) => {
      setRevealedSlide(data.slide);
      setDistribution(data.distribution);
      setSession(prev => prev ? { ...prev, status: 'answer_reveal' } : null);
      sounds.playCorrect();
    });

    // Leaderboard update
    socket.on('leaderboard:update', (data: { leaderboard: LeaderboardEntry[] }) => {
      setLeaderboard(data.leaderboard);
      setSession(prev => prev ? { ...prev, status: 'leaderboard' } : null);
    });

    // Game completed
    socket.on('game:completed', (data: { leaderboard: LeaderboardEntry[] }) => {
      setLeaderboard(data.leaderboard);
      setSession(prev => prev ? { ...prev, status: 'completed' } : null);
      triggerWinnerConfetti();
      sounds.playPodiumFanfare();
    });

    // Reaction emojis
    socket.on('game:reaction', (reaction: { id: string; emoji: string; nickname: string }) => {
      setReactions(prev => [...prev.slice(-15), reaction]);
      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== reaction.id));
      }, 3000);
    });

    return () => {
      socket.off('lobby:update');
      socket.off('answer:count');
      socket.off('question:started');
      socket.off('host:slide_started');
      socket.off('question:locked');
      socket.off('question:unlocked');
      socket.off('answer:revealed');
      socket.off('leaderboard:update');
      socket.off('game:completed');
      socket.off('game:reaction');
    };
  }, [sessionId]);

  // Host Countdown Timer
  useEffect(() => {
    if (!session || session.status !== 'active_question') return;

    const currentSlide = session.slides[session.currentSlideIndex];
    const totalDuration = currentSlide?.timeLimitSeconds || 20;
    setTimeLeft(totalDuration);
    setAnsweredCount(0);

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleLockQuestion();
          return 0;
        }
        if (prev <= 5) {
          sounds.playCountdownTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [session?.status, session?.currentSlideIndex]);

  // Host Action Handlers
  const handleStartGame = () => {
    if (!session) return;
    socket.emit('game:start', { sessionId: session.id });
    setSession(prev => prev ? { ...prev, status: 'active_question', currentSlideIndex: 0 } : null);
    setRevealedSlide(null);
    setDistribution({});
    setAnsweredCount(0);
    sounds.playCorrect();
  };

  const handleNextQuestion = () => {
    if (!session) return;
    if (session.currentSlideIndex + 1 < session.slides.length) {
      const nextIdx = session.currentSlideIndex + 1;
      socket.emit('question:next', { sessionId: session.id, slideIndex: nextIdx });
      setSession(prev => prev ? { ...prev, status: 'active_question', currentSlideIndex: nextIdx } : null);
    } else {
      socket.emit('question:next', { sessionId: session.id });
    }
    setRevealedSlide(null);
    setDistribution({});
    setAnsweredCount(0);
    sounds.playClick();
  };

  const handlePrevQuestion = () => {
    if (!session || session.currentSlideIndex <= 0) return;
    const prevIdx = session.currentSlideIndex - 1;
    socket.emit('question:next', { sessionId: session.id, slideIndex: prevIdx });
    setSession(prev => prev ? { ...prev, status: 'active_question', currentSlideIndex: prevIdx } : null);
    setRevealedSlide(null);
    setDistribution({});
    setAnsweredCount(0);
    sounds.playClick();
  };

  const handleJumpQuestion = (targetIndex: number) => {
    if (!session || targetIndex < 0 || targetIndex >= session.slides.length) return;
    socket.emit('question:next', { sessionId: session.id, slideIndex: targetIndex });
    setSession(prev => prev ? { ...prev, status: 'active_question', currentSlideIndex: targetIndex } : null);
    setRevealedSlide(null);
    setDistribution({});
    setAnsweredCount(0);
    sounds.playClick();
  };

  const handleLockQuestion = () => {
    if (!session) return;
    socket.emit('question:lock', { sessionId: session.id });
    setSession(prev => prev ? { ...prev, status: 'question_locked' } : null);
    sounds.playClick();
  };

  const handleUnlockQuestion = () => {
    if (!session) return;
    socket.emit('question:unlock', { sessionId: session.id });
    setSession(prev => prev ? { ...prev, status: 'active_question' } : null);
    sounds.playClick();
  };

  const handleRestartQuiz = () => {
    if (!session) return;
    socket.emit('game:restart', { sessionId: session.id });
    setSession(prev => prev ? { ...prev, status: 'active_question', currentSlideIndex: 0 } : null);
    setRevealedSlide(null);
    setDistribution({});
    setAnsweredCount(0);
    sounds.playCorrect();
  };

  const handleRevealAnswer = () => {
    if (!session) return;
    socket.emit('question:reveal', { sessionId: session.id });
  };

  const handleShowLeaderboard = () => {
    if (!session) return;
    socket.emit('leaderboard:show', { sessionId: session.id });
  };

  const handleToggleLock = () => {
    if (!session) return;
    socket.emit('lobby:toggle_lock', { sessionId: session.id });
  };

  const handleCopyJoinLink = () => {
    if (!session) return;
    const url = `${window.location.origin}/join?code=${session.joinCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleExportCsv = async () => {
    if (!session) return;
    sounds.playClick();

    try {
      await api.downloadSessionCsv(session.id, 'standings');
      sounds.playCorrect();
    } catch {
      // Complete participant map ensuring no participant is omitted
      const pMap = new Map<string, {
        nickname: string;
        avatarKey: string;
        score: number;
        streak: number;
        joinedAt?: string;
      }>();

      if (session.participants && session.participants.length > 0) {
        session.participants.forEach(p => {
          pMap.set(p.id, {
            nickname: p.nickname || 'Player',
            avatarKey: p.avatarKey || 'fox',
            score: typeof p.score === 'number' ? p.score : 0,
            streak: typeof p.streak === 'number' ? p.streak : 0,
            joinedAt: p.joinedAt
          });
        });
      }

      if (leaderboard && leaderboard.length > 0) {
        leaderboard.forEach(entry => {
          const existing = pMap.get(entry.participantId);
          if (existing) {
            existing.score = Math.max(existing.score, typeof entry.score === 'number' ? entry.score : 0);
            existing.streak = Math.max(existing.streak, typeof entry.streak === 'number' ? entry.streak : 0);
            if (entry.nickname) existing.nickname = entry.nickname;
            if (entry.avatarKey) existing.avatarKey = entry.avatarKey;
          } else {
            pMap.set(entry.participantId, {
              nickname: entry.nickname || 'Player',
              avatarKey: entry.avatarKey || 'fox',
              score: typeof entry.score === 'number' ? entry.score : 0,
              streak: typeof entry.streak === 'number' ? entry.streak : 0
            });
          }
        });
      }

      const list = Array.from(pMap.values());
      list.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.streak !== a.streak) return b.streak - a.streak;
        return a.nickname.localeCompare(b.nickname);
      });

      let currentRank = 1;
      const participantsList = list.map((p, idx) => {
        if (idx > 0 && p.score < list[idx - 1].score) {
          currentRank = idx + 1;
        }
        return {
          rank: currentRank,
          nickname: p.nickname,
          score: p.score,
          streak: p.streak
        };
      });

      exportClientStandingsCsv({
        sessionId: session.id,
        quizTitle: session.quizTitle,
        completedAt: session.completedAt || new Date().toISOString(),
        participants: participantsList
      });
      sounds.playCorrect();
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-400">Loading Host Control Room...</p>
        </div>
      </div>
    );
  }

  const currentSlide = session.slides[session.currentSlideIndex];
  const totalSlides = session.slides.length;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden select-none">
      {/* Floating Reactions overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        {reactions.map(r => (
          <div
            key={r.id}
            className="absolute bottom-16 animate-bounce text-4xl"
            style={{
              left: `${Math.random() * 80 + 10}%`,
              transition: 'all 2s ease-out'
            }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {/* Top Host Control Bar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 px-4 sm:px-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <QuizzoIcon size={24} />
          <span className="font-bold text-slate-100 text-sm sm:text-base truncate max-w-[180px] sm:max-w-xs">{session.quizTitle}</span>
          <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-blue-950 text-blue-300 border border-blue-800">
            Host Control
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold">
            <Users className="h-3.5 w-3.5 text-emerald-400" />
            <span>{session.participants.length} Players</span>
          </div>

          {/* Quick Start from Header if in Lobby */}
          {session.status === 'waiting' && (
            <button
              onClick={handleStartGame}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
              title="Launch the quiz immediately"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Start Quiz</span>
            </button>
          )}

          {/* Header Lock / Unlock Answer Options Toggle */}
          {(session.status === 'active_question' || session.status === 'question_locked') && (
            <button
              onClick={session.status === 'active_question' ? handleLockQuestion : handleUnlockQuestion}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                session.status === 'question_locked'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
              title={session.status === 'active_question' ? "Lock answer options to stop submissions" : "Unlock answer options to reopen submissions"}
            >
              {session.status === 'question_locked' ? (
                <>
                  <Unlock className="h-3.5 w-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Unlock Options</span>
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Lock Options</span>
                </>
              )}
            </button>
          )}

          {/* Header Question Navigation */}
          {session.status !== 'waiting' && session.status !== 'completed' && (
            <div className="flex items-center gap-1.5">
              {session.currentSlideIndex > 0 && (
                <button
                  onClick={handlePrevQuestion}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
                  title="Previous Question"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Prev</span>
                </button>
              )}
              <button
                onClick={handleNextQuestion}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-700 hover:bg-blue-600 shadow-sm transition-all cursor-pointer"
                title="Advance to next question"
              >
                <span>{session.currentSlideIndex + 1 < totalSlides ? 'Next Question' : 'Finish Quiz 🏆'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={() => navigate('/dashboard')}
            className="text-xs font-semibold text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Leave
          </button>
        </div>
      </header>

      {/* MAIN SCREEN BASED ON SESSION STATUS */}
      <main className="flex-1 flex flex-col p-4 sm:p-6 max-w-6xl w-full mx-auto justify-center">
        {/* 1. LOBBY VIEW */}
        {session.status === 'waiting' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Box: Big Game Code & QR Code */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <QuizzoIcon size={20} />
                <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
                  Join at {window.location.host}/join
                </span>
              </div>
              <div className="text-6xl sm:text-7xl font-black tracking-widest text-white font-mono bg-slate-800/80 px-6 py-3 rounded-2xl border border-slate-700 shadow-inner mb-6">
                {session.joinCode}
              </div>

              {/* QR Code Canvas */}
              {qrCodeDataUrl && (
                <div className="p-3 bg-white rounded-2xl shadow-lg mb-6">
                  <img src={qrCodeDataUrl} alt="Game QR Code" className="w-48 h-48 rounded-lg" />
                </div>
              )}

              <button
                onClick={handleCopyJoinLink}
                className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                {copiedLink ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                {copiedLink ? 'Join Link Copied!' : 'Copy Direct Join Link'}
              </button>
            </div>

            {/* Right Box: Participant Grid & Host Controls */}
            <div className="lg:col-span-7 flex flex-col justify-between h-full space-y-6">
              <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 flex-1 min-h-[360px] flex flex-col">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                  <div className="flex items-center gap-2 font-bold text-lg text-white">
                    <Users className="h-5 w-5 text-indigo-400" />
                    <span>Lobby Participants ({session.participants.length})</span>
                  </div>
                  <button
                    onClick={handleToggleLock}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      session.isLobbyLocked 
                        ? 'bg-rose-950/60 text-rose-400 border border-rose-800' 
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {session.isLobbyLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                    {session.isLobbyLocked ? 'Lobby Locked' : 'Lock Lobby'}
                  </button>
                </div>

                {/* Participant Avatars Grid */}
                {session.participants.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
                    <div className="h-12 w-12 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center mb-3">
                      <Users className="h-6 w-6 text-slate-600 animate-pulse" />
                    </div>
                    <p className="font-semibold text-slate-400">Waiting for players to join...</p>
                    <p className="text-xs text-slate-500 mt-1">Scan the QR code or enter code {session.joinCode}</p>
                    <p className="text-[11px] text-slate-600 mt-2">You can also start now to test or demo the quiz as host!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[300px] p-1">
                    {session.participants.map(p => {
                      const av = getAvatar(p.avatarKey);
                      return (
                        <div
                          key={p.id}
                          className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 animate-in fade-in"
                        >
                          <span className="text-2xl">{av.emoji}</span>
                          <span className="font-bold text-sm text-slate-100 truncate">{p.nickname}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Big Start Button - Host has full control to start anytime */}
              <button
                onClick={handleStartGame}
                className="w-full py-5 rounded-2xl font-black text-xl text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-3 cursor-pointer transform hover:scale-[1.01] active:scale-[0.99]"
              >
                <Play className="h-6 w-6 fill-current" />
                {session.participants.length === 0 
                  ? 'Start Quiz (Solo / Demo Mode)' 
                  : `Start Quiz with ${session.participants.length} Player${session.participants.length > 1 ? 's' : ''}!`}
              </button>
            </div>
          </div>
        )}

        {/* 2. ACTIVE QUESTION VIEW & QUESTION LOCKED VIEW */}
        {(session.status === 'active_question' || session.status === 'question_locked') && currentSlide && (
          <div className="space-y-6">
            {/* Question Quick-Switch Navigator Strip */}
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1.5 flex items-center gap-1 shrink-0">
                  <Layers className="h-3.5 w-3.5 text-blue-400" />
                  <span>Question:</span>
                </span>
                {session.slides.map((s, idx) => {
                  const isCurrent = idx === session.currentSlideIndex;
                  return (
                    <button
                      key={s.id || idx}
                      onClick={() => handleJumpQuestion(idx)}
                      className={`h-8 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                        isCurrent
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40 ring-2 ring-blue-400'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'
                      }`}
                      title={`Jump directly to Question ${idx + 1}: ${s.title}`}
                    >
                      <span>Q{idx + 1}</span>
                      {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-auto">
                {session.currentSlideIndex > 0 && (
                  <button
                    onClick={handlePrevQuestion}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                    title="Return to previous question"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Prev Question</span>
                  </button>
                )}
                <button
                  onClick={handleNextQuestion}
                  className="px-4 py-1.5 rounded-xl text-xs font-black text-white bg-blue-700 hover:bg-blue-600 shadow-md shadow-blue-700/25 transition-all flex items-center gap-1.5 cursor-pointer"
                  title={session.currentSlideIndex + 1 < totalSlides ? "Advance to next question" : "Complete quiz and view podium"}
                >
                  <span>{session.currentSlideIndex + 1 < totalSlides ? 'Next Question' : 'Finish Quiz 🏆'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Question Progress & Timer Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-blue-400 uppercase tracking-wider">
                  Question {session.currentSlideIndex + 1} of {totalSlides}
                </span>
                {session.status === 'question_locked' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <Lock className="h-3 w-3" />
                    Options Locked
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-lg font-black text-blue-400">
                  <Timer className="h-5 w-5" />
                  <span>{timeLeft}s</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-emerald-400">
                  <span>{answeredCount} / {session.participants.length} Answered</span>
                </div>
              </div>
            </div>

            {/* High-Visibility Locked Banner if Question is Locked */}
            {session.status === 'question_locked' && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-950/70 border border-amber-500/70 text-amber-200 shadow-xl shadow-amber-950/40 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/25 border border-amber-500/60 flex items-center justify-center text-amber-400 shrink-0">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-white">Answer Options Locked by Host</h4>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">Submissions Closed</span>
                    </div>
                    <p className="text-xs text-amber-300/80 mt-0.5">Players can no longer select or change answers. You can unlock them or proceed to reveal answers.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleUnlockQuestion}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/50 transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Allow players to submit answers again"
                  >
                    <Unlock className="h-3.5 w-3.5" />
                    <span>Unlock Options</span>
                  </button>
                </div>
              </div>
            )}

            {/* Question Title Card */}
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-center">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-relaxed">
                {currentSlide.title}
              </h2>
            </div>

            {/* Answer Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentSlide.options?.map((opt, idx) => (
                <div
                  key={opt.id}
                  className={`p-5 rounded-2xl border transition-all flex items-center justify-between gap-4 text-base font-bold ${
                    session.status === 'question_locked'
                      ? 'bg-slate-900/90 border-amber-500/40 text-slate-300'
                      : 'bg-slate-900/90 border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0"
                      style={{ backgroundColor: opt.color || '#6366F1' }}
                    >
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span>{opt.text}</span>
                  </div>
                  {session.status === 'question_locked' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-800/60 shrink-0">
                      <Lock className="h-3 w-3" />
                      Locked
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Host Controls for Active / Locked Question */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                {answeredCount >= session.participants.length && session.participants.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold animate-pulse">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    All Players Finished!
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {session.status === 'active_question' ? (
                  <>
                    {/* Host Lock Answer Options Button */}
                    <button
                      onClick={handleLockQuestion}
                      className="px-5 py-3 rounded-xl font-bold text-xs bg-amber-600/90 hover:bg-amber-600 text-white shadow-lg shadow-amber-600/20 border border-amber-500 transition-all flex items-center gap-2 cursor-pointer"
                      title="Lock answer options to stop player submissions"
                    >
                      <Lock className="h-4 w-4" />
                      <span>Lock Answer Options</span>
                    </button>

                    {/* Next Question button */}
                    <button
                      onClick={handleNextQuestion}
                      className="px-6 py-3 rounded-xl font-black text-sm bg-blue-700 hover:bg-blue-600 text-white transition-all shadow-lg shadow-blue-700/25 flex items-center gap-2 cursor-pointer"
                      title="Advance to next question"
                    >
                      <span>{session.currentSlideIndex + 1 < totalSlides ? 'Next Question' : 'Finish Quiz 🏆'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    {/* Host Unlock Answer Options Button */}
                    <button
                      onClick={handleUnlockQuestion}
                      className="px-5 py-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/50 transition-colors flex items-center gap-2 cursor-pointer"
                      title="Unlock answer options to allow player submissions"
                    >
                      <Unlock className="h-4 w-4" />
                      <span>Unlock Answer Options</span>
                    </button>

                    {/* Reveal Answer */}
                    <button
                      onClick={handleRevealAnswer}
                      className="px-6 py-3 rounded-xl font-extrabold text-sm bg-indigo-700 hover:bg-indigo-600 text-white transition-all shadow-md flex items-center gap-2 cursor-pointer"
                    >
                      <span>Reveal Correct Answer</span>
                      <Sparkles className="h-4 w-4 text-amber-300" />
                    </button>

                    {/* Next Question */}
                    <button
                      onClick={handleNextQuestion}
                      className="px-6 py-3 rounded-xl font-black text-sm bg-blue-700 hover:bg-blue-600 text-white transition-all shadow-xl shadow-blue-700/25 flex items-center gap-2 cursor-pointer"
                      title="Advance to next question"
                    >
                      <span>{session.currentSlideIndex + 1 < totalSlides ? 'Next Question' : 'Finish Quiz 🏆'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. ANSWER REVEAL VIEW */}
        {session.status === 'answer_reveal' && revealedSlide && (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Answer Distribution & Breakdown
              </span>
              <h2 className="text-2xl font-black text-white mt-1">
                {revealedSlide.title}
              </h2>
            </div>

            {/* Options with correctness and distribution bars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {revealedSlide.options?.map((opt, idx) => {
                const count = distribution[opt.id] || 0;
                const isCorrect = opt.isCorrect;
                return (
                  <div
                    key={opt.id}
                    className={`relative p-5 rounded-2xl border transition-all ${
                      isCorrect
                        ? 'bg-emerald-950/60 border-emerald-500 shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-black text-xs shrink-0"
                          style={{ backgroundColor: opt.color || '#6366F1' }}
                        >
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className={`font-bold text-base ${isCorrect ? 'text-emerald-300' : 'text-slate-300'}`}>
                          {opt.text}
                        </span>
                      </div>
                      {isCorrect && <CheckCircle className="h-6 w-6 text-emerald-400 shrink-0" />}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mt-3">
                      <span>{count} votes</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Explanation box */}
            {revealedSlide.explanation && (
              <div className="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-800/80 text-sm text-indigo-200">
                <span className="font-bold block mb-1">Key Insight:</span>
                {revealedSlide.explanation}
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={handleShowLeaderboard}
                className="px-6 py-3.5 rounded-xl font-bold text-sm bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 shadow-md flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Trophy className="h-4 w-4 text-amber-400" />
                <span>View Leaderboard</span>
              </button>

              <button
                onClick={handleNextQuestion}
                className="px-8 py-3.5 rounded-xl font-black text-base text-white bg-blue-700 hover:bg-blue-800 shadow-xl shadow-blue-700/25 flex items-center gap-2.5 cursor-pointer transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{session.currentSlideIndex + 1 < totalSlides ? 'Next Question' : 'View Final Podium 🏆'}</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* 4. LEADERBOARD VIEW */}
        {session.status === 'leaderboard' && (
          <div className="space-y-6 max-w-3xl mx-auto w-full">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                Standings After Question {session.currentSlideIndex + 1}
              </span>
              <h2 className="text-3xl font-black text-white mt-1">
                Leaderboard
              </h2>
            </div>

            <div className="space-y-2.5">
              {leaderboard.slice(0, 7).map((entry, idx) => {
                const av = getAvatar(entry.avatarKey);
                return (
                  <div
                    key={entry.participantId}
                    className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md animate-in slide-in-from-bottom"
                  >
                    <div className="flex items-center gap-4">
                      <span className={`font-black text-lg w-7 text-center ${
                        idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-600' : 'text-slate-500'
                      }`}>
                        #{idx + 1}
                      </span>
                      <span className="text-2xl">{av.emoji}</span>
                      <span className="font-bold text-base text-white">{entry.nickname}</span>
                      {entry.streak >= 2 && (
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-800">
                          <Flame className="h-3 w-3 fill-amber-400" />
                          <span>{entry.streak}x</span>
                        </div>
                      )}
                    </div>
                    <div className="font-mono font-black text-lg text-blue-400">
                      {entry.score.toLocaleString()} pts
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleNextQuestion}
                className="px-8 py-4 rounded-xl font-black text-base text-white bg-blue-700 hover:bg-blue-800 shadow-xl shadow-blue-700/25 flex items-center gap-2 cursor-pointer transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{session.currentSlideIndex + 1 < totalSlides ? 'Next Question' : 'View Final Podium 🏆'}</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* 5. FINAL PODIUM VIEW */}
        {session.status === 'completed' && (
          <div className="space-y-8 max-w-4xl mx-auto w-full text-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
                Game Completed
              </span>
              <h2 className="text-4xl font-black text-white mt-1">
                Championship Podium 🏆
              </h2>
            </div>

            {/* 3-Step Podium */}
            <div className="flex items-end justify-center gap-4 pt-8 pb-4">
              {/* 2nd Place */}
              {leaderboard[1] && (
                <div className="flex flex-col items-center">
                  <div className="text-4xl mb-2">{getAvatar(leaderboard[1].avatarKey).emoji}</div>
                  <span className="font-bold text-sm text-slate-200 mb-1">{leaderboard[1].nickname}</span>
                  <span className="font-mono text-xs text-indigo-300 font-bold mb-2">{leaderboard[1].score} pts</span>
                  <div className="w-24 sm:w-28 h-32 rounded-t-2xl bg-gradient-to-t from-slate-800 to-slate-700 flex items-center justify-center font-black text-2xl text-slate-300 border-t-2 border-slate-400">
                    2
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {leaderboard[0] && (
                <div className="flex flex-col items-center">
                  <div className="text-5xl mb-2 animate-bounce">{getAvatar(leaderboard[0].avatarKey).emoji}</div>
                  <span className="font-black text-base text-amber-300 mb-1">{leaderboard[0].nickname}</span>
                  <span className="font-mono text-sm text-amber-400 font-black mb-2">{leaderboard[0].score} pts</span>
                  <div className="w-28 sm:w-36 h-44 rounded-t-2xl bg-gradient-to-t from-amber-600 to-yellow-500 flex items-center justify-center font-black text-4xl text-slate-950 border-t-4 border-yellow-300 shadow-xl shadow-amber-500/20">
                    1
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {leaderboard[2] && (
                <div className="flex flex-col items-center">
                  <div className="text-4xl mb-2">{getAvatar(leaderboard[2].avatarKey).emoji}</div>
                  <span className="font-bold text-sm text-slate-200 mb-1">{leaderboard[2].nickname}</span>
                  <span className="font-mono text-xs text-indigo-300 font-bold mb-2">{leaderboard[2].score} pts</span>
                  <div className="w-24 sm:w-28 h-24 rounded-t-2xl bg-gradient-to-t from-amber-900 to-amber-800 flex items-center justify-center font-black text-2xl text-amber-200 border-t-2 border-amber-600">
                    3
                  </div>
                </div>
              )}
            </div>

            {/* Actions: Restart Quiz, Export CSV and Return */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-6">
              <button
                onClick={handleRestartQuiz}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
                title="Restart this quiz session"
              >
                <RotateCcw className="h-4 w-4" />
                Play Again / Restart Quiz
              </button>
              <button
                onClick={handleExportCsv}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-blue-700 hover:bg-blue-600 text-white shadow-lg shadow-blue-700/25 transition-all cursor-pointer"
              >
                <Download className="h-4 w-4" />
                Export Standings CSV
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-8 py-3.5 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all cursor-pointer"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
