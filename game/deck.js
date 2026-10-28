import { randomInt } from 'node:crypto';

const SUITS = ['clubs', 'diamonds', 'hearts', 'spades'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function createDeck() {
  const deck = SUITS.flatMap(suit => RANKS.map(rank => ({ rank, suit })));
  for (let index = deck.length - 1; index > 0; index--) {
    const swapIndex = randomInt(index + 1);
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }
  return deck;
}

