import { useCallback, useEffect, useState, type ReactNode } from 'react';
import * as authApi from '../api/auth.ts';
import { getToken, setToken, setUnauthorizedHandler } from '../api/client.ts';
import type { User } from '../types/user.ts';
import { AuthContext } from './AuthContext.ts';

const USER_KEY = 'blackjack.user';

function storedUser(): User | null {
    if (!getToken()) return null;
    try { return JSON.parse(localStorage.getItem(USER_KEY) ?? 'null'); } catch { return null; }
}

function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(storedUser);

    async function login(usernameOrEmail: string, password: string) {
        const { token, user } = await authApi.login(usernameOrEmail, password);
        setToken(token);
        try { localStorage.setItem(USER_KEY, JSON.stringify(user)); } catch { /* ignore */ }
        setUser(user);
    }

    const logout = useCallback(() => {
        setToken(null);
        try { localStorage.removeItem(USER_KEY); } catch { /* ignore */ }
        setUser(null);
    }, []);

    // An expired token logs the user out, which sends protected pages back to /login.
    useEffect(() => {
        setUnauthorizedHandler(logout);
    }, [logout]);

    return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
