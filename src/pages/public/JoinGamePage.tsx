import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Gamepad2, ArrowRight, AlertCircle, CheckCircle, Sparkles, Users } from 'lucide-react';
import { QuizzoLogo } from '../../components/common/QuizzoLogo';
import { AVATARS, getAvatar } from '../../utils/avatars';
import { api } from '../../services/api';
import { sounds } from '../../utils/effects';

export const JoinGamePage: React.FC = () => {
  const { code: paramCode } = useParams<{ code?: string }>();
  const [searchParams] = useSearchParams();
  const queryCode = searchParams.get('code');
  const navigate = useNavigate();

  const [gameCode, setGameCode] = useState(paramCode || queryCode || '');
  const [nickname, setNickname] = useState('');
  const [selectedAvatarKey, setSelectedAvatarKey] = useState('fox');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [teams, setTeams] = useState<any[]>([]);
  const [isTeamMode, setIsTeamMode] = useState(false);
  const [quizTitle, setQuizTitle] = useState<string | null>(null);
  const [step, setStep] = useState<'enter_code' | 'enter_profile'>('enter_code');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If code is in URL, auto-verify code on load
  useEffect(() => {
    const initialCode = paramCode || queryCode;
    if (initialCode && initialCode.trim().length >= 4) {
      setGameCode(initialCode.toUpperCase());
      verifyCode(initialCode.toUpperCase());
    }
  }, [paramCode, queryCode]);

  const verifyCode = async (codeToVerify: string) => {
    if (!codeToVerify || codeToVerify.trim().length === 0) {
      setError('Please enter a 6-character game code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.lookupGameCode(codeToVerify.trim().toUpperCase());
      setQuizTitle(res.quizTitle);
      if (res.mode === 'team' && res.teams && res.teams.length > 0) {
        setIsTeamMode(true);
        setTeams(res.teams);
        setSelectedTeamId(res.teams[0].id);
      }
      setStep('enter_profile');
      sounds.playClick();
    } catch (err: any) {
      setError(err.message || 'Game code not found. Check the host screen and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError('Please choose a nickname to display on the leaderboard');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.joinGame(gameCode.trim().toUpperCase(), nickname.trim());
      sounds.playCorrect();

      // Store player state in sessionStorage for session restoration
      const participantId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const playerData = {
        participantId,
        sessionId: res.sessionId,
        nickname: nickname.trim(),
        avatarKey: selectedAvatarKey,
        teamId: isTeamMode ? selectedTeamId : undefined
      };
      sessionStorage.setItem('quizzo_player', JSON.stringify(playerData));
      sessionStorage.setItem('pulsequiz_player', JSON.stringify(playerData));

      // Navigate to player screen
      navigate(`/play/${res.sessionId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to join game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#fafcff]">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Banner */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block hover:scale-105 transition-transform drop-shadow-sm mb-1">
            <QuizzoLogo variant="stacked" size="lg" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-950">
            Join Live Game
          </h1>
          <p className="text-sm text-slate-600">
            {quizTitle ? `Quiz: ${quizTitle}` : 'Enter the PIN on the host screen to join'}
          </p>
        </div>

        {/* Card Form */}
        <div className="rounded-2xl border border-blue-100 bg-white p-6 sm:p-8 shadow-xl shadow-blue-950/5">
          {error && (
            <div className="mb-5 flex items-center gap-2 p-3.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 'enter_code' ? (
            /* Step 1: Enter Game Code */
            <form onSubmit={(e) => { e.preventDefault(); verifyCode(gameCode); }} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  6-Letter Game PIN
                </label>
                <input
                  type="text"
                  maxLength={8}
                  placeholder="e.g. 7K2M9X"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                  className="w-full text-center tracking-[0.25em] font-mono text-3xl font-extrabold uppercase py-3.5 px-4 rounded-xl border border-blue-200 bg-blue-50/50 text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading || !gameCode.trim()}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 transition-all shadow-md shadow-blue-700/25 cursor-pointer"
              >
                {loading ? 'Finding Game...' : 'Continue to Player Setup'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : (
            /* Step 2: Choose Avatar, Nickname & Team */
            <form onSubmit={handleJoinGame} className="space-y-6">
              {/* Nickname */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                  Your Nickname
                </label>
                <input
                  type="text"
                  maxLength={20}
                  placeholder="e.g. NeonVoyager"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                  Choose Avatar: <span className="text-indigo-600 font-semibold">{getAvatar(selectedAvatarKey).name}</span>
                </label>
                <div className="grid grid-cols-5 gap-2.5">
                  {AVATARS.map((av) => {
                    const isSelected = selectedAvatarKey === av.key;
                    return (
                      <button
                        key={av.key}
                        type="button"
                        onClick={() => { setSelectedAvatarKey(av.key); sounds.playClick(); }}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xl transition-all ${
                          isSelected 
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 ring-2 ring-indigo-500 scale-105 shadow-sm' 
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 opacity-80'
                        }`}
                        title={av.name}
                      >
                        <span className="text-2xl">{av.emoji}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Team Mode Selection */}
              {isTeamMode && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                    Pick Your Team
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {teams.map((t) => {
                      const isSelected = selectedTeamId === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelectedTeamId(t.id)}
                          className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500'
                              : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" />
                            <span>{t.name}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('enter_code')}
                  className="w-1/3 py-3 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Change PIN
                </button>
                <button
                  type="submit"
                  disabled={loading || !nickname.trim()}
                  className="w-2/3 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  {loading ? 'Entering...' : "Enter Lobby! 🚀"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
