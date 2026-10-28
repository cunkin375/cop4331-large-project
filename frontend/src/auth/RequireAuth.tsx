import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.ts';

// Sends logged-out visitors to /login, remembering where they were headed.
function RequireAuth({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const location = useLocation();
    if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    return children;
}

export default RequireAuth;
