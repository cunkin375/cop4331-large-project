import { apiFetch } from './client.ts';
import type { User } from '../types/user.ts';

export interface RoundResult {
    round: number;
    outcome: 'win' | 'tie' | 'loss';
    points: number; // 3, 1 or 0
}

// A finished 10-round attempt, as the server saved it.
export interface Attempt {
    _id: string;
    score: number; // out of 30
    rounds: RoundResult[];
    completedAt: string;
}

export function getMe() {
    return apiFetch<User>('/api/me');
}

export function changePassword(currentPassword: string, newPassword: string) {
    return apiFetch<{ message: string }>('/api/change-password', {
        method: 'POST', body: { currentPassword, newPassword },
    });
}

// Newest first, with the best score across all of them.
export function getMyAttempts() {
    return apiFetch<{ attempts: Attempt[]; bestScore: number }>('/api/attempts/me');
}
