import { MongoClient } from 'mongodb';
import { initializeModels } from '../server/models/index.js';
import { hashPassword } from '../server/models/User.js';
import { pathToFileURL } from 'node:url';

const names = ['Ace', 'Blair', 'Casey', 'Drew', 'Ellis', 'Finley', 'Gray', 'Harper', 'Indigo', 'Jules', 'Kai', 'Lane'];

export async function seedUsers(db, password) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) {
    throw new TypeError('Set SEED_PASSWORD to a password of 12–128 characters');
  }
  await initializeModels(db);
  let created = 0;
  for (const [index, name] of names.entries()) {
    const username = `demo_${name.toLowerCase()}`;
    const email = `${username}@example.com`;
    const passwordHash = await hashPassword(password);
    const now = new Date();
    const wins = 24 - index;
    const losses = 5 + index;
    const pushes = index % 4;
    // Insert the complete record atomically; reruns never reset games or passwords.
    try {
      const result = await db.collection('users').updateOne(
        { usernameKey: username, email },
        { $setOnInsert: {
          username, usernameKey: username, email, passwordHash,
          earningsCents: (wins - losses) * 2500,
          gamesPlayed: wins + losses + pushes, wins, losses, pushes,
          createdAt: now, updatedAt: now,
        } },
        { upsert: true },
      );
      created += result.upsertedCount;
      console.log(`${result.upsertedCount ? 'Created' : 'Skipped'} ${username}`);
    } catch (error) {
      if (error.code !== 11000) throw error;
      throw new Error(`Identity conflict for ${username}; existing user was not changed`);
    }
  }
  return { created, skipped: names.length - created };
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('Set MONGODB_URI in .env');
  // Validate before opening a database connection or making changes.
  const password = process.env.SEED_PASSWORD;
  if (!password || password.length < 12 || password.length > 128) {
    throw new Error('Set SEED_PASSWORD to a password of 12–128 characters');
  }
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    const result = await seedUsers(client.db(process.env.MONGODB_DB || 'blackjack'), password);
    console.log(`Seeding complete: ${result.created} created, ${result.skipped} skipped.`);
  } finally {
    await client.close();
  }
}

// Importing seedUsers for verification does not execute the CLI.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(`Seeding failed: ${error.message}`);
    process.exitCode = 1;
  });
}
