import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApp } from './app.js';
import { requireAuth } from './middleware/auth.js';

async function withApi(db, run) {
  const server = createApp(db).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

test('health pings MongoDB and reports outages', async () => {
  for (const available of [true, false]) {
    await withApi({ command: async command => {
      assert.deepEqual(command, { ping: 1 });
      if (!available) throw new Error('offline');
    } }, async url => {
      const response = await fetch(`${url}/api/health`);
      assert.equal(response.status, available ? 200 : 503);
    });
  }
});

test('creates a trimmed item and reads through the collection', async () => {
  const records = [];
  const db = { collection(name) {
    assert.equal(name, 'items');
    return {
      async insertOne(item) {
        records.push({ ...item, _id: 'test-id' });
        return { insertedId: 'test-id' };
      },
      find(query) {
        assert.deepEqual(query, {});
        return { sort(order) {
          assert.deepEqual(order, { _id: -1 });
          return { limit(count) {
            assert.equal(count, 100);
            return { toArray: async () => records };
          } };
        } };
      },
    };
  } };
  await withApi(db, async url => {
    const response = await fetch(`${url}/api/items`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: ' Example ', ignored: true }),
    });
    assert.equal(response.status, 201);
    const item = await response.json();
    assert.equal(item.name, 'Example');
    assert.equal(item._id, 'test-id');
    assert.equal(item.ignored, undefined);
    assert.ok(item.createdAt);
    const listed = await fetch(`${url}/api/items`);
    assert.deepEqual(await listed.json(), { items: [item] });
  });
});

test('rejects invalid input and malformed JSON without database calls', async () => {
  await withApi({}, async url => {
    for (const body of [{}, { name: '' }, { name: { $ne: null } }, { name: 'x'.repeat(101) }]) {
      const response = await fetch(`${url}/api/items`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      assert.equal(response.status, 400);
    }
    const malformed = await fetch(`${url}/api/items`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{',
    });
    assert.equal(malformed.status, 400);
    assert.equal((await fetch(`${url}/missing`)).status, 404);
  });
});

test('database errors return generic JSON', async () => {
  await withApi({ collection() { throw new Error('secret'); } }, async url => {
    const response = await fetch(`${url}/api/items`);
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: 'Unable to complete request' });
  });
});

test('leaderboard returns tied ranks and validates limits', async () => {
  const db = { collection(name) {
    if (name === 'leaderboard') return {};
    assert.equal(name, 'attempts');
    return { aggregate(pipeline) {
      assert.equal(pipeline.find(stage => stage.$limit).$limit, 3);
      return { toArray: async () => [
        { username: 'ace', score: 30 }, { username: 'blair', score: 30 },
        { username: 'casey', score: 20 },
      ] };
    } };
  } };
  await withApi(db, async url => {
    const response = await fetch(`${url}/api/leaderboard?limit=3`);
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).players.map(p => p.rank), [1, 1, 3]);
    for (const limit of ['0', '101', '1.5', 'abc']) {
      assert.equal((await fetch(`${url}/api/leaderboard?limit=${limit}`)).status, 400);
    }
  });
});

test('all game and attempt routes reject unauthenticated requests', async () => {
  const server = createApp({}, { requireAuth }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try {
    const url = `http://127.0.0.1:${server.address().port}`;
    for (const [method, path] of [
      ['POST', '/api/game/start'], ['POST', '/api/game/hit'], ['POST', '/api/game/stand'],
      ['GET', '/api/game/state'], ['GET', '/api/attempts/me'],
    ]) {
      assert.equal((await fetch(url + path, { method })).status, 401, path);
    }
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('game state hides dealer cards and attempt history is scoped to the user', async () => {
  const id = '0123456789abcdef01234567';
  const gameId = '00000000-0000-0000-0000-000000000001';
  const attempts = [{ score: 12 }, { score: 25 }];
  const db = { collection(name) {
    if (name === 'games') return { findOne: async () => ({
      _id: gameId, userId: id, round: 1, results: [], roundOver: false,
      playerCards: [{ rank: '10', suit: 'clubs' }],
      dealerCards: [{ rank: '9', suit: 'clubs' }, { rank: 'K', suit: 'clubs' }],
    }) };
    assert.equal(name, 'attempts');
    return { find(filter) {
      assert.equal(filter.userId.toString(), id);
      return { sort(order) {
        assert.deepEqual(order, { completedAt: -1 });
        return { toArray: async () => attempts };
      } };
    } };
  } };
  const server = createApp(db, { requireAuth(req, _res, next) {
    req.user = { id }; next();
  } }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try {
    const url = `http://127.0.0.1:${server.address().port}`;
    const state = await fetch(`${url}/api/game/state?gameId=${gameId}`);
    assert.equal(state.status, 200);
    const body = await state.json();
    assert.equal(body.dealerCards.length, 1);
    assert.equal(body.dealerValue, undefined);
    assert.equal(body.deck, undefined);
    assert.equal((await fetch(`${url}/api/game/state?gameId=invalid`)).status, 400);
    const history = await fetch(`${url}/api/attempts/me`);
    assert.equal(history.status, 200);
    assert.deepEqual(await history.json(), { attempts, bestScore: 25 });
  } finally { await new Promise(resolve => server.close(resolve)); }
});
