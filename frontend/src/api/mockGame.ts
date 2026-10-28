import type { Card, Rank, RoundState, Suit } from '../types/game.ts';

// TEMPORARY: runs the game in the browser so the UI can be built before the
// backend game endpoints exist. Swap these functions for fetch calls to the
// API; the backend must own the deck and scoring in the real game.

const SUITS: Suit[] = ['clubs', 'diamonds', 'hearts', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const ROUNDS_PER_ATTEMPT = 10;
const POINTS = { win: 3, tie: 1, loss: 0 };

let deck: Card[] = [];
let player: Card[] = [];
let dealer: Card[] = [];
let status: RoundState['status'] = 'playing';
let roundNumber = 0;
let attemptScore = 0;

function shuffledDeck(): Card[] {
    const cards = SUITS.flatMap((suit) => RANKS.map((rank) => ({ rank, suit })));
    for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards;
}

export function handTotal(cards: Card[]): number {
    let total = 0;
    let aces = 0;
    for (const { rank } of cards) {
        if (rank === 'A') { total += 11; aces++; }
        else total += ['J', 'Q', 'K'].includes(rank) ? 10 : Number(rank);
    }
    while (total > 21 && aces > 0) { total -= 10; aces--; }
    return total;
}

function finish(result: 'win' | 'loss' | 'tie') {
    status = result;
    attemptScore += POINTS[result];
}

function snapshot(): RoundState {
    const hideHoleCard = status === 'playing';
    const visibleDealer = hideHoleCard ? dealer.slice(0, 1) : dealer;
    return {
        playerCards: [...player],
        dealerCards: hideHoleCard ? [dealer[0], null] : [...dealer],
        playerTotal: handTotal(player),
        dealerTotal: handTotal(visibleDealer),
        status,
        roundNumber,
        roundsPerAttempt: ROUNDS_PER_ATTEMPT,
        attemptScore,
    };
}

export async function startRound(): Promise<RoundState> {
    if (roundNumber >= ROUNDS_PER_ATTEMPT) { roundNumber = 0; attemptScore = 0; }
    deck = shuffledDeck();
    player = [deck.pop()!, deck.pop()!];
    dealer = [deck.pop()!, deck.pop()!];
    status = 'playing';
    roundNumber++;

    // Naturals resolve before normal play.
    const playerNatural = handTotal(player) === 21;
    const dealerNatural = handTotal(dealer) === 21;
    if (playerNatural || dealerNatural) {
        finish(playerNatural && dealerNatural ? 'tie' : playerNatural ? 'win' : 'loss');
    }
    return snapshot();
}

export async function hit(): Promise<RoundState> {
    if (status !== 'playing') throw new Error('The round is over. Start a new round.');
    player.push(deck.pop()!);
    if (handTotal(player) > 21) finish('loss');
    return snapshot();
}

export async function stand(): Promise<RoundState> {
    if (status !== 'playing') throw new Error('The round is over. Start a new round.');
    while (handTotal(dealer) < 17) dealer.push(deck.pop()!);
    const playerTotal = handTotal(player);
    const dealerTotal = handTotal(dealer);
    finish(dealerTotal > 21 || playerTotal > dealerTotal ? 'win'
        : playerTotal < dealerTotal ? 'loss' : 'tie');
    return snapshot();
}
