import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createDeck } from '../game/deck.js';
import { handValue, isBust, isNaturalBlackjack } from '../game/hand.js';
import { playDealer, resolveOutcome } from '../game/engine.js';

// Cards from a short string like 'As Kd 10h' (rank then suit letter).
const SUITS = { s: 'spades', h: 'hearts', d: 'diamonds', c: 'clubs' };
const cards = text => text.split(' ').map(card => ({ rank: card.slice(0, -1), suit: SUITS[card.slice(-1)] }));

// A second scorer written separately from game/hand.js, used to cross-check it.
function referenceValue(hand) {
  let total = 0;
  let aces = 0;
  for (const { rank } of hand) {
    if (rank === 'A') { total += 1; aces++; } else total += ['J', 'Q', 'K'].includes(rank) ? 10 : Number(rank);
  }
  return aces && total + 10 <= 21 ? total + 10 : total;
}

function referenceOutcome(player, dealer) {
  const playerValue = referenceValue(player);
  const dealerValue = referenceValue(dealer);
  const playerNatural = player.length === 2 && playerValue === 21;
  const dealerNatural = dealer.length === 2 && dealerValue === 21;
  if (playerValue > 21) return 'loss';
  if (playerNatural && dealerNatural) return 'tie';
  if (playerNatural) return 'win';
  if (dealerNatural) return 'loss';
  if (dealerValue > 21) return 'win';
  if (playerValue === dealerValue) return 'tie';
  return playerValue > dealerValue ? 'win' : 'loss';
}

test('hand values count aces as 11 or 1, whichever avoids a bust', () => {
  const expected = {
    'As Kh': 21, 'As Ad': 12, 'As Ad Ah': 13, 'As Ad 9h': 21, 'As 5d 6h': 12,
    'Ks Qd 2h': 22, 'As 6d': 17, 'As 6d Kh': 17, '5s 5d As': 21, 'As Ad Ah Ac 7s': 21,
  };
  for (const [hand, value] of Object.entries(expected)) assert.equal(handValue(cards(hand)), value, hand);
});

test('each outcome scores 3, 1 or 0 points in the tricky cases', () => {
  const cases = [
    ['Ks 9d', '7h Kc 6s', 'win', 'dealer busts'],
    ['Ks 9d Qh', '7h Kc', 'loss', 'player busts first'],
    ['Ks Qd 2h', 'Kh 6c Qs', 'loss', 'both bust, player loses'],
    ['As Kd', 'Kh 7c Ad 3s', 'win', 'blackjack beats a four-card 21'],
    ['7s 7d 7h', 'Ah Kc', 'loss', 'dealer blackjack beats a three-card 21'],
    ['As Kd', 'Ah Qc', 'tie', 'both blackjack'],
    ['Ks 8d', 'Qh 8c', 'tie', 'equal totals'],
    ['Ks 9d', 'Qh 8c', 'win', 'higher total'],
    ['Ks 7d', 'Qh 8c', 'loss', 'lower total'],
  ];
  const points = { win: 3, tie: 1, loss: 0 };
  for (const [player, dealer, outcome, why] of cases) {
    assert.deepEqual(resolveOutcome(cards(player), cards(dealer)), { outcome, points: points[outcome] }, why);
  }
});

test('the dealer stands on soft and hard 17', () => {
  const noDraw = () => { throw new Error('dealer drew on 17'); };
  assert.equal(handValue(playDealer(cards('As 6d'), noDraw)), 17);
  assert.equal(handValue(playDealer(cards('Ks 7d'), noDraw)), 17);
});

test('20,000 random rounds score the same as the reference scorer', () => {
  for (let i = 0; i < 20000; i++) {
    const deck = createDeck();
    if (i < 500) assert.equal(new Set(deck.map(card => card.rank + card.suit)).size, 52, 'deck has 52 distinct cards');
    const player = [deck.pop()];
    const dealer = [deck.pop()];
    player.push(deck.pop());
    dealer.push(deck.pop());
    if (!isNaturalBlackjack(player) && !isNaturalBlackjack(dealer)) {
      const standOn = 12 + (i % 7); // mix of strategies, standing anywhere from 12 to 18
      while (handValue(player) < standOn) player.push(deck.pop());
      if (!isBust(player)) playDealer(dealer, () => deck.pop());
    }
    if (!isBust(player) && !isNaturalBlackjack(player) && !isNaturalBlackjack(dealer)) {
      assert.ok(handValue(dealer) >= 17, 'dealer finished under 17');
    }
    assert.equal(handValue(player), referenceValue(player));
    assert.equal(handValue(dealer), referenceValue(dealer));
    assert.equal(resolveOutcome(player, dealer).outcome, referenceOutcome(player, dealer));
  }
});
