import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Trophy, 
  Flame, 
  Timer, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  RotateCcw, 
  Home, 
  Sparkles,
  Download
} from 'lucide-react';
import { api } from '../../services/api';
import { Quiz, QuizSlide } from '../../types/quiz';
import { sounds, triggerConfetti, triggerWinnerConfetti } from '../../utils/effects';
import { exportClientStandingsCsv } from '../../utils/csvExport';
import { QuizzoIcon } from '../../components/common/QuizzoLogo';

export const SoloPlayPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [numericInput, setNumericInput] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);

  useEffect(() => {
    if (!quizId) return;
    api.getQuiz(quizId).then(res => {
      setQuiz(res.quiz);
      if (res.quiz.slides[0]) {
        setTimeLeft(res.quiz.slides[0].timeLimitSeconds || 20);
      }
    }).catch(err => console.error(err));
  }, [quizId]);

  useEffect(() => {
    if (isRevealed || isCompleted || !quiz) return;
    const currentSlide = quiz.slides[currentSlideIndex];
    if (!currentSlide) return;

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
  }, [currentSlideIndex, isRevealed, isCompleted, quiz]);

  const handleSelectOption = (optId: string) => {
    if (isRevealed) return;
    setSelectedOptionId(optId);
    handleReveal(optId);
  };

  const handleReveal = (optId: string | null) => {
    if (!quiz) return;
    setIsRevealed(true);
    const currentSlide = quiz.slides[currentSlideIndex];

    let isCorrect = false;
    if (currentSlide.slideType === 'multiple_choice' || currentSlide.slideType === 'true_false') {
      const correct = currentSlide.options?.find(o => o.isCorrect);
      if (correct && correct.id === optId) {
        isCorrect = true;
      }
    } else if (currentSlide.slideType === 'numeric') {
      const num = Number(numericInput);
      const expected = Number(currentSlide.expectedNumericAnswer);
      const tol = Number(currentSlide.numericTolerance || 0);
      if (!isNaN(num) && Math.abs(num - expected) <= tol) {
        isCorrect = true;
      }
    } else {
      isCorrect = true; // Polls / word clouds
    }

    if (isCorrect) {
      const speedFactor = 0.5 + 0.5 * (timeLeft / (currentSlide.timeLimitSeconds || 20));
      const multiplier = currentSlide.isDoublePoints ? 2 : 1;
      const earned = Math.round((currentSlide.basePoints || 1000) * speedFactor * multiplier);
      setScore(prev => prev + earned);
      setStreak(prev => prev + 1);
      sounds.playCorrect();
      triggerConfetti();
    } else {
      sounds.playIncorrect();
      setStreak(0);
    }
  };

  const handleNext = () => {
    if (!quiz) return;
    if (currentSlideIndex + 1 < quiz.slides.length) {
      const nextIdx = currentSlideIndex + 1;
      setCurrentSlideIndex(nextIdx);
      setSelectedOptionId(null);
      setIsRevealed(false);
      setNumericInput('');
      setTimeLeft(quiz.slides[nextIdx].timeLimitSeconds || 20);
    } else {
      setIsCompleted(true);
      sounds.playPodiumFanfare();
      triggerWinnerConfetti();
    }
  };

  const handleRestart = () => {
    setCurrentSlideIndex(0);
    setScore(0);
    setStreak(0);
    setSelectedOptionId(null);
    setIsRevealed(false);
    setIsCompleted(false);
    setNumericInput('');
    if (quiz?.slides[0]) {
      setTimeLeft(quiz.slides[0].timeLimitSeconds || 20);
    }
  };

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const currentSlide = quiz.slides[currentSlideIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-6">
      {/* Top bar */}
      <header className="max-w-xl mx-auto w-full flex items-center justify-between pb-4 border-b border-slate-800">
        <Link to="/" className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors">
          <QuizzoIcon size={20} />
          <span>Exit Solo Mode</span>
        </Link>
        <div className="flex items-center gap-4">
          {streak >= 2 && (
            <div className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800">
              <Flame className="h-3.5 w-3.5 fill-amber-400" />
              <span>{streak}x</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 font-mono text-sm font-black text-indigo-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
            <Trophy className="h-4 w-4 text-indigo-500" />
            <span>{score.toLocaleString()} pts</span>
          </div>
        </div>
      </header>

      {/* Main question / completed screen */}
      <main className="max-w-xl mx-auto w-full my-auto py-6">
        {!isCompleted ? (
          <div className="space-y-5 animate-in fade-in">
            {/* Slide status & timer */}
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span>Question {currentSlideIndex + 1} of {quiz.slides.length}</span>
              <div className="flex items-center gap-1 font-mono text-indigo-400 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                <Timer className="h-3.5 w-3.5" />
                <span>{timeLeft}s</span>
              </div>
            </div>

            {/* Question Card */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center font-extrabold text-xl text-white shadow-xl">
              {currentSlide.title}
            </div>

            {/* Options */}
            {currentSlide.slideType === 'multiple_choice' || currentSlide.slideType === 'true_false' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentSlide.options?.map((opt, idx) => {
                  const isSelected = selectedOptionId === opt.id;
                  const isCorrect = opt.isCorrect;
                  let style = "border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200";

                  if (isRevealed) {
                    if (isCorrect) {
                      style = "border-emerald-500 bg-emerald-950/70 text-emerald-200 ring-2 ring-emerald-500/50";
                    } else if (isSelected && !isCorrect) {
                      style = "border-rose-500 bg-rose-950/70 text-rose-200 ring-2 ring-rose-500/50";
                    } else {
                      style = "opacity-40 border-slate-800 bg-slate-900";
                    }
                  }

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption(opt.id)}
                      disabled={isRevealed}
                      className={`p-4 rounded-xl border font-bold text-sm text-left transition-all flex items-center justify-between cursor-pointer ${style}`}
                    >
                      <span>{opt.text}</span>
                      {isRevealed && isCorrect && <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />}
                      {isRevealed && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-rose-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ) : currentSlide.slideType === 'numeric' ? (
              <form onSubmit={(e) => { e.preventDefault(); handleReveal(numericInput); }} className="space-y-3">
                <input
                  type="number"
                  placeholder="Enter number..."
                  value={numericInput}
                  disabled={isRevealed}
                  onChange={(e) => setNumericInput(e.target.value)}
                  className="w-full text-center text-3xl font-black font-mono py-4 rounded-xl bg-slate-900 border border-slate-800 text-white"
                />
                {!isRevealed && (
                  <button type="submit" className="w-full py-3.5 rounded-xl font-bold bg-indigo-600 text-white">
                    Submit Answer
                  </button>
                )}
              </form>
            ) : null}

            {/* Explanation when revealed */}
            {isRevealed && currentSlide.explanation && (
              <div className="p-4 rounded-xl bg-indigo-950/50 border border-indigo-800/80 text-xs text-indigo-200">
                <span className="font-bold block text-indigo-400 mb-1">Explanation</span>
                {currentSlide.explanation}
              </div>
            )}

            {/* Next question button for each finished question */}
            {isRevealed && (
              <button
                onClick={handleNext}
                className="w-full py-4 rounded-xl font-black text-base bg-blue-700 hover:bg-blue-800 text-white shadow-xl shadow-blue-700/25 flex items-center justify-center gap-2.5 cursor-pointer transition-all transform hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>{currentSlideIndex + 1 < quiz.slides.length ? 'Next Question' : 'See Final Results 🏆'}</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            )}
          </div>
        ) : (
          /* Completed Recap */
          <div className="text-center space-y-6 animate-in zoom-in-95">
            <Trophy className="h-20 w-20 text-amber-400 mx-auto animate-bounce" />
            <h2 className="text-3xl font-black text-white">Solo Challenge Finished!</h2>
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Total Score</span>
              <p className="text-4xl font-black font-mono text-blue-400">{score.toLocaleString()} pts</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  exportClientStandingsCsv({
                    sessionId: `solo_${Date.now()}`,
                    quizTitle: `${quiz.title} (Solo Challenge)`,
                    completedAt: new Date().toISOString(),
                    participants: [
                      {
                        rank: 1,
                        nickname: 'Solo Explorer',
                        score,
                        streak
                      }
                    ]
                  });
                  sounds.playCorrect();
                }}
                className="w-full py-3.5 rounded-xl font-bold text-sm bg-blue-700 hover:bg-blue-800 text-white shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="h-4 w-4" />
                Export Scorecard CSV
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRestart}
                className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                Play Again
              </button>
              <button
                onClick={() => navigate('/templates')}
                className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-blue-900 hover:bg-blue-950 text-white border border-blue-800"
              >
                Explore More Quizzes
              </button>
            </div>
          </div>
        )}
      </main>
      <footer />
    </div>
  );
};
