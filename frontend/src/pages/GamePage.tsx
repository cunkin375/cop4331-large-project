import { useEffect, useMemo, useRef, useState } from 'react';
import AppHeader from '../components/AppHeader.tsx';
import Deck from '../components/Deck.tsx';
import Hand from '../components/Hand.tsx';
import PointsLegend from '../components/PointsLegend.tsx';
import { TableRefsContext } from '../components/tableRefs.ts';
import * as gameApi from '../api/game.ts';
import { ApiError } from '../api/client.ts';
import { useDealAnimation } from '../game/useDealAnimation.ts';
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
    const { view, latest, shown, show, clear } = useDealAnimation();
    const [loading, setLoading] = useState(() => storedGameId() !== null);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState('');
    const busy = useRef(false);
    const nextButton = useRef<HTMLButtonElement>(null);
    const deckRef = useRef<HTMLDivElement>(null);
    const discardRef = useRef<HTMLDivElement>(null);
    const tableRefs = useMemo(() => ({ deck: deckRef, discard: discardRef }), []);

    // The round on screen once its animation has finished; null while cards are still moving into a new round.
    const current = shown && latest && shown.gameId === latest.gameId && shown.round === latest.round ? shown : null;
    const roundOver = current?.roundOver ?? false;
    const sameAttempt = shown && latest && shown.gameId === latest.gameId;

    // Resume the saved game after a reload, showing its cards without replaying the deal.
    useEffect(() => {
        const gameId = storedGameId();
        if (!gameId) return;
        gameApi.getGameState(gameId)
            .then((game) => show(game, { instant: true }))
            .catch(() => storeGameId(null))
            .finally(() => setLoading(false));
    }, [show]);

    // Move keyboard/screen-reader focus to the next action when a round ends.
    useEffect(() => {
        if (roundOver && !pending) nextButton.current?.focus();
    }, [roundOver, pending]);

    // The ref blocks a second tap that lands before the buttons re-render as disabled.
    // It stays set until the animation finishes, so taps during a deal are ignored.
    async function act(action: () => Promise<GameState>) {
        if (busy.current) return;
        busy.current = true;
        setPending(true);
        setError('');
        try {
            const next = await action();
            storeGameId(next.gameId);
            await show(next);
        } catch (e) {
            if (e instanceof ApiError && e.status === 404) {
                // The saved game is gone; let the player start fresh.
                storeGameId(null);
                clear();
            }
            setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
        } finally {
            busy.current = false;
            setPending(false);
        }
    }

    const nextRound = () => gameApi.startRound(shown && !shown.attemptComplete ? shown.gameId : undefined);

    return (
        <div className="flex min-h-svh flex-col items-center gap-4 px-4 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))]
            text-center [--card-w:clamp(64px,19vw,104px)] [--deck-w:calc(var(--card-w)*0.6)] sm:gap-6 sm:pb-8">
            <AppHeader />
            <main className="flex w-full flex-1 flex-col sm:flex-none">
                <TableRefsContext value={tableRefs}>
                    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-4 sm:gap-6">
                        <h1 className="sr-only">Blackjack table</h1>
                        {/* Discard spot (left), round and score (center), deck (right). */}
                        <div className="flex w-full items-start justify-between gap-2">
                            <div ref={discardRef} aria-hidden="true" className="w-(--deck-w) aspect-[95/130]" />
                            {latest && (
                                <p className="flex flex-wrap justify-center gap-x-6 tabular-nums">
                                    <span>Round {latest.round} / {ROUNDS_PER_ATTEMPT}</span>
                                    <span>Score: {sameAttempt ? shown.totalPoints : 0}</span>
                                </p>
                            )}
                            <Deck ref={deckRef} />
                        </div>

                        {loading ? (
                            <p className="my-auto sm:my-12">Loading your game…</p>
                        ) : latest ? (
                            <div className="flex w-full flex-col gap-6">
                                <Hand
                                    title="Dealer's Hand"
                                    slots={view.dealer}
                                    total={!current ? null : current.dealerValue ?? cardValue(current.dealerCards[0])}
                                    totalLabel={roundOver ? 'Dealer Hand Value' : 'Showing'}
                                    sweeping={view.sweeping}
                                    dealId={view.dealId}
                                />
                                <Hand
                                    title="Your Hand"
                                    slots={view.player}
                                    total={current?.playerValue ?? null}
                                    totalLabel="Hand Value"
                                    sweeping={view.sweeping}
                                    dealId={view.dealId}
                                />
                            </div>
                        ) : (
                            <section className="my-auto grid max-w-[36ch] gap-3 sm:my-12">
                                <p>Beat the dealer without going over 21. Aces count as 1 or 11.</p>
                                <p>The dealer stands on 17. Each attempt is 10 rounds: 3 points per win, 1 per tie.</p>
                            </section>
                        )}

                        {/* Announced only after the cards finish moving, so the result isn't spoiled. */}
                        <div role="status" aria-live="polite" className="min-h-7 text-lg font-semibold">
                            {error ? <span className="text-danger">{error}</span> : current && resultMessage(current)}
                            {current?.attemptComplete && <span> Attempt complete: {current.totalPoints} points.</span>}
                        </div>

                        {/* Actions sit at the bottom of the screen within thumb reach on phones. */}
                        <div className="mt-auto flex w-full max-w-90 justify-center gap-3 sm:mt-0">
                            {current && !roundOver ? (
                                <>
                                    <button type="button" className="btn" disabled={pending}
                                        onClick={() => act(() => gameApi.hit(current.gameId))}>
                                        Hit
                                    </button>
                                    <button type="button" className="btn" disabled={pending}
                                        onClick={() => act(() => gameApi.stand(current.gameId))}>
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
                                    {!shown ? 'Deal' : shown.attemptComplete ? 'Start New Attempt' : 'Next Round'}
                                </button>
                            )}
                        </div>

                        <PointsLegend />
                    </div>
                </TableRefsContext>
            </main>
        </div>
    );
};

export default GamePage;
