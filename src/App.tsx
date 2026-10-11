import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { JoinGamePage } from './pages/public/JoinGamePage';
import { TemplatesPage } from './pages/public/TemplatesPage';
import { FeaturesPage } from './pages/public/FeaturesPage';
import { AboutPage } from './pages/public/AboutPage';
import ParallaxDemo from './demos/default';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';

// Host & Player Experience
import { HostGamePage } from './pages/host/HostGamePage';
import { PlayerGamePage } from './pages/player/PlayerGamePage';
import { SoloPlayPage } from './pages/player/SoloPlayPage';

// Dashboard Pages
import { DashboardOverview } from './pages/dashboard/DashboardOverview';
import { QuizzesPage } from './pages/dashboard/QuizzesPage';
import { QuizHistoryPage } from './pages/dashboard/QuizHistoryPage';
import { QuizEditorPage } from './pages/dashboard/QuizEditorPage';
import { AnalyticsPage } from './pages/dashboard/AnalyticsPage';
import { SettingsPage } from './pages/dashboard/SettingsPage';

// Generic Route Guard for authenticated user with redirect preservation
export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Route Guard for authenticated dashboard layout
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <RequireAuth>
      <DashboardLayout>{children}</DashboardLayout>
    </RequireAuth>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public & Informational routes with Navbar & Footer */}
          <Route
            path="/"
            element={
              <div className="flex min-h-screen flex-col">
                <Navbar />
                <main className="flex-1">
                  <LandingPage />
                </main>
                <Footer />
              </div>
            }
          />
          <Route
            path="/features"
            element={
              <div className="flex min-h-screen flex-col">
                <Navbar />
                <main className="flex-1">
                  <FeaturesPage />
                </main>
                <Footer />
              </div>
            }
          />
          <Route
            path="/templates"
            element={
              <div className="flex min-h-screen flex-col">
                <Navbar />
                <main className="flex-1">
                  <TemplatesPage />
                </main>
                <Footer />
              </div>
            }
          />
          {/* Legacy Pricing routes redirected to Public Landing */}
          <Route path="/pricing" element={<Navigate to="/" replace />} />
          <Route path="/plans" element={<Navigate to="/" replace />} />
          <Route path="/subscription-plans" element={<Navigate to="/" replace />} />
          <Route
            path="/about"
            element={
              <div className="flex min-h-screen flex-col">
                <Navbar />
                <main className="flex-1">
                  <AboutPage />
                </main>
                <Footer />
              </div>
            }
          />
          {/* Parallax Demo Showcase */}
          <Route
            path="/parallax"
            element={
              <div className="flex min-h-screen flex-col bg-slate-950">
                <Navbar />
                <main className="flex-1">
                  <ParallaxDemo />
                </main>
                <Footer />
              </div>
            }
          />
          <Route path="/demos/parallax" element={<Navigate to="/parallax" replace />} />

          {/* Join Game Flow (AUTHENTICATED ONLY) */}
          <Route
            path="/join"
            element={
              <RequireAuth>
                <div className="flex min-h-screen flex-col">
                  <Navbar />
                  <main className="flex-1">
                    <JoinGamePage />
                  </main>
                  <Footer />
                </div>
              </RequireAuth>
            }
          />
          <Route
            path="/join/:code"
            element={
              <RequireAuth>
                <div className="flex min-h-screen flex-col">
                  <Navbar />
                  <main className="flex-1">
                    <JoinGamePage />
                  </main>
                  <Footer />
                </div>
              </RequireAuth>
            }
          />

          {/* Auth pages */}
          <Route
            path="/login"
            element={
              <div className="flex min-h-screen flex-col">
                <Navbar />
                <main className="flex-1">
                  <LoginPage />
                </main>
                <Footer />
              </div>
            }
          />
          <Route
            path="/signup"
            element={
              <div className="flex min-h-screen flex-col">
                <Navbar />
                <main className="flex-1">
                  <SignupPage />
                </main>
                <Footer />
              </div>
            }
          />

          {/* Live Host Experience (Full-screen immersion) */}
          <Route path="/host/:sessionId" element={<HostGamePage />} />

          {/* Live Player Experience (Mobile-first responsive immersion) */}
          <Route path="/play/:sessionId" element={<PlayerGamePage />} />

          {/* Solo Play Experience */}
          <Route path="/play/:quizId/solo" element={<SoloPlayPage />} />

          {/* Authenticated Dashboard Pages */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/quizzes"
            element={
              <ProtectedRoute>
                <QuizzesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/history"
            element={
              <ProtectedRoute>
                <QuizHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/quizzes/new"
            element={
              <ProtectedRoute>
                <QuizEditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/quizzes/:id/edit"
            element={
              <ProtectedRoute>
                <QuizEditorPage />
              </ProtectedRoute>
            }
          />
          {/* AI Generator route redirected to Dashboard Overview */}
          <Route
            path="/dashboard/ai-generator"
            element={
              <ProtectedRoute>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/templates"
            element={
              <ProtectedRoute>
                <TemplatesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/analytics"
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
