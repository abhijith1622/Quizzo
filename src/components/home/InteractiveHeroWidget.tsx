import React, { useState, useEffect } from 'react';
import { Trophy, Timer, CheckCircle2, XCircle, Flame, Sparkles, RefreshCw } from 'lucide-react';
import { sounds, triggerConfetti } from '../../utils/effects';

interface PreviewOption {
  id: string;
  text: string;
  isCorrect: boolean;
  color: string;
}

const SAMPLE_QUESTION = {
  title: "In Node.js, which event loop phase executes `process.nextTick` callbacks?",
  type: "Multiple Choice",
  totalTime: 15,
  options: [
    { id: 'opt_1', text: 'Timers phase callbacks', isCorrect: false, color: '#EF4444' },
    { id: 'opt_2', text: 'Immediately after current microtask', isCorrect: true, color: '#1D4ED8' },
    { id: 'opt_3', text: 'Close callbacks phase', isCorrect: false, color: '#F59E0B' },
    { id: 'opt_4', text: 'Poll phase I/O only', isCorrect: false, color: '#10B981' }
  ]
};

export const InteractiveHeroWidget: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(SAMPLE_QUESTION.totalTime);
  const [userScore, setUserScore] = useState(3420);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [streak, setStreak] = useState(4);

  // Timer simulation
  useEffect(() => {
    if (isRevealed) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleReveal(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRevealed]);

  const handleSelect = (optionId: string) => {
    if (selectedId || isRevealed) return;
    setSelectedId(optionId);
    sounds.playClick();
    
    // Auto-reveal after brief suspense
    setTimeout(() => {
      handleReveal(optionId);
    }, 400);
  };

  const handleReveal = (optId: string | null) => {
    setIsRevealed(true);
    const chosen = SAMPLE_QUESTION.options.find(o => o.id === optId);
    if (chosen && chosen.isCorrect) {
      const speedFactor = 0.5 + 0.5 * (timeLeft / SAMPLE_QUESTION.totalTime);
      const earned = Math.round(1000 * speedFactor);
      setPointsEarned(earned);
      setUserScore(prev => prev + earned);
      setStreak(prev => prev + 1);
      sounds.playCorrect();
      triggerConfetti();
    } else {
      sounds.playIncorrect();
      setPointsEarned(0);
      setStreak(0);
    }
  };

  const handleReset = () => {
    setSelectedId(null);
    setIsRevealed(false);
    setTimeLeft(SAMPLE_QUESTION.totalTime);
    setPointsEarned(0);
  };

  const timerPercent = (timeLeft / SAMPLE_QUESTION.totalTime) * 100;

  return (
    <div className="relative mx-auto w-full max-w-2xl rounded-3xl border border-blue-100 bg-white/95 p-6 shadow-2xl shadow-blue-950/10 transition-all">
      {/* Top status bar */}
      <div className="flex items-center justify-between pb-4 border-b border-blue-50">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-blue-600 animate-ping" />
          <span className="text-xs font-bold tracking-wider uppercase text-blue-800">
            Interactive Live Preview
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            <span>Streak {streak}x</span>
          </div>
          <div className="flex items-center gap-1 text-blue-900 font-extrabold">
            <Trophy className="h-3.5 w-3.5 text-blue-700" />
            <span>{userScore} pts</span>
          </div>
        </div>
      </div>

      {/* Timer & Question Header */}
      <div className="pt-4">
        <div className="flex items-center justify-between gap-4 mb-3">
          <span className="text-xs font-semibold text-slate-500">
            Question 3 of 5 • Speed Scoring Active
          </span>
          {/* Countdown Pill */}
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-blue-900 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200">
            <Timer className="h-3.5 w-3.5 text-blue-700" />
            <span>{timeLeft}s</span>
          </div>
        </div>

        {/* Linear Timer Bar - Deep Royal Blue */}
        <div className="h-2 w-full rounded-full bg-blue-50 overflow-hidden mb-5">
          <div 
            className="h-full bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500 transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${timerPercent}%` }}
          />
        </div>

        {/* Question text */}
        <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-snug mb-5">
          {SAMPLE_QUESTION.title}
        </h3>

        {/* 4 Answer Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {SAMPLE_QUESTION.options.map((option, idx) => {
            const isSelected = selectedId === option.id;
            const isCorrect = option.isCorrect;
            
            let btnStyle = "border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 bg-white";
            
            if (isRevealed) {
              if (isCorrect) {
                btnStyle = "border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/40 font-bold";
              } else if (isSelected && !isCorrect) {
                btnStyle = "border-rose-500 bg-rose-50 text-rose-950 ring-2 ring-rose-500/40";
              } else {
                btnStyle = "opacity-40 border-slate-200";
              }
            } else if (isSelected) {
              btnStyle = "border-blue-700 bg-blue-50/80 ring-2 ring-blue-600/40 font-bold";
            }

            return (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                disabled={isRevealed}
                className={`relative flex items-center gap-3 p-3.5 rounded-2xl border text-left font-semibold text-sm transition-all text-slate-800 ${btnStyle}`}
              >
                <div 
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-white font-black text-xs shadow-xs"
                  style={{ backgroundColor: option.color }}
                >
                  {String.fromCharCode(65 + idx)}
                </div>
                <span className="flex-1">{option.text}</span>
                {isRevealed && isCorrect && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                )}
                {isRevealed && isSelected && !isCorrect && (
                  <XCircle className="h-5 w-5 text-rose-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback / Result Banner */}
        {isRevealed && (
          <div className="mb-5 p-4 rounded-2xl bg-blue-50/80 border border-blue-200 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-sm text-blue-950">
                {selectedId === 'opt_2' ? (
                  <>
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    <span className="text-emerald-700 font-extrabold">Correct! Fast response</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-rose-600" />
                    <span className="text-rose-700 font-extrabold">Next time! `nextTick` queues microtasks</span>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Earned: <span className="font-extrabold text-blue-700">+{pointsEarned} pts</span> • Server validated
              </p>
            </div>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-white border border-blue-200 hover:bg-blue-50 text-blue-900 transition-colors shadow-xs"
            >
              <RefreshCw className="h-3 w-3 text-blue-700" />
              Try Again
            </button>
          </div>
        )}

        {/* Mini Leaderboard preview */}
        <div className="border-t border-blue-50 pt-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
            <span>Live Standings (Room #849201)</span>
            <span>24 Players Online</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-50/80 border border-amber-200/80">
              <span className="text-xs font-black text-amber-700">#1</span>
              <span className="text-sm">🦊</span>
              <div className="truncate text-[11px] font-semibold text-slate-800">
                Maya S. <span className="text-slate-500 block font-mono font-bold">4,850</span>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-xs font-black text-blue-800">#2</span>
              <span className="text-sm">🤖</span>
              <div className="truncate text-[11px] font-semibold text-slate-800">
                You <span className="text-blue-800 font-mono font-black block">{userScore}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-black text-slate-600">#3</span>
              <span className="text-sm">🐱</span>
              <div className="truncate text-[11px] font-semibold text-slate-800">
                Zara N. <span className="text-slate-500 block font-mono font-bold">3,950</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
