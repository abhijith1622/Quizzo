import React, { useState } from 'react';
import { User, Volume2, VolumeX, Check, Shield, Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { sounds } from '../../utils/effects';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || 'Alex Rivers');
  const [soundEnabled, setSoundEnabled] = useState(sounds.isSoundEnabled());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({ displayName });
      setSavedSuccess(true);
      sounds.playCorrect();
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSound = () => {
    const newState = sounds.toggleSound();
    setSoundEnabled(newState);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in pb-16">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Account Settings</h1>
        <p className="text-xs text-slate-500">Manage creator profile preferences and sound effects.</p>
      </div>

      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6 shadow-sm">
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={user?.email || 'demo@quizzo.com'}
              disabled
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 text-slate-500 font-mono text-xs cursor-not-allowed"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-sm text-slate-900 dark:text-white block">Synthesized Sound Effects</span>
              <span className="text-xs text-slate-500">Audio chimes for timers, correct answers, and podium celebrations</span>
            </div>
            <button
              type="button"
              onClick={toggleSound}
              className={`p-2.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                soundEnabled
                  ? 'border-blue-700 bg-blue-50 text-blue-900'
                  : 'border-slate-200 text-slate-500'
              }`}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4 text-blue-700" /> : <VolumeX className="h-4 w-4" />}
              <span>{soundEnabled ? 'Enabled' : 'Muted'}</span>
            </button>
          </div>

          <div className="pt-4 flex items-center justify-between">
            {savedSuccess && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <Check className="h-4 w-4" /> Settings updated successfully
              </span>
            )}
            <button
              type="submit"
              className="ml-auto px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-blue-700 hover:bg-blue-800 shadow-md shadow-blue-700/25 flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
