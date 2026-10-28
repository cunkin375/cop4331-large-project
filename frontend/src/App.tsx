import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import AuthProvider from './auth/AuthProvider.tsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.tsx';
import GamePage from './pages/GamePage.tsx';
import LeaderboardPage from './pages/LeaderboardPage.tsx';
import LoginPage from './pages/LoginPage.tsx';
import RegisterPage from './pages/RegisterPage.tsx';
import ResetPasswordPage from './pages/ResetPasswordPage.tsx';
import VerifyEmailPage from './pages/VerifyEmailPage.tsx';


function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/verify-email" element={<VerifyEmailPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    {/* TODO: require login for /play once the backend auth endpoints exist. */}
                    <Route path="/play" element={<GamePage />} />
                    <Route path="/leaderboard" element={<LeaderboardPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App
