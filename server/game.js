import { randomUUID } from 'node:crypto';
import { ObjectId } from 'mongodb';
import { Attempt } from './models/Attempt.js';
import { createDeck } from '../game/deck.js';
import { handValue, isBust, isNaturalBlackjack } from '../game/hand.js';
import { playDealer, resolveOutcome } from '../game/engine.js';

export { createDeck as shuffledDeck, handValue };

function settle(game) {
  const player = handValue(game.playerCards);
  const dealer = handValue(game.dealerCards);
  // A two-card blackjack beats a non-natural 21.
  ({ outcome: game.outcome, points: game.points } = resolveOutcome(game.playerCards, game.dealerCards));
  game.roundOver = true;
  game.roundStatus = 'finished';
  game.results.push({ round: game.round, outcome: game.outcome, points: game.points });
}

function deal(game, deckFactory) {
  game.deck = deckFactory();
  game.playerCards = [game.deck.pop()];
  game.dealerCards = [game.deck.pop()];
  game.playerCards.push(game.deck.pop());
  game.dealerCards.push(game.deck.pop());
  game.roundOver = false;
  game.roundStatus = 'in_progress';
  game.outcome = null;
  game.points = null;
  if (isNaturalBlackjack(game.playerCards) || isNaturalBlackjack(game.dealerCards)) settle(game);
}

function publicState(game) {
  return {
    gameId: game._id, round: game.round, roundsCompleted: game.results.length,
    playerCards: game.playerCards, playerValue: handValue(game.playerCards),
    dealerCards: game.roundOver ? game.dealerCards : game.dealerCards.slice(0, 1),
    ...(game.roundOver ? { dealerValue: handValue(game.dealerCards) } : {}),
    roundOver: game.roundOver, outcome: game.outcome, points: game.points,
    totalPoints: game.results.reduce((sum, result) => sum + result.points, 0),
    attemptComplete: game.results.length === 10,
  };
}

export function registerGameRoutes(app, db, { deckFactory = createDeck, requireAuth } = {}) {
  const fail = (res, status, error) => res.status(status).json({ error });
  for (const action of ['start', 'hit', 'stand']) {
    const handler = async (req, res, next) => {
      try {
        const { gameId } = req.body || {};
        const authenticatedUserId = req.user?.id;
        let game;
        let version;
        if (action === 'start' && gameId === undefined) {
          if (typeof authenticatedUserId !== 'string' || !/^[a-f\d]{24}$/i.test(authenticatedUserId)) {
            return fail(res, 401, 'Authentication required');
          }
          const owner = new ObjectId(authenticatedUserId);
          if (!await db.collection('users').findOne({ _id: owner })) return fail(res, 404, 'User not found');
          game = {
            _id: randomUUID(), userId: owner, user: owner, version: 0, round: 1,
            roundNumber: 1, results: [], totalPoints: 0, attemptStatus: 'active',
            createdAt: new Date(),
          };
          deal(game, deckFactory);
          await db.collection('games').insertOne(game);
        } else {
          if (typeof gameId !== 'string' || !/^[a-f\d-]{36}$/i.test(gameId)) return fail(res, 400, 'A valid gameId is required');
          game = await db.collection('games').findOne({ _id: gameId });
          if (!game) return fail(res, 404, 'Game not found');
          if (authenticatedUserId && game.userId?.toString() !== authenticatedUserId) {
            return fail(res, 404, 'Game not found');
          }
          if (game.results.length === 10) {
            await new Attempt(db).save(game);
            return fail(res, 409, 'Attempt complete; start a new attempt without gameId');
          }
          version = game.version;
          if (action === 'start') {
            if (!game.roundOver) return fail(res, 409, 'Finish the current round first');
            game.round++;
            game.roundNumber = game.round;
            deal(game, deckFactory);
          } else {
            if (game.roundOver) return fail(res, 409, 'Round is already over');
            if (action === 'hit') {
              game.playerCards.push(game.deck.pop());
              if (handValue(game.playerCards) > 21) settle(game);
            } else {
              playDealer(game.dealerCards, () => game.deck.pop());
              settle(game);
            }
          }
          game.totalPoints = game.results.reduce((sum, result) => sum + result.points, 0);
          if (game.results.length === 10) game.attemptStatus = 'completed';
          game.version++;
          const result = await db.collection('games').replaceOne({ _id: gameId, version }, game);
          if (!result.matchedCount) return fail(res, 409, 'Game changed; retry with the current state');
        }
        if (game.results.length === 10) {
          game.attemptStatus = 'completed';
          game.totalPoints = game.results.reduce((sum, result) => sum + result.points, 0);
          await new Attempt(db).save(game);
        }
        res.json(publicState(game));
      } catch (error) { next(error); }
    };
    app.post(`/api/game/${action}`, requireAuth ? [requireAuth, handler] : handler);
  }

  const stateHandler = async (req, res, next) => {
    try {
      const { gameId } = req.query;
      if (typeof gameId !== 'string' || !/^[a-f\d-]{36}$/i.test(gameId)) {
        return fail(res, 400, 'A valid gameId is required');
      }
      const game = await db.collection('games').findOne({ _id: gameId });
      if (!game || (req.user?.id && game.userId?.toString() !== req.user.id)) {
        return fail(res, 404, 'Game not found');
      }
      res.json(publicState(game));
    } catch (error) { next(error); }
  };
  app.get('/api/game/state', requireAuth ? [requireAuth, stateHandler] : stateHandler);

  app.get('/api/attempts/me', requireAuth ? [requireAuth, async (req, res, next) => {
      try {
        const userId = req.user?.id;
        if (typeof userId !== 'string' || !/^[a-f\d]{24}$/i.test(userId)) {
          return fail(res, 401, 'Authentication required');
        }
        const attempts = await db.collection('attempts').find({ userId: new ObjectId(userId) })
          .sort({ completedAt: -1 }).toArray();
        const bestScore = attempts.reduce((best, attempt) => Math.max(best, attempt.score), 0);
        res.json({ attempts, bestScore });
      } catch (error) { next(error); }
  }] : async (_req, res) => fail(res, 401, 'Authentication required'));
}
