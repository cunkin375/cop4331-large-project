import { useEffect, useRef, useState } from 'react';
import AppHeader from '../components/AppHeader.tsx';
import Hand from '../components/Hand.tsx';
import * as gameApi from '../api/game.ts';
import { ApiError } from '../api/client.ts';
import { ROUNDS_PER_ATTEMPT, type Card, type GameState } from '../types/game.ts';

const GAME_KEY = 'blackjack.gameId';

function storedGameId(): string | null {
    try { return localStorage.getItem(GAME_KEY); } catch { return null; }
}

function storeGameId(gameId: string | null): void {
    try {
        if (gameId) localStorage.setItem(GAME_KEY, gameId);
        else localStorage.removeItem(GAME_KEY);
    } catch { /* storage unavailable; the game just won't resume after a reload */ }
}

// Value of the dealer's up card, shown while the hole card is hidden.
function cardValue({ rank }: Card): number {
    if (rank === 'A') return 11;
    return ['J', 'Q', 'K'].includes(rank) ? 10 : Number(rank);
}

function resultMessage(game: GameState): string {
    const playerNatural = game.playerCards.length === 2 && game.playerValue === 21;
    switch (game.outcome) {
        case 'win':
            if (playerNatural) return 'Blackjack! You win.';
            return (game.dealerValue ?? 0) > 21 ? 'Dealer busts. You win!' : 'You win!';
        case 'loss':
            return game.playerValue > 21 ? 'Bust! You lose.' : 'Dealer wins.';
        case 'tie':
            return 'Push. It\'s a tie.';
        default:
            return '';
    }
}

const GamePage = () => {
    const [game, setGame] = useState<GameState | null>(null);
    const [loading, setLoading] = useState(() => storedGameId() !== null);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState('');
    const busy = useRef(false);
    const nextButton = useRef<HTMLButtonElement>(null);

    const roundOver = game?.roundOver ?? false;

    // Resume the saved game after a reload.
    useEffect(() => {
        const gameId = storedGameId();
        if (!gameId) return;
        gameApi.getGameState(gameId)
            .then(setGame)
            .catch(() => storeGameId(null))
            .finally(() => setLoading(false));
    }, []);

    // Move keyboard/screen-reader focus to the next action when a round ends.
    useEffect(() => {
        if (roundOver) nextButton.current?.focus();
    }, [roundOver]);

    // The ref blocks a second tap that lands before the buttons re-render as disabled.
    async function act(action: () => Promise<GameState>) {
        if (busy.current) return;
        busy.current = true;
        setPending(true);
        setError('');
        try {
            const next = await action();
            setGame(next);
            storeGameId(next.gameId);
        } catch (e) {
            if (e instanceof ApiError && e.status === 404) {
                // The saved game is gone; let the player start fresh.
                storeGameId(null);
                setGame(null);
            }
            setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
        } finally {
            busy.current = false;
            setPending(false);
        }
    }

    const nextRound = () => gameApi.startRound(game && !game.attemptComplete ? game.gameId : undefined);

    return (
        <div className="flex min-h-svh flex-col items-center gap-4 px-4 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))]
            text-center [--card-w:clamp(64px,19vw,104px)] sm:gap-6 sm:pb-8">
            <AppHeader />
            <main className="flex w-full flex-1 flex-col items-center gap-4 sm:flex-none sm:gap-6">
                <h1 className="sr-only">Blackjack table</h1>
                {game && (
                    <p className="flex justify-center gap-6 tabular-nums">
                        <span>Round {game.round} / {ROUNDS_PER_ATTEMPT}</span>
                        <span>Score: {game.totalPoints}</span>
                    </p>
                )}

                {loading ? (
                    <p className="my-auto sm:my-12">Loading your game…</p>
                ) : game ? (
                    <div className="flex flex-col gap-6">
                        <Hand
                            title="Dealer's Hand"
                            cards={roundOver ? game.dealerCards : [...game.dealerCards, null]}
                            total={game.dealerValue ?? cardValue(game.dealerCards[0])}
                            totalLabel={roundOver ? 'Dealer Hand Value' : 'Showing'}
                        />
                        <Hand
                            title="Your Hand"
                            cards={game.playerCards}
                            total={game.playerValue}
                            totalLabel="Hand Value"
                        />
                    </div>
                ) : (
                    <section className="my-auto grid max-w-[36ch] gap-3 sm:my-12">
                        <p>Beat the dealer without going over 21. Aces count as 1 or 11.</p>
                        <p>The dealer stands on 17. Each attempt is 10 rounds: 3 points per win, 1 per tie.</p>
                    </section>
                )}

                <div role="status" aria-live="polite" className="min-h-7 text-lg font-semibold">
                    {error ? <span className="text-danger">{error}</span> : game && resultMessage(game)}
                    {game?.attemptComplete && <span> Attempt complete: {game.totalPoints} points.</span>}
                </div>

                {/* Actions sit at the bottom of the screen within thumb reach on phones. */}
                <div className="mt-auto flex w-full max-w-90 justify-center gap-3 sm:mt-0">
                    {game && !roundOver ? (
                        <>
                            <button type="button" className="btn" disabled={pending}
                                onClick={() => act(() => gameApi.hit(game.gameId))}>
                                Hit
                            </button>
                            <button type="button" className="btn" disabled={pending}
                                onClick={() => act(() => gameApi.stand(game.gameId))}>
                                Stand
                            </button>
                        </>
                    ) : (
                        <button
                            ref={nextButton}
                            type="button"
                            className="btn btn-primary"
                            disabled={pending || loading}
                            onClick={() => act(nextRound)}
                        >
                            {!game ? 'Deal' : game.attemptComplete ? 'Start New Attempt' : 'Next Round'}
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
};

export default GamePage;
