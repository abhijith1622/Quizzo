import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Zap, 
  Layers, 
  Users, 
  Trophy, 
  BarChart3, 
  QrCode, 
  Lock, 
  Gamepad2, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { LiquidMetalButton } from '../../components/ui/liquid-metal-button';

export const FeaturesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-700">
            Platform Capabilities
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-blue-950 tracking-tight">
            Designed for Real-Time Electricity & Deep Learning
          </h1>
          <p className="text-base sm:text-lg text-slate-600">
            Discover the technology and design decisions that make Quizzo fast, reliable, and deeply engaging.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Sub-Millisecond Socket.IO Engine
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Every participant connection is synchronized via bi-directional Socket.IO channels. Question state, countdown deadlines, and answer distribution events are server-authoritative, ensuring zero client-side tampering or lag discrepancy.
            </p>
            <ul className="space-y-2 pt-2 text-xs font-medium text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Automatic connection-state recovery</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Private room partitioning (`game:sessionId`)</li>
            </ul>
          </div>

          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Visual Interactive Studio
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Craft multi-question challenges in seconds with multiple choice, true/false, open numeric entry, live polling, and word clouds. Customize timer deadlines, point multipliers, and rich media covers.
            </p>
            <ul className="space-y-2 pt-2 text-xs font-medium text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> 8 versatile interactive question formats</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Instant duplication & live preview</li>
            </ul>
          </div>

          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <Trophy className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Server-Calculated Speed Scoring
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Our backend calculates scores using `earnedPoints = round(basePoints * (0.5 + 0.5 * (remaining / total)) * multiplier)`. Deterministic tie-breaking rules ensure high competition integrity on podiums.
            </p>
            <ul className="space-y-2 pt-2 text-xs font-medium text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Streak tracking with animated fire multipliers</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Double-points configuration per slide</li>
            </ul>
          </div>

          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-pink-50 dark:bg-pink-950 text-pink-600 flex items-center justify-center">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Recharts Analytics & CSV Export Engine
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Analyze participant distribution, question response rates, and average accuracy trends. Download comprehensive CSV reports with podium finishes, standings, and response audits.
            </p>
            <ul className="space-y-2 pt-2 text-xs font-medium text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Response duration timestamp breakdowns</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> One-click multi-format CSV report exports</li>
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-8">
          <Link to="/dashboard/quizzes/new">
            <LiquidMetalButton
              size="lg"
              width={240}
              icon={<ArrowRight className="h-5 w-5 text-blue-400" />}
            >
              Experience Quizzo Live
            </LiquidMetalButton>
          </Link>
        </div>
      </div>
    </div>
  );
};
