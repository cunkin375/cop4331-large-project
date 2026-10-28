import { apiFetch } from './client.ts';
import type { GameState } from '../types/game.ts';

// The server owns the deck and scoring; these calls only send the player's action.

// Without a gameId this starts a new 10-round attempt; with one it deals the next round.
export function startRound(gameId?: string) {
    return apiFetch<GameState>('/api/game/start', { method: 'POST', body: gameId ? { gameId } : {} });
}

export function hit(gameId: string) {
    return apiFetch<GameState>('/api/game/hit', { method: 'POST', body: { gameId } });
}

export function stand(gameId: string) {
    return apiFetch<GameState>('/api/game/stand', { method: 'POST', body: { gameId } });
}

export function getGameState(gameId: string) {
    return apiFetch<GameState>(`/api/game/state?gameId=${encodeURIComponent(gameId)}`);
}
