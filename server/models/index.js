import { leaderboardPipeline } from './Leaderboard.js';
export { User } from './User.js';
export { Leaderboard } from './Leaderboard.js';
export { Attempt } from './Attempt.js';

export async function initializeModels(db) {
  await db.collection('attempts').createIndex({ score: -1, completedAt: 1 });
  await db.collection('attempts').createIndex({ userId: 1, completedAt: -1 });
  await db.collection('attempts').createIndex({ sessionId: 1 }, { unique: true });
  await db.collection('gameSessions').createIndex({ user: 1, attemptStatus: 1 });
  const validator = { $jsonSchema: {
    bsonType: 'object',
    required: ['username', 'usernameKey', 'email', 'passwordHash', 'earningsCents', 'gamesPlayed', 'wins', 'losses', 'pushes', 'createdAt', 'updatedAt'],
    properties: {
      username: { bsonType: 'string', minLength: 3, maxLength: 30 },
      usernameKey: { bsonType: 'string' }, email: { bsonType: 'string' },
      passwordHash: { bsonType: 'string', pattern: '^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$' },
      earningsCents: { bsonType: ['int', 'long', 'double'], multipleOf: 1, minimum: -9007199254740991, maximum: 9007199254740991 },
      ...Object.fromEntries(['gamesPlayed', 'wins', 'losses', 'pushes'].map(key => [key, { bsonType: ['int', 'long', 'double'], minimum: 0, multipleOf: 1 }])),
      createdAt: { bsonType: 'date' }, updatedAt: { bsonType: 'date' },
    },
  } };
  if (!(await db.listCollections({ name: 'users' }).hasNext())) {
    await db.createCollection('users', { validator });
  } else {
    await db.command({ collMod: 'users', validator });
  }
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('users').createIndex({ usernameKey: 1 }, { unique: true });
  await db.collection('users').createIndex({ earningsCents: -1, _id: 1 });
  if (!(await db.listCollections({ name: 'leaderboard' }).hasNext())) {
    await db.createCollection('leaderboard', { viewOn: 'users', pipeline: leaderboardPipeline });
  } else {
    await db.command({ collMod: 'leaderboard', viewOn: 'users', pipeline: leaderboardPipeline });
  }
}
