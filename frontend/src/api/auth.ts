import { apiFetch } from './client.ts';
import type { User } from '../types/user.ts';

export function register(username: string, email: string, password: string) {
    return apiFetch<{ message: string; user: User }>('/api/register', {
        method: 'POST', body: { username, email, password },
    });
}

// The backend accepts either a username or an email to log in.
export function login(usernameOrEmail: string, password: string) {
    const identifier = usernameOrEmail.trim();
    const field = identifier.includes('@') ? 'email' : 'username';
    return apiFetch<{ token: string; user: User }>('/api/login', {
        method: 'POST', body: { [field]: identifier, password },
    });
}

export function verifyEmail(token: string) {
    return apiFetch<{ message: string }>(`/api/verify-email?token=${encodeURIComponent(token)}`);
}

export function resendVerification(email: string) {
    return apiFetch<{ message: string }>('/api/resend-verification', { method: 'POST', body: { email } });
}

export function forgotPassword(email: string) {
    return apiFetch<{ message: string }>('/api/forgot-password', { method: 'POST', body: { email } });
}

export function resetPassword(token: string, password: string) {
    return apiFetch<{ message: string }>('/api/reset-password', {
        method: 'POST', body: { token, password },
    });
}
