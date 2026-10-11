import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Heart, Shield, Code, Sparkles, Trophy } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg mb-2">
            <Zap className="h-6 w-6" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-blue-950">
            About Quizzo
          </h1>
          <p className="text-base text-slate-600 max-w-xl mx-auto">
            Engineering an engaging, server-authoritative live trivia experience for schools, teams, and live events.
          </p>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-white p-8 space-y-6 shadow-sm leading-relaxed text-slate-700 text-sm">
          <h3 className="text-xl font-bold text-blue-950">Our Mission</h3>
          <p>
            Traditional presentations and trivia games often feel either clunky, riddled with intrusive ads, or plagued by client-side latency. We built <strong>Quizzo</strong> to combine the responsive snap of real-time Socket.IO with server-authoritative scoring, elegant UI/UX design, and intuitive visual quiz creation.
          </p>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white pt-4">Full-Stack MERN Architecture</h3>
          <p>
            Every question deadline, answer verification, and score increment is processed strictly on the Node.js/Express backend before being broadcast to participant sockets. This architectural guarantee eliminates score manipulation while providing millisecond speed feedback.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-center">
              <Code className="h-6 w-6 text-indigo-500 mx-auto mb-2" />
              <h5 className="font-bold text-slate-900 dark:text-white">TypeScript First</h5>
              <p className="text-xs text-slate-500 mt-1">End-to-end typed contracts between client and server</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-center">
              <Zap className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
              <h5 className="font-bold text-slate-900 dark:text-white">Socket.IO Real-Time</h5>
              <p className="text-xs text-slate-500 mt-1">Room-isolated low-latency pub/sub event stream</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-center">
              <Sparkles className="h-6 w-6 text-violet-500 mx-auto mb-2" />
              <h5 className="font-bold text-slate-900 dark:text-white">Gemini 3.8 Flash</h5>
              <p className="text-xs text-slate-500 mt-1">Grounded question generation with detailed rationales</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
