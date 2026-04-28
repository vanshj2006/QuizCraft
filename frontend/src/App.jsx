import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// App pages
import DashboardPage from './pages/DashboardPage';
import QuizzesPage from './pages/QuizzesPage';
import QuizCreatorPage from './pages/QuizCreatorPage';
import QuizPlayPage from './pages/QuizPlayPage';
import QuestionBankPage from './pages/QuestionBankPage';
import LiveLobbyPage from './pages/LiveLobbyPage';
import LiveSessionPage from './pages/LiveSessionPage';
import ProfilePage from './pages/ProfilePage';

import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';

export default function App() {
  const { fetchMe, loading } = useAuthStore();

  useEffect(() => {
    // only validate session if a token is stored
    if (localStorage.getItem('accessToken')) {
      fetchMe();
    }
  }, [fetchMe]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-container border-t-transparent rounded-full animate-spin" />
          <p className="text-on-surface-variant text-body-sm">Loading Quiz Craft...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected App */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/quizzes" element={<QuizzesPage />} />
            <Route path="/quizzes/create" element={<QuizCreatorPage />} />
            <Route path="/quizzes/:id/edit" element={<QuizCreatorPage />} />
            <Route path="/quizzes/:id/play" element={<QuizPlayPage />} />
            <Route path="/bank" element={<QuestionBankPage />} />
            <Route path="/live/:code/lobby" element={<LiveLobbyPage />} />
            <Route path="/live/:code/session" element={<LiveSessionPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}