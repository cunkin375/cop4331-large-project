// Shared fetch wrapper. Every request goes to the Express API under /api,
// which Vite proxies in development. The JWT is sent as a Bearer token so the
// same API works for the web app and the Flutter mobile app.

const TOKEN_KEY = 'blackjack.token';
const API_BASE = import.meta.env.VITE_API_URL ?? '';

export class ApiError extends Error {
    readonly status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

export function getToken(): string | null {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function setToken(token: string | null): void {
    try {
        if (token) localStorage.setItem(TOKEN_KEY, token);
        else localStorage.removeItem(TOKEN_KEY);
    } catch { /* storage unavailable (private mode); stay logged in for this tab only */ }
}

// Called when the server rejects our token (expired after 2 hours, or invalid).
let onUnauthorized: () => void = () => {};

export function setUnauthorizedHandler(handler: () => void): void {
    onUnauthorized = handler;
}

export async function apiFetch<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
    const headers: Record<string, string> = {};
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';

    let response: Response;
    try {
        response = await fetch(`${API_BASE}${path}`, {
            method: options.method ?? 'GET',
            headers,
            body: options.body === undefined ? undefined : JSON.stringify(options.body),
        });
    } catch {
        throw new ApiError(0, 'Unable to reach the server. Check your connection and try again.');
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        if (response.status === 401 && token) onUnauthorized();
        throw new ApiError(response.status, data.error ?? 'Something went wrong. Please try again.');
    }
    return data as T;
}
