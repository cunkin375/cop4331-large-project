const VALUES = { J: 10, Q: 10, K: 10 };

export function handValue(cards) {
  let value = 0;
  let aces = 0;
  for (const card of cards) {
    if (card.rank === 'A') {
      value += 11;
      aces++;
    } else {
      value += VALUES[card.rank] ?? Number(card.rank);
    }
  }
  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }
  return value;
}

export function isBust(cards) {
  return handValue(cards) > 21;
}

export function isNaturalBlackjack(cards) {
  return cards.length === 2 && handValue(cards) === 21;
}

