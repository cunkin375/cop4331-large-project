export type Suit = 'clubs' | 'diamonds' | 'hearts' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
    rank: Rank;
    suit: Suit;
}

export type RoundStatus = 'playing' | 'win' | 'loss' | 'tie';

// Shape the game API returns after every deal, hit, and stand.
// The server owns the deck; the dealer's hole card is null until revealed.
export interface RoundState {
    playerCards: Card[];
    dealerCards: (Card | null)[];
    playerTotal: number;
    dealerTotal: number; // total of the visible dealer cards only
    status: RoundStatus;
    roundNumber: number;
    roundsPerAttempt: number;
    attemptScore: number;
}
