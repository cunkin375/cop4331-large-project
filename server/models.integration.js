import assert from 'node:assert/strict';
import { MongoClient } from 'mongodb';
import { User, Leaderboard, initializeModels } from './models/index.js';
const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB);
const ids = [];
try {
  await initializeModels(db);
  const users = new User(db);
  const prefix = `verify_${Date.now()}`;
  for (let i = 0; i < 12; i++) {
    const user = await users.create({ username: `${prefix}_${i}`, email: `${prefix}_${i}@example.com`, password: 'verification-password-123' });
    ids.push(user._id);
    await users.recordGame(user._id, (i + 1) * 100);
  }
  const email = `${prefix}_0@example.com`;
  assert.ok(await users.authenticate(email, 'verification-password-123'));
  assert.equal(await users.authenticate(email, 'incorrect'), null);
  await assert.rejects(users.create({ username: `${prefix}_duplicate`, email, password: 'verification-password-123' }), error => error.code === 11000);
  await assert.rejects(users.recordGame(ids[0], 1.5), TypeError);
  await users.recordGame(ids[0], -50);
  await users.recordGame(ids[0], 0);
  const first = await db.collection('users').findOne({ _id: ids[0] });
  assert.equal(first.earningsCents, 50);
  assert.equal(first.gamesPlayed, 3);
  assert.equal(first.wins, 1);
  assert.equal(first.losses, 1);
  assert.equal(first.pushes, 1);
  const leaders = await new Leaderboard(db).top10();
  assert.equal(leaders.length, 10);
  assert.ok(leaders.every((p, i) => p.rank === i + 1 && !('passwordHash' in p) && !('email' in p)));
  assert.ok(leaders.every((p, i) => i === 0 || leaders[i - 1].earningsCents >= p.earningsCents));
  await users.recordGame(ids[0], 1000000);
  assert.equal((await new Leaderboard(db).top10())[0]._id.toString(), ids[0].toString());
  console.log('MongoDB integration checks passed: authentication, unique identities, game totals, and live top 10');
} finally {
  await db.collection('users').deleteMany({ _id: { $in: ids } });
  await client.close();
}
