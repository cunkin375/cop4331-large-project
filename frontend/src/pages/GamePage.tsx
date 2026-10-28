import { useEffect, useRef, useState } from 'react';
import AppHeader from '../components/AppHeader.tsx';
import Hand from '../components/Hand.tsx';
import * as game from '../api/mockGame.ts';
import type { RoundState } from '../types/game.ts';

function resultMessage(round: RoundState): string {
    const playerNatural = round.playerCards.length === 2 && round.playerTotal === 21;
    switch (round.status) {
        case 'win':
            if (playerNatural) return 'Blackjack! You win.';
            return round.dealerTotal > 21 ? 'Dealer busts. You win!' : 'You win!';
        case 'loss':
            return round.playerTotal > 21 ? 'Bust! You lose.' : 'Dealer wins.';
        case 'tie':
            return 'Push. It\'s a tie.';
        default:
            return '';
    }
}

const GamePage = () => {
    const [round, setRound] = useState<RoundState | null>(null);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState('');
    const nextButton = useRef<HTMLButtonElement>(null);

    const roundOver = round !== null && round.status !== 'playing';
    const attemptOver = roundOver && round.roundNumber === round.roundsPerAttempt;

    // Move keyboard/screen-reader focus to the next action when a round ends.
    useEffect(() => {
        if (roundOver) nextButton.current?.focus();
    }, [roundOver]);

    // Every action waits for the previous one, so rapid taps can't double-hit.
    async function act(action: () => Promise<RoundState>) {
        if (pending) return;
        setPending(true);
        setError('');
        try {
            setRound(await action());
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
        } finally {
            setPending(false);
        }
    }

    return (
        <div className="flex min-h-svh flex-col items-center gap-4 px-4 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))]
            text-center [--card-w:clamp(64px,19vw,104px)] sm:gap-6 sm:pb-8">
            <AppHeader />
            <main className="flex w-full flex-1 flex-col items-center gap-4 sm:flex-none sm:gap-6">
                <h1 className="sr-only">Blackjack table</h1>
                {round && (
                    <p className="flex justify-center gap-6 tabular-nums">
                        <span>Round {round.roundNumber} / {round.roundsPerAttempt}</span>
                        <span>Score: {round.attemptScore}</span>
                    </p>
                )}

                {round ? (
                    <div className="flex flex-col gap-6">
                        <Hand
                            title="Dealer's Hand"
                            cards={round.dealerCards}
                            total={round.dealerTotal}
                            totalLabel={roundOver ? 'Dealer Hand Value' : 'Showing'}
                        />
                        <Hand
                            title="Your Hand"
                            cards={round.playerCards}
                            total={round.playerTotal}
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
                    {error ? <span className="text-danger">{error}</span> : round && resultMessage(round)}
                    {attemptOver && <span> Attempt complete: {round.attemptScore} points.</span>}
                </div>

                {/* Actions sit at the bottom of the screen within thumb reach on phones. */}
                <div className="mt-auto flex w-full max-w-90 justify-center gap-3 sm:mt-0">
                    {round?.status === 'playing' ? (
                        <>
                            <button type="button" className="btn" disabled={pending} onClick={() => act(game.hit)}>
                                Hit
                            </button>
                            <button type="button" className="btn" disabled={pending} onClick={() => act(game.stand)}>
                                Stand
                            </button>
                        </>
                    ) : (
                        <button
                            ref={nextButton}
                            type="button"
                            className="btn btn-primary"
                            disabled={pending}
                            onClick={() => act(game.startRound)}
                        >
                            {!round ? 'Deal' : attemptOver ? 'Start New Attempt' : 'Next Round'}
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
};

export default GamePage;
