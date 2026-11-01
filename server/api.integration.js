import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { ObjectId } from 'mongodb';
import { connectDb } from './config/db.js';
import { createApp } from './app.js';

// Uses real MongoDB and HTTP, capturing mail rather than emailing test recipients.
// Test records are removed in finally; use a dedicated test database when possible.
const { client, db } = await connectDb(process.env.MONGODB_URI, process.env.MONGODB_DB);
const prefix = `it${Date.now()}`;
const password = randomBytes(24).toString('hex');
const accounts = ['a', 'b'].map(suffix => ({
  username: `${prefix}_${suffix}`, email: `${prefix}_${suffix}@example.com`, password,
}));
const mail = { verification: [], reset: [] };
let server;
const itemIds = [];
try {
  server = createApp(db, { mailer: {
    sendVerificationEmail: async (user, token) => mail.verification.push({ user, token }),
    sendResetEmail: async (user, token) => mail.reset.push({ user, token }),
  } }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/api`;
  async function call(method, path, body, token, status = 200) {
    const response = await fetch(base + path, {
      method, headers: {
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    assert.equal(response.status, status, `${method} ${path.split('?')[0]} status`);
    return response.json();
  }
  await call('GET', '/health');
  const logins = [];
  for (const account of accounts) {
    await call('POST', '/register', account, undefined, 201);
    await call('POST', '/register', account, undefined, 409);
    await call('POST', '/login', account, undefined, 403);
    const firstToken = mail.verification.at(-1).token;
    await call('POST', '/resend-verification', { email: account.email });
    await call('GET', `/verify-email?token=${firstToken}`, undefined, undefined, 400);
    const token = mail.verification.at(-1).token;
    await call('GET', `/verify-email?token=${token}`);
    await call('GET', `/verify-email?token=${token}`, undefined, undefined, 400);
    logins.push(await call('POST', '/login', account));
  }
  console.log('PASS real MongoDB HTTP signup, duplicates, verification, resend, and login');
  const [alice, bob] = logins;
  const me = await call('GET', '/me', undefined, alice.token);
  assert.equal(me.id, alice.user.id);
  assert.deepEqual(Object.keys(me).sort(), ['email', 'id', 'username']);
  await call('GET', '/me', undefined, undefined, 401);
  await call('POST', '/game/start', {}, undefined, 401);
  let game = await call('POST', '/game/start', {}, alice.token);
  const gameId = game.gameId;
  await call('GET', `/game/state?gameId=${gameId}`, undefined, bob.token, 404);
  for (const action of ['start', 'hit', 'stand']) {
    await call('POST', `/game/${action}`, { gameId }, bob.token, 404);
  }
  if (!game.roundOver) {
    game = await call('POST', '/game/hit', { gameId }, alice.token);
  }
  for (let round = 1; round <= 10; round++) {
    if (round > 1) game = await call('POST', '/game/start', { gameId }, alice.token);
    if (!game.roundOver) game = await call('POST', '/game/stand', { gameId }, alice.token);
    assert.equal(game.roundsCompleted, round);
  }
  assert.equal(game.attemptComplete, true);
  const state = await call('GET', `/game/state?gameId=${gameId}`, undefined, alice.token);
  assert.equal(state.totalPoints, game.totalPoints);
  await call('POST', '/game/stand', { gameId }, alice.token, 409);
  const history = await call('GET', '/attempts/me', undefined, alice.token);
  assert.equal(history.attempts.length, 1);
  assert.equal(history.bestScore, game.totalPoints);
  assert.equal((await call('GET', '/attempts/me', undefined, bob.token)).attempts.length, 0);
  const search = await call('GET', `/leaderboard?q=${prefix.toUpperCase()}&limit=1`);
  assert.deepEqual(search.players, [{ rank: 1, score: game.totalPoints, username: accounts[0].username }]);
  assert.deepEqual((await call('GET', `/leaderboard?q=${prefix}.*`)).players, []);
  console.log('PASS real MongoDB HTTP game actions, ten-round persistence, ownership, history, and partial search');
  await call('POST', '/forgot-password', { email: accounts[0].email });
  const reset = mail.reset.at(-1).token;
  const newPassword = randomBytes(24).toString('hex');
  await call('POST', '/reset-password', { token: reset, password: newPassword });
  await call('POST', '/reset-password', { token: reset, password: newPassword }, undefined, 400);
  await call('POST', '/login', accounts[0], undefined, 401);
  await call('POST', '/login', { email: accounts[0].email, password: newPassword });
  const item = await call('POST', '/items', { name: prefix }, undefined, 201);
  itemIds.push(new ObjectId(item._id));
  assert.ok((await call('GET', '/items')).items.some(row => row._id === item._id));
  console.log('PASS real MongoDB HTTP password reset, single-use token, and sample item routes');
  console.log('Email tokens were captured for testing; no actual messages were sent.');
} finally {
  if (server) await new Promise(resolve => server.close(resolve));
  try {
    const users = await db.collection('users').find({ username: { $in: accounts.map(a => a.username) } }).toArray();
    const ids = users.map(user => user._id);
    await db.collection('attempts').deleteMany({ userId: { $in: ids } });
    await db.collection('games').deleteMany({ userId: { $in: ids } });
    await db.collection('items').deleteMany({ _id: { $in: itemIds } });
    await db.collection('users').deleteMany({ _id: { $in: ids } });
    console.log('Temporary integration records removed.');
  } finally { await client.close(); }
}
