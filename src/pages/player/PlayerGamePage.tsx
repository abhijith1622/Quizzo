import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  Flame, 
  Timer, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Send, 
  Star, 
  Users,
  Download,
  Lock,
  Unlock
} from 'lucide-react';
import { getSocket } from '../../services/socket';
import { QuizSlide, LeaderboardEntry } from '../../types/quiz';
import { getAvatar } from '../../utils/avatars';
import { sounds, triggerConfetti, triggerWinnerConfetti } from '../../utils/effects';
import { QuizzoIcon } from '../../components/common/QuizzoLogo';
import { exportClientStandingsCsv } from '../../utils/csvExport';

const EMOJI_REACTIONS = ['🔥', '👏', '🚀', '❤️', '💡', '🎉'];

export const PlayerGamePage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  // Retrieve player identity from sessionStorage or prompt
  const [playerData, setPlayerData] = useState<{
    participantId: string;
    nickname: string;
    avatarKey: string;
    teamId?: string;
  } | null>(() => {
    const saved = sessionStorage.getItem('quizzo_player') || sessionStorage.getItem('pulsequiz_player');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return null;
  });

  const [gameState, setGameState] = useState<any>({
    status: 'waiting',
    quizTitle: 'Live Quiz',
    currentSlideIndex: 0,
    totalSlides: 1,
    currentSlide: null as QuizSlide | null,
    participantsCount: 1
  });

  const [selectedAnswer, setSelectedAnswer] = useState<any>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<{ isCorrect: boolean; pointsEarned: number } | null>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [playerStreak, setPlayerStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [totalTime, setTotalTime] = useState(20);
  const [slideStartTime, setSlideStartTime] = useState(Date.now());
  const [revealedSlide, setRevealedSlide] = useState<QuizSlide | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [numericInput, setNumericInput] = useState('');
  const [textInput, setTextInput] = useState('');

  const socket = getSocket();

  // If no player identity, redirect to join
  useEffect(() => {
    if (!playerData && sessionId) {
      navigate(`/join?session=${sessionId}`);
    }
  }, [playerData, sessionId]);

  // Connect socket and listen
  useEffect(() => {
    if (!sessionId || !playerData) return;

    socket.emit('game:join', {
      sessionId,
      participantId: playerData.participantId,
      nickname: playerData.nickname,
      avatarKey: playerData.avatarKey,
      teamId: playerData.teamId
    }, (resp: any) => {
      if (resp?.success && resp.session) {
        setGameState((prev: any) => ({
          ...prev,
          status: resp.session.status,
          quizTitle: resp.session.quizTitle,
          currentSlide: resp.session.currentSlide,
          participantsCount: resp.session.participantsCount
        }));
      }
    });

    // Question started
    socket.on('question:started', (data: { slide: QuizSlide; slideIndex: number; totalSlides: number; durationSeconds: number }) => {
      setGameState((prev: any) => ({
        ...prev,
        status: 'active_question',
        currentSlide: data.slide,
        currentSlideIndex: data.slideIndex,
        totalSlides: data.totalSlides
      }));
      setTotalTime(data.durationSeconds || 20);
      setTimeLeft(data.durationSeconds || 20);
      setSlideStartTime(Date.now());
      setSelectedAnswer(null);
      setHasSubmitted(false);
      setSubmissionFeedback(null);
      setRevealedSlide(null);
      setNumericInput('');
      setTextInput('');
      sounds.playClick();
    });

    // Question locked by host
    socket.on('question:locked', () => {
      setGameState((prev: any) => ({ ...prev, status: 'question_locked' }));
      sounds.playClick();
    });

    // Question unlocked by host
    socket.on('question:unlocked', () => {
      setGameState((prev: any) => ({ ...prev, status: 'active_question' }));
      sounds.playClick();
    });

    // Answer revealed
    socket.on('answer:revealed', (data: { slide: QuizSlide }) => {
      setRevealedSlide(data.slide);
      setGameState((prev: any) => ({ ...prev, status: 'answer_reveal' }));
    });

    // Leaderboard update
    socket.on('leaderboard:update', (data: { leaderboard: LeaderboardEntry[] }) => {
      setLeaderboard(data.leaderboard);
      setGameState((prev: any) => ({ ...prev, status: 'leaderboard' }));
    });

    // Game completed
    socket.on('game:completed', (data: { leaderboard: LeaderboardEntry[] }) => {
      setLeaderboard(data.leaderboard);
      setGameState((prev: any) => ({ ...prev, status: 'completed' }));
      sounds.playPodiumFanfare();
      triggerWinnerConfetti();
    });

    return () => {
      socket.off('question:started');
      socket.off('question:locked');
      socket.off('question:unlocked');
      socket.off('answer:revealed');
      socket.off('leaderboard:update');
      socket.off('game:completed');
    };
  }, [sessionId, playerData]);

  // Player Countdown Timer
  useEffect(() => {
    if (gameState.status !== 'active_question' || hasSubmitted) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        if (prev <= 4) {
          sounds.playCountdownTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.status, hasSubmitted]);

  // Submit Answer to server
  const handleSubmitAnswer = (answerVal: any) => {
    if (hasSubmitted || gameState.status !== 'active_question' || !playerData || !sessionId) return;

    setSelectedAnswer(answerVal);
    setHasSubmitted(true);
    const responseTimeMs = Date.now() - slideStartTime;
    sounds.playClick();

    socket.emit('answer:submit', {
      sessionId,
      participantId: playerData.participantId,
      answer: answerVal,
      responseTimeMs
    }, (resp: any) => {
      if (resp?.success) {
        setSubmissionFeedback({
          isCorrect: resp.isCorrect,
          pointsEarned: resp.pointsEarned
        });
        setPlayerScore(resp.newScore);
        setPlayerStreak(resp.streak);

        if (resp.isCorrect) {
          sounds.playCorrect();
          triggerConfetti();
        } else {
          sounds.playIncorrect();
        }
      }
    });
  };

  // Send Floating Emoji Reaction
  const handleSendReaction = (emoji: string) => {
    if (!sessionId || !playerData) return;
    socket.emit('game:reaction', {
      sessionId,
      emoji,
      nickname: playerData.nickname
    });
    sounds.playClick();
  };

  const handleExportPlayerScorecard = () => {
    const list = leaderboard.length > 0 ? leaderboard.map(l => ({
      rank: l.rank,
      nickname: l.nickname,
      score: l.score,
      streak: l.streak
    })) : (playerData ? [{
      rank: 1,
      nickname: playerData.nickname,
      score: playerScore,
      streak: playerStreak
    }] : []);

    exportClientStandingsCsv({
      sessionId: sessionId || 'game',
      quizTitle: gameState.quizTitle || 'Quizzo Live Game',
      completedAt: new Date().toISOString(),
      participants: list
    });
    sounds.playCorrect();
  };

  if (!playerData) {
    return null;
  }

  const avatar = getAvatar(playerData.avatarKey);
  const currentSlide = gameState.currentSlide as QuizSlide | null;
  const myLeaderboardEntry = leaderboard.find(e => e.participantId === playerData.participantId);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between select-none">
      {/* Top Player HUD */}
      <header className="h-14 border-b border-slate-800 bg-slate-950/80 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <QuizzoIcon size={22} />
          <span className="text-xl">{avatar.emoji}</span>
          <span className="font-bold text-sm text-slate-200">{playerData.nickname}</span>
          {playerStreak >= 2 && (
            <div className="flex items-center gap-1 text-[11px] font-black text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800">
              <Flame className="h-3 w-3 fill-amber-400" />
              <span>{playerStreak}x</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-sm font-black text-indigo-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
            <Trophy className="h-4 w-4 text-indigo-500" />
            <span>{playerScore.toLocaleString()}</span>
          </div>
        </div>
      </header>

      {/* MAIN GAMEPLAY AREA */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 max-w-md w-full mx-auto">
        {/* 1. LOBBY WAITING */}
        {gameState.status === 'waiting' && (
          <div className="text-center space-y-6 w-full animate-in fade-in">
            <div className="inline-block p-6 rounded-full bg-slate-800/80 border-2 border-slate-700 shadow-xl">
              <span className="text-6xl animate-bounce">{avatar.emoji}</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">You're in!</h2>
              <p className="text-sm text-slate-400 mt-1">Waiting for the host to launch the game...</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 text-xs text-slate-300">
              <span className="font-bold block text-indigo-400 mb-1">⚡ Pro Tip</span>
              Answer quickly! Faster correct submissions earn maximum speed factor bonus points.
            </div>
          </div>
        )}

        {/* 2. ACTIVE QUESTION INTERFACE */}
        {(gameState.status === 'active_question' || gameState.status === 'question_locked') && currentSlide && (
          <div className="w-full space-y-4">
            {/* Countdown Bar & Slide Info */}
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <div className="flex items-center gap-2">
                <span>Question {gameState.currentSlideIndex + 1} of {gameState.totalSlides}</span>
                {gameState.status === 'question_locked' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800">
                    <Lock className="h-3 w-3" />
                    Locked
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 font-mono text-indigo-400 bg-slate-800 px-2 py-0.5 rounded-md">
                <Timer className="h-3.5 w-3.5" />
                <span>{timeLeft}s</span>
              </div>
            </div>

            {/* Timer bar */}
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${(timeLeft / totalTime) * 100}%` }}
              />
            </div>

            {/* Question prompt */}
            <div className="p-5 rounded-2xl bg-slate-800/90 border border-slate-700 text-center font-bold text-lg text-white">
              {currentSlide.title}
            </div>

            {/* If answer locked in, show pending state */}
            {hasSubmitted ? (
              <div className="p-8 rounded-2xl bg-indigo-950/40 border border-indigo-800/60 text-center space-y-3">
                <div className="flex justify-center">
                  <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center text-white animate-pulse">
                    <Sparkles className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="font-extrabold text-lg text-white">
                  {gameState.status === 'question_locked' ? 'Answer Recorded & Locked!' : 'Answer Locked In!'}
                </h3>
                <p className="text-xs text-indigo-200">
                  {gameState.status === 'question_locked' 
                    ? 'The host locked submissions. Waiting for host to reveal results...' 
                    : 'Waiting for other players & host reveal...'}
                </p>
              </div>
            ) : gameState.status === 'question_locked' ? (
              <div className="p-8 rounded-2xl bg-amber-950/50 border border-amber-600/70 text-center space-y-3 animate-in fade-in shadow-xl">
                <div className="flex justify-center">
                  <div className="h-12 w-12 rounded-full bg-amber-600/80 flex items-center justify-center text-white">
                    <Lock className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="font-extrabold text-lg text-white">Options Locked by Host</h3>
                <p className="text-xs text-amber-200">
                  The host has locked answer submissions for this question. Stand by for the answer reveal!
                </p>
              </div>
            ) : (
              /* Input forms based on slideType */
              <>
                {/* Multiple Choice Options */}
                {currentSlide.slideType === 'multiple_choice' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentSlide.options?.map((opt, idx) => (
                      <button
                        key={opt.id}
                        onClick={() => handleSubmitAnswer(opt.id)}
                        className="p-4 rounded-2xl border border-slate-700 bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-left font-bold text-base transition-all flex items-center gap-3 cursor-pointer shadow-md"
                      >
                        <div
                          className="h-8 w-8 rounded-xl flex items-center justify-center text-white font-black text-xs shrink-0"
                          style={{ backgroundColor: opt.color || '#6366F1' }}
                        >
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className="flex-1 text-slate-100">{opt.text}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* True / False Options */}
                {currentSlide.slideType === 'true_false' && (
                  <div className="grid grid-cols-2 gap-3">
                    {currentSlide.options?.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => handleSubmitAnswer(opt.id)}
                        className={`p-6 rounded-2xl font-black text-xl border transition-all active:scale-95 text-center shadow-lg cursor-pointer ${
                          opt.text.toLowerCase() === 'true'
                            ? 'bg-blue-600/90 hover:bg-blue-500 border-blue-400 text-white'
                            : 'bg-rose-600/90 hover:bg-rose-500 border-rose-400 text-white'
                        }`}
                      >
                        {opt.text}
                      </button>
                    ))}
                  </div>
                )}

                {/* Numeric Question Input */}
                {currentSlide.slideType === 'numeric' && (
                  <form
                    onSubmit={(e) => { e.preventDefault(); if (numericInput) handleSubmitAnswer(Number(numericInput)); }}
                    className="space-y-3"
                  >
                    <input
                      type="number"
                      step="any"
                      placeholder="Type your number..."
                      value={numericInput}
                      onChange={(e) => setNumericInput(e.target.value)}
                      className="w-full text-center text-3xl font-black font-mono py-4 px-4 rounded-2xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={!numericInput}
                      className="w-full py-4 rounded-xl font-black text-base bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-all shadow-md cursor-pointer"
                    >
                      Submit Number
                    </button>
                  </form>
                )}

                {/* Poll / Rating / Word Cloud */}
                {(currentSlide.slideType === 'poll' || currentSlide.slideType === 'word_cloud' || currentSlide.slideType === 'open_ended') && (
                  <div className="space-y-3">
                    {currentSlide.slideType === 'poll' && (
                      <div className="grid grid-cols-1 gap-2.5">
                        {currentSlide.options?.map(opt => (
                          <button
                            key={opt.id}
                            onClick={() => handleSubmitAnswer(opt.id)}
                            className="p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left font-bold text-sm text-slate-100 cursor-pointer"
                          >
                            {opt.text}
                          </button>
                        ))}
                      </div>
                    )}

                    {(currentSlide.slideType === 'word_cloud' || currentSlide.slideType === 'open_ended') && (
                      <form
                        onSubmit={(e) => { e.preventDefault(); if (textInput.trim()) handleSubmitAnswer(textInput.trim()); }}
                        className="space-y-3"
                      >
                        <input
                          type="text"
                          maxLength={currentSlide.openEndedMaxChars || 80}
                          placeholder="Type your response..."
                          value={textInput}
                          onChange={(e) => setTextInput(e.target.value)}
                          className="w-full py-3.5 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          autoFocus
                        />
                        <button
                          type="submit"
                          disabled={!textInput.trim()}
                          className="w-full py-3.5 rounded-xl font-bold bg-indigo-600 text-white"
                        >
                          Send
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 3. ANSWER REVEAL SCREEN */}
        {gameState.status === 'answer_reveal' && (
          <div className="w-full text-center space-y-4 animate-in zoom-in-95">
            {submissionFeedback?.isCorrect ? (
              <div className="p-6 rounded-3xl bg-emerald-950/60 border border-emerald-500/80 shadow-2xl space-y-2">
                <CheckCircle2 className="h-16 w-16 text-emerald-400 mx-auto" />
                <h3 className="text-2xl font-black text-emerald-300">Correct!</h3>
                <p className="text-xl font-black font-mono text-emerald-400">+{submissionFeedback.pointsEarned} pts</p>
              </div>
            ) : (
              <div className="p-6 rounded-3xl bg-rose-950/60 border border-rose-500/80 shadow-2xl space-y-2">
                <XCircle className="h-16 w-16 text-rose-400 mx-auto" />
                <h3 className="text-2xl font-black text-rose-300">Not quite!</h3>
                <p className="text-xs text-rose-300">0 pts awarded</p>
              </div>
            )}

            {revealedSlide?.explanation && (
              <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 text-xs text-slate-300 text-left">
                <span className="font-bold block text-indigo-400 mb-1">Insight</span>
                {revealedSlide.explanation}
              </div>
            )}
          </div>
        )}

        {/* 4. LEADERBOARD SCREEN */}
        {gameState.status === 'leaderboard' && (
          <div className="w-full space-y-4 text-center animate-in fade-in">
            <h3 className="text-xl font-black text-white">Live Leaderboard</h3>
            {myLeaderboardEntry && (
              <div className="p-5 rounded-2xl bg-indigo-950/70 border border-indigo-700/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-black text-2xl text-amber-400">#{myLeaderboardEntry.rank}</span>
                  <span className="text-3xl">{avatar.emoji}</span>
                  <div className="text-left">
                    <span className="font-bold text-sm text-white block">You</span>
                    <span className="text-xs text-indigo-300">{myLeaderboardEntry.score} pts</span>
                  </div>
                </div>
                {myLeaderboardEntry.streak >= 2 && (
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
                    <Flame className="h-4 w-4 fill-amber-400" />
                    <span>{myLeaderboardEntry.streak}x</span>
                  </div>
                )}
              </div>
            )}
            <p className="text-xs text-slate-400">Look at the host screen for full podium movements!</p>
          </div>
        )}

        {/* 5. GAME COMPLETED SCREEN */}
        {gameState.status === 'completed' && (
          <div className="w-full text-center space-y-5 animate-in zoom-in-95">
            <Trophy className="h-20 w-20 text-amber-400 mx-auto animate-bounce" />
            <h2 className="text-3xl font-black text-white">Game Over!</h2>
            {myLeaderboardEntry && (
              <div className="p-6 rounded-3xl bg-slate-800/80 border border-slate-700 space-y-2">
                <span className="text-4xl">{avatar.emoji}</span>
                <h4 className="text-xl font-extrabold text-amber-300">Rank #{myLeaderboardEntry.rank}</h4>
                <p className="text-2xl font-black font-mono text-white">{myLeaderboardEntry.score} Total Points</p>
              </div>
            )}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleExportPlayerScorecard}
                className="w-full py-3.5 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="h-4 w-4 text-blue-400" />
                <span>Export Official Scorecard CSV</span>
              </button>
              <button
                onClick={() => navigate('/join')}
                className="w-full py-3.5 rounded-xl font-bold bg-blue-700 hover:bg-blue-800 text-white shadow-lg shadow-blue-700/25 transition-all cursor-pointer"
              >
                Play Another Game
              </button>
            </div>
          </div>
        )}
      </main>

      {/* FLOATING EMOJI REACTIONS BAR */}
      <footer className="h-16 border-t border-slate-800 bg-slate-950/90 px-4 flex items-center justify-center gap-3">
        {EMOJI_REACTIONS.map(emoji => (
          <button
            key={emoji}
            onClick={() => handleSendReaction(emoji)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-125 text-2xl transition-all cursor-pointer shadow-sm"
          >
            {emoji}
          </button>
        ))}
      </footer>
    </div>
  );
};
