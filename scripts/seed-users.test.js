import assert from 'node:assert/strict';
import { test } from 'node:test';
import { seedUsers } from './seed-users.js';
import { User } from '../server/models/User.js';

function fixture() {
  const records = new Map();
  const collection = {
    createIndex: async () => {},
    async updateOne(filter, update, options) {
      assert.equal(options.upsert, true);
      const existing = records.get(filter.usernameKey);
      if (existing) return { upsertedCount: 0 };
      records.set(filter.usernameKey, structuredClone(update.$setOnInsert));
      return { upsertedCount: 1 };
    },
    findOne: async ({ email }) => [...records.values()].find(user => user.email === email),
  };
  return { records, db: {
    listCollections: () => ({ hasNext: async () => true }),
    command: async () => {},
    collection: () => collection,
  } };
}

test('seed creates valid users with working passwords and preserves records on rerun', async () => {
  const { db, records } = fixture();
  const password = 'seed-verification-password';
  assert.deepEqual(await seedUsers(db, password), { created: 12, skipped: 0 });
  assert.equal(records.size, 12);
  const salts = new Set();
  for (const user of records.values()) {
    assert.equal(user.gamesPlayed, user.wins + user.losses + user.pushes);
    assert.equal(user.earningsCents, (user.wins - user.losses) * 2500);
    assert.ok(Number.isSafeInteger(user.earningsCents));
    assert.notEqual(user.passwordHash, password);
    salts.add(user.passwordHash.split(':')[1]);
  }
  assert.equal(salts.size, 12);
  const users = new User(db);
  assert.ok(await users.authenticate('demo_ace@example.com', password));
  assert.equal(await users.authenticate('demo_ace@example.com', 'incorrect'), null);
  records.get('demo_ace').earningsCents += 100;
  const before = structuredClone([...records]);
  assert.deepEqual(await seedUsers(db, 'another-valid-password'), { created: 0, skipped: 12 });
  assert.deepEqual([...records], before);
  await assert.rejects(seedUsers(db, 'short'), TypeError);
});

test('seed reports conflicting identities without overwriting them', async () => {
  const { db } = fixture();
  db.collection = () => ({
    createIndex: async () => {},
    updateOne: async () => { throw Object.assign(new Error('duplicate'), { code: 11000 }); },
  });
  await assert.rejects(seedUsers(db, 'seed-verification-password'), /Identity conflict/);
});
