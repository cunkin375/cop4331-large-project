import { useCallback, useRef, useState } from 'react';
import type { Card, GameState } from '../types/game.ts';

// Presentation only: the server has already decided the round. This hook replays
// each new state as visible steps (deal, flip, sweep) and reports when it's done.

export interface CardSlot {
    card: Card | null; // null = face down and not yet known (the hole card)
    faceUp: boolean;
    fromDeck: boolean; // fly in from the deck when it first appears
}

export interface TableView {
    dealId: number; // changes every round, so new cards never reuse the previous round's elements
    player: CardSlot[];
    dealer: CardSlot[];
    sweeping: boolean;
}

type Step =
    | { kind: 'sweep' }
    | { kind: 'deal'; hand: 'player' | 'dealer'; card: Card | null }
    | { kind: 'flip'; card: Card };

export const FLIGHT_MS = 400;
export const FLIP_MS = 450;
export const SWEEP_MS = 300;
export const SWEEP_STAGGER_MS = 40;
const DEAL_GAP_MS = 225;

const EMPTY: TableView = { dealId: 0, player: [], dealer: [], sweeping: false };

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Load card faces before they appear so a flip never reveals a blank card.
function preload(cards: Card[]): Promise<unknown> {
    const names: Record<string, string> = { A: 'ace', J: 'jack', Q: 'queen', K: 'king' };
    const words = ['', '', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
    const loads = cards.map(({ rank, suit }) => {
        const image = new Image();
        image.src = `/cards/${names[rank] ?? words[Number(rank)]}_of_${suit}.png`;
        return image.decode().catch(() => {});
    });
    return Promise.race([Promise.all(loads), wait(500)]);
}

// The table exactly as the state describes it, with nothing left to animate.
function viewOf(game: GameState, dealId: number): TableView {
    const slot = (card: Card | null): CardSlot => ({ card, faceUp: card !== null, fromDeck: false });
    return {
        player: game.playerCards.map(slot),
        dealId,
        dealer: game.roundOver ? game.dealerCards.map(slot) : [slot(game.dealerCards[0]), slot(null)],
        sweeping: false,
    };
}

// Steps that turn the table for `prev` into the table for `next`, in real dealing order.
function planSteps(prev: GameState | null, next: GameState): Step[] {
    const steps: Step[] = [];
    const deal = (hand: 'player' | 'dealer', card: Card | null) => steps.push({ kind: 'deal', hand, card });
    const newRound = !prev || prev.gameId !== next.gameId || prev.round !== next.round;
    let playerShown: number;
    let dealerShown: number;

    if (newRound) {
        if (prev) steps.push({ kind: 'sweep' });
        // Player, dealer, player, then the dealer's hole card face down.
        deal('player', next.playerCards[0]);
        deal('dealer', next.dealerCards[0]);
        deal('player', next.playerCards[1]);
        deal('dealer', null);
        playerShown = 2;
        dealerShown = 2;
    } else {
        playerShown = prev.playerCards.length;
        dealerShown = prev.roundOver ? prev.dealerCards.length : 2;
    }

    for (const card of next.playerCards.slice(playerShown)) deal('player', card);

    // The round just ended: reveal the hole card, then the dealer draws.
    if (next.roundOver && (newRound || !prev.roundOver)) {
        steps.push({ kind: 'flip', card: next.dealerCards[1] });
        for (const card of next.dealerCards.slice(dealerShown)) deal('dealer', card);
    }
    return steps;
}

export function useDealAnimation() {
    const [view, setView] = useState<TableView>(EMPTY);
    // `latest` is the newest server state; `shown` is the newest one whose animation has finished.
    const [latest, setLatest] = useState<GameState | null>(null);
    const [shown, setShown] = useState<GameState | null>(null);
    const shownRef = useRef<GameState | null>(null);

    const finish = (game: GameState) => {
        shownRef.current = game;
        setShown(game);
    };

    // Resolves once the table matches `next`. `instant` skips animation (e.g. resuming after a reload).
    const show = useCallback(async (next: GameState, { instant = false } = {}) => {
        setLatest(next);
        if (instant || prefersReducedMotion()) {
            setView((v) => viewOf(next, v.dealId + 1));
            finish(next);
            return;
        }

        await preload([...next.playerCards, ...next.dealerCards]);
        let flying = false;
        for (const step of planSteps(shownRef.current, next)) {
            if (step.kind !== 'deal' && flying) {
                await wait(FLIGHT_MS - DEAL_GAP_MS); // let the last card land
                flying = false;
            }
            if (step.kind === 'sweep') {
                setView((v) => ({ ...v, sweeping: true }));
                const cards = Math.max(shownRef.current?.playerCards.length ?? 0, 4);
                await wait(SWEEP_MS + cards * SWEEP_STAGGER_MS);
                setView((v) => ({ ...EMPTY, dealId: v.dealId + 1 }));
            } else if (step.kind === 'deal') {
                const slot: CardSlot = { card: step.card, faceUp: step.card !== null, fromDeck: true };
                setView((v) => ({ ...v, [step.hand]: [...v[step.hand], slot] }));
                await wait(DEAL_GAP_MS);
                flying = true;
            } else {
                setView((v) => ({
                    ...v,
                    dealer: v.dealer.map((s, i) => (i === 1 ? { ...s, card: step.card, faceUp: true } : s)),
                }));
                await wait(FLIP_MS);
            }
        }
        if (flying) await wait(FLIGHT_MS - DEAL_GAP_MS);
        finish(next);
    }, []);

    const clear = useCallback(() => {
        shownRef.current = null;
        setView((v) => ({ ...EMPTY, dealId: v.dealId + 1 }));
        setLatest(null);
        setShown(null);
    }, []);

    return { view, latest, shown, show, clear };
}
