import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApp } from './app.js';
import { handValue, shuffledDeck } from './game.js';

const card = rank => ({ rank, suit: 'clubs' });
const deck = (...ranks) => ranks.map(card).reverse();

test('deck has 52 distinct cards and aces adjust without busting unnecessarily', () => {
  const cards = shuffledDeck();
  assert.equal(cards.length, 52);
  assert.equal(new Set(cards.map(c => `${c.rank}:${c.suit}`)).size, 52);
  for (const [ranks, value] of [[['A', 'A', '9'], 21], [['A', '6'], 17], [['A', 'K', '5'], 16], [['K', 'Q', '2'], 22]]) {
    assert.equal(handValue(ranks.map(card)), value);
  }
});

async function fixture(deckFactory, run) {
  const games = new Map();
  const attempts = new Map();
  // structuredClone drops the ObjectId class; keep the real one so ownership checks work.
  const copy = game => game && { ...structuredClone(game), userId: game.userId };
  const db = { collection(name) {
    if (name === 'users') return { findOne: async () => ({}) };
    if (name === 'attempts') return { updateOne: async (query, update) => {
      if (!attempts.has(query._id)) attempts.set(query._id, structuredClone(update.$setOnInsert));
    } };
    assert.equal(name, 'games');
    return {
      insertOne: async game => games.set(game._id, copy(game)),
      findOne: async query => copy(games.get(query._id) || null),
      replaceOne: async (query, game) => {
        if (games.get(query._id)?.version !== query.version) return { matchedCount: 0 };
        games.set(query._id, copy(game));
        return { matchedCount: 1 };
      },
    };
  } };
  const server = createApp(db, { deckFactory, requireAuth: fakeAuth }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const post = async (action, body = {}) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/game/${action}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    return { status: response.status, ...await response.json() };
  };
  try { await run(post, attempts); }
  finally { await new Promise(resolve => server.close(resolve)); }
}
const userId = '0123456789abcdef01234567';
// Stands in for JWT auth: every request is made as this user.
function fakeAuth(req, _res, next) {
  req.user = { id: userId, username: 'player' };
  next();
}

test('dealer stands on soft 17, hole card stays hidden, and exactly ten rounds save once', async () => {
  await fixture(() => deck('10', 'A', '8', '6'), async (post, attempts) => {
    let game = await post('start');
    const { gameId } = game;
    assert.equal(game.dealerCards.length, 1);
    assert.equal(game.dealerValue, undefined);
    assert.equal(game.deck, undefined);
    assert.equal((await post('start', { gameId })).status, 409);
    for (let round = 1; round <= 10; round++) {
      if (round > 1) game = await post('start', { gameId });
      assert.equal(game.round, round);
      game = await post('stand', { gameId });
      assert.equal(game.outcome, 'win');
      assert.equal(game.dealerValue, 17);
      assert.equal(game.dealerCards.length, 2);
      assert.equal(game.totalPoints, round * 3);
      assert.equal(attempts.size, round === 10 ? 1 : 0);
    }
    assert.equal(game.attemptComplete, true);
    assert.equal([...attempts.values()][0].score, 30);
    assert.equal([...attempts.values()][0].rounds.length, 10);
    assert.equal((await post('stand', { gameId })).status, 409);
    assert.equal((await post('start', { gameId })).status, 409);
    assert.equal(attempts.size, 1);
  });
});

test('hit bust ends the round, dealer draws below 17, ties and naturals score correctly', async () => {
  for (const [ranks, action, outcome, points] of [
    [['K', '9', 'Q', '7', '2'], 'hit', 'loss', 0],
    [['10', '9', '8', '7', '2'], 'stand', 'tie', 1],
    [['10', '9', '8', '7', 'K'], 'stand', 'win', 3],
    [['A', '9', 'K', '7'], null, 'win', 3],
    [['10', 'A', '8', 'K'], null, 'loss', 0],
    [['A', 'A', 'K', 'Q'], null, 'tie', 1],
  ]) {
    await fixture(() => deck(...ranks), async post => {
      let game = await post('start');
      if (action) game = await post(action, { gameId: game.gameId });
      assert.equal(game.outcome, outcome);
      assert.equal(game.points, points);
      assert.equal(game.roundOver, true);
      assert.equal((await post('hit', { gameId: game.gameId })).status, 409);
    });
  }
});

test('rejects invalid IDs and missing games', async () => {
  await fixture(() => deck('10', '9', '8', '7'), async post => {
    assert.equal((await post('hit', { gameId: { $ne: null } })).status, 400);
    assert.equal((await post('stand', { gameId: '00000000-0000-0000-0000-000000000000' })).status, 404);
  });
});

test('concurrent moves cannot settle or score a round twice', async () => {
  await fixture(() => deck('10', '9', '8', '7', '2'), async post => {
    const { gameId } = await post('start');
    const results = await Promise.all([post('stand', { gameId }), post('stand', { gameId })]);
    assert.deepEqual(results.map(result => result.status).sort(), [200, 409]);
    const next = await post('start', { gameId });
    assert.equal(next.roundsCompleted, 1);
    assert.equal(next.totalPoints, 1);
  });
});
