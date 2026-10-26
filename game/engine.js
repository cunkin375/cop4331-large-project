import { handValue, isBust, isNaturalBlackjack } from './hand.js';

export function playDealer(dealerHand, drawCard) {
  while (handValue(dealerHand) < 17) dealerHand.push(drawCard());
  return dealerHand;
}

export function resolveOutcome(playerHand, dealerHand) {
  const playerNatural = isNaturalBlackjack(playerHand);
  const dealerNatural = isNaturalBlackjack(dealerHand);
  let outcome;
  if (isBust(playerHand)) outcome = 'loss';
  else if (isBust(dealerHand)) outcome = 'win';
  else if (playerNatural !== dealerNatural) outcome = playerNatural ? 'win' : 'loss';
  else if (handValue(playerHand) === handValue(dealerHand)) outcome = 'tie';
  else outcome = handValue(playerHand) > handValue(dealerHand) ? 'win' : 'loss';
  return { outcome, points: { win: 3, tie: 1, loss: 0 }[outcome] };
}

