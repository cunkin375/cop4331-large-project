import { apiFetch } from './client.ts';
import type { User } from '../types/user.ts';

// Draft contract: these endpoints still need to be built on the backend.

export function register(username: string, email: string, password: string) {
    return apiFetch<{ message: string }>('/api/auth/register', {
        method: 'POST', body: { username, email, password },
    });
}

export function login(email: string, password: string) {
    return apiFetch<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST', body: { email, password },
    });
}

export function verifyEmail(token: string) {
    return apiFetch<{ message: string }>('/api/auth/verify-email', { method: 'POST', body: { token } });
}

export function resendVerification(email: string) {
    return apiFetch<{ message: string }>('/api/auth/resend-verification', { method: 'POST', body: { email } });
}

export function forgotPassword(email: string) {
    return apiFetch<{ message: string }>('/api/auth/forgot-password', { method: 'POST', body: { email } });
}

export function resetPassword(token: string, password: string) {
    return apiFetch<{ message: string }>('/api/auth/reset-password', {
        method: 'POST', body: { token, password },
    });
}
