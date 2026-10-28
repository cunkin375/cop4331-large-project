import { apiFetch } from './client.ts';

export interface LeaderboardEntry {
    rank: number; // equal scores share a rank
    username: string;
    bestScore: number; // best completed 10-round attempt, out of 30
}

export function getLeaderboard() {
    return apiFetch<{ players: LeaderboardEntry[] }>('/api/leaderboard');
}
