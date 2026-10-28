export type Suit = 'clubs' | 'diamonds' | 'hearts' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
    rank: Rank;
    suit: Suit;
}

export type Outcome = 'win' | 'loss' | 'tie';

export const ROUNDS_PER_ATTEMPT = 10;

// Shape the game API returns from start, hit, stand, and state.
// While a round is in progress, dealerCards holds only the up card and dealerValue is omitted.
export interface GameState {
    gameId: string;
    round: number;
    roundsCompleted: number;
    playerCards: Card[];
    playerValue: number;
    dealerCards: Card[];
    dealerValue?: number;
    roundOver: boolean;
    outcome: Outcome | null;
    points: number | null;
    totalPoints: number;
    attemptComplete: boolean;
}
