import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Gamepad2, 
  PlusCircle, 
  ArrowRight, 
  Users, 
  Trophy, 
  Zap, 
  Layers, 
  BarChart3, 
  ChevronDown, 
  GraduationCap, 
  Briefcase, 
  PartyPopper,
  CheckCircle,
  QrCode,
  FileText
} from 'lucide-react';
import { InteractiveHeroWidget } from '../../components/home/InteractiveHeroWidget';
import { useAuth } from '../../contexts/AuthContext';
import { LiquidMetalButton } from '../../components/ui/liquid-metal-button';

export const LandingPage: React.FC = () => {
  const { user, loginAsDemo } = useAuth();
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handleStartQuiz = async () => {
    if (user) {
      navigate('/dashboard/quizzes/new');
    } else {
      await loginAsDemo();
      navigate('/dashboard/quizzes/new');
    }
  };

  const faqs = [
    {
      q: "How do players join a live game?",
      a: "Players don't need to register an account or install any apps. They simply navigate to the Join page on their phone or laptop, enter the 6-character game code, or scan the on-screen QR code shown by the host."
    },
    {
      q: "How easy is it to build and customize quizzes?",
      a: "Quizzo features an intuitive visual Studio supporting 8 interactive formats—including Multiple Choice, True/False, numeric challenges, polls, and word clouds. You can also pick from over 15 pre-built templates and launch within seconds."
    },
    {
      q: "How is scoring calculated?",
      a: "Quizzo uses server-authoritative speed scoring. Correct answers earn base points adjusted by how quickly the player locked in their response: `earnedPoints = round(basePoints * (0.5 + 0.5 * (remainingTime / totalTime)))`. Multipliers and double-point questions are validated exclusively on the backend."
    },
    {
      q: "Can Quizzo export CSV analytics reports?",
      a: "Yes! Quizzo generates comprehensive spreadsheet-ready CSV exports featuring complete analytics, participant standings with podium honors, question response rates, session summaries, and individual participant response logs."
    },
    {
      q: "What slide and question types are supported?",
      a: "Quizzo supports 8 interactive slide types: Multiple Choice, True/False, Numeric inputs, Anonymous Polls, Rating scales, Open-ended questions, Word Clouds, and Rich Content informational slides."
    }
  ];

  return (
    <div className="min-h-screen bg-[#fafcff] text-slate-900 transition-colors">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        {/* Subtle decorative royal blue glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] bg-gradient-to-tr from-blue-600/15 via-blue-800/10 to-sky-400/10 blur-3xl pointer-events-none rounded-full" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-blue-50/90 text-blue-900 border border-blue-200/90 mb-6 shadow-xs">
              <Zap className="h-3.5 w-3.5 text-blue-700" />
              <span>Engineered with Real-Time Socket.IO & Multi-Room State</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 leading-[1.15]">
              Turn Any Gathering Into a Game.
            </h1>

            {/* Supporting Text */}
            <p className="mt-5 text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
              Create interactive quizzes, bring people together, and turn every answer into a moment worth remembering.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <LiquidMetalButton
                onClick={handleStartQuiz}
                size="lg"
                width={240}
                icon={<PlusCircle className="h-5 w-5 text-blue-400" />}
              >
                Create Your First Quiz
              </LiquidMetalButton>
              <Link to="/join">
                <LiquidMetalButton
                  size="lg"
                  width={210}
                  icon={<Gamepad2 className="h-5 w-5 text-blue-400" />}
                >
                  Join a Live Game
                </LiquidMetalButton>
              </Link>
            </div>

            {/* Micro proof points */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-semibold">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-emerald-600" /> No participant account required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-emerald-600" /> Instant QR code & 6-digit PIN
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-emerald-600" /> Complete CSV Analytics Export
              </span>
            </div>
          </div>

          {/* Interactive Product Preview Widget */}
          <div className="mt-4">
            <InteractiveHeroWidget />
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS */}
      <section className="py-20 bg-white border-y border-blue-100/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-black uppercase tracking-widest text-blue-700 mb-2">
              Simple 3-Step Flow
            </h2>
            <p className="text-3xl sm:text-4xl font-black text-slate-950">
              Host Unforgettable Quiz Battles in Minutes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative rounded-3xl p-8 bg-[#fafcff] border border-blue-100 shadow-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-700 text-white font-black text-lg mb-6 shadow-md shadow-blue-700/20">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Craft in Studio or Use Templates
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Use our visual Studio with 8 interactive question types, or pick from 15+ curated templates across trivia, education, tech syncs, and team building.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-3xl p-8 bg-[#fafcff] border border-blue-100 shadow-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-800 text-white font-black text-lg mb-6 shadow-md shadow-blue-800/20">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Launch Live & Share PIN
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Start a live session with one click. Display the big screen PIN and dynamic QR code. Players join instantly on mobile without downloads or signups.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-3xl p-8 bg-[#fafcff] border border-blue-100 shadow-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-900 text-white font-black text-lg mb-6 shadow-md shadow-blue-900/20">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Play, Crown Winners & Export
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Watch answers lock in real time. Experience animated podium celebrations and export detailed response times and comprehensive CSV reports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURE HIGHLIGHTS */}
      <section className="py-20 bg-[#f8fafc]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-black uppercase tracking-widest text-blue-700 mb-2">
              Feature Capabilities
            </h2>
            <p className="text-3xl sm:text-4xl font-black text-slate-950">
              Built for Scale, Speed, and Maximum Engagement
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-7 rounded-3xl bg-white border border-blue-100 shadow-xs">
              <div className="h-11 w-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4 border border-blue-100">
                <Zap className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                Server-Authoritative Game Engine
              </h4>
              <p className="text-sm text-slate-600">
                Submissions, deadlines, and speed factor scores are validated exclusively on the Node.js backend to prevent tampering and ensure fair play.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-white border border-blue-100 shadow-xs">
              <div className="h-11 w-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4 border border-blue-100">
                <Layers className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                Interactive Multi-Format Studio
              </h4>
              <p className="text-sm text-slate-600">
                Build rich challenges with multiple choice, true/false, numeric input, polls, and word clouds with custom timers and speed multipliers.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-white border border-blue-100 shadow-xs">
              <div className="h-11 w-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4 border border-blue-100">
                <Users className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                Team Battles & Solo Modes
              </h4>
              <p className="text-sm text-slate-600">
                Group participants into Red Dragons, Blue Titans, and more for team tournaments, or let players practice independently at their own pace.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-white border border-blue-100 shadow-xs">
              <div className="h-11 w-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4 border border-blue-100">
                <QrCode className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                Zero Friction Join & QR Codes
              </h4>
              <p className="text-sm text-slate-600">
                Host displays an auto-generated QR code and 6-letter PIN. Players join in under 3 seconds on any smartphone camera or modern browser.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-white border border-blue-100 shadow-xs">
              <div className="h-11 w-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4 border border-blue-100">
                <Trophy className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                Podium & Floating Reactions
              </h4>
              <p className="text-sm text-slate-600">
                Participants fire real-time emoji reactions (🔥, 🚀, ❤️, 💡) that float across screens, followed by 3D confetti podium celebrations.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-white border border-blue-100 shadow-xs">
              <div className="h-11 w-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4 border border-blue-100">
                <FileText className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                Recharts Analytics & CSV Export
              </h4>
              <p className="text-sm text-slate-600">
                Track completion rate, accuracy, and question difficulty breakdown. Export full session multi-format CSV reports with one click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. USE CASES SHOWCASE */}
      <section className="py-20 bg-white border-t border-blue-100/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-black uppercase tracking-widest text-blue-700 mb-2">
              Solutions
            </h2>
            <p className="text-3xl sm:text-4xl font-black text-slate-950">
              Designed for High Engagement in Every Setting
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl border border-blue-100 bg-[#fafcff]">
              <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center mb-5">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Classroom & Higher Education
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Test concept comprehension at the start or end of lectures. Gauge student understanding without grading anxiety and export results to LMS.
              </p>
            </div>

            <div className="p-8 rounded-3xl border border-blue-100 bg-[#fafcff]">
              <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center mb-5">
                <Briefcase className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Corporate Training & All-Hands
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Transform compliance reviews and quarterly company syncs into energizing sessions that boost retention and team spirit.
              </p>
            </div>

            <div className="p-8 rounded-3xl border border-blue-100 bg-[#fafcff]">
              <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center mb-5">
                <PartyPopper className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Social Events & Trivia Nights
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Host exciting pub trivia, birthday games, and club competitions. Live audio effects, streaks, and leaderboards guarantee lively banter.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQ SECTION */}
      <section className="py-20 bg-[#f8fafc] border-t border-blue-100/80">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-xs font-black uppercase tracking-widest text-blue-700 mb-2">
              Answers
            </h2>
            <p className="text-3xl sm:text-4xl font-black text-slate-950">
              Frequently Asked Questions
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div 
                  key={idx}
                  className="rounded-2xl border border-blue-100 bg-white overflow-hidden shadow-xs transition-colors"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-900 hover:text-blue-700 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-blue-700' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-sm text-slate-600 border-t border-blue-50 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. FINAL CTA BANNER - Deep Royal Blue */}
      <section className="py-20 bg-gradient-to-br from-blue-900 via-blue-950 to-slate-950 text-white relative overflow-hidden">
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-800/60 border border-blue-700/60 text-xs font-bold text-blue-200 mb-6">
            <Sparkles className="h-3.5 w-3.5 text-blue-300" />
            Ready for your first live game?
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-6">
            Bring Your Community Together Today.
          </h2>
          <p className="text-lg text-blue-200 max-w-2xl mx-auto mb-10 leading-relaxed">
            Create an interactive quiz in under 60 seconds or test our live demo right now with your phone.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <LiquidMetalButton
              onClick={handleStartQuiz}
              size="lg"
              width={240}
              icon={<PlusCircle className="h-5 w-5 text-blue-400" />}
            >
              Create a Quiz for Free
            </LiquidMetalButton>
            <Link to="/join">
              <LiquidMetalButton
                size="lg"
                width={220}
                icon={<Gamepad2 className="h-5 w-5 text-blue-400" />}
              >
                Join With Game Code
              </LiquidMetalButton>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
