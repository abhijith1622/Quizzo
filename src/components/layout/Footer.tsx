import React from 'react';
import { Link } from 'react-router-dom';
import { QuizzoLogo } from '../common/QuizzoLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-blue-100 bg-[#fafcff] transition-colors">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="md:col-span-1 space-y-4">
            <Link to="/" className="inline-flex items-center">
              <QuizzoLogo size="md" />
            </Link>
            <p className="text-sm text-slate-600 leading-relaxed">
              Quizzo is a premium interactive quiz platform engineered with real-time Socket.IO. Turn any presentation, gathering, or team sync into an unforgettable live competition.
            </p>
          </div>

          {/* Product links */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-blue-950 mb-4">Product</h4>
            <ul className="space-y-2.5 text-sm font-medium text-slate-600">
              <li><Link to="/features" className="hover:text-blue-700">Multiplayer Engine</Link></li>
              <li><Link to="/templates" className="hover:text-blue-700">Template Gallery</Link></li>
              <li><Link to="/dashboard/quizzes/new" className="hover:text-blue-700">Interactive Quiz Creator</Link></li>
              <li><Link to="/join" className="hover:text-blue-700">Join Live Session</Link></li>
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-blue-950 mb-4">Use Cases</h4>
            <ul className="space-y-2.5 text-sm font-medium text-slate-600">
              <li><Link to="/features" className="hover:text-blue-700">Classroom & Education</Link></li>
              <li><Link to="/features" className="hover:text-blue-700">Corporate All-Hands & Training</Link></li>
              <li><Link to="/features" className="hover:text-blue-700">Team Retrospectives</Link></li>
              <li><Link to="/features" className="hover:text-blue-700">Pub & Social Trivia</Link></li>
              <li><Link to="/features" className="hover:text-blue-700">CSV Analytics & Reports</Link></li>
            </ul>
          </div>

          {/* System & API */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-blue-950 mb-4">Architecture</h4>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
                <span className="font-bold text-blue-900">Socket.IO Server Authoritative</span>
              </div>
              <p className="text-xs text-slate-500 leading-normal">
                Sub-millisecond speed factor scoring with anti-cheat deadline enforcement.
              </p>
              <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
                <Link to="/parallax" className="text-blue-600 hover:text-blue-800 font-bold">Parallax Showcase</Link>
                <Link to="/privacy" className="hover:text-blue-700">Privacy Policy</Link>
                <Link to="/terms" className="hover:text-blue-700">Terms of Service</Link>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-blue-100 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
          <p>© {new Date().getFullYear()} Quizzo Inc. Deep Royal Blue & Soft Snow White Edition.</p>
          <p className="flex items-center gap-1 font-semibold text-blue-900">
            Powered by React, Express, Socket.IO & Gemini AI
          </p>
        </div>
      </div>
    </footer>
  );
};
