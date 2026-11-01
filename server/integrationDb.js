import { randomBytes } from 'node:crypto';
import { MongoClient } from 'mongodb';
import { initializeModels } from './models/index.js';

// Each run owns a fresh database. Never connect or initialize the live database.
export async function runIntegration(run, createClient = uri => new MongoClient(uri, { serverSelectionTimeoutMS: 5000 })) {
  const name = process.env.MONGODB_DB;
  if (!name || !/^[a-zA-Z0-9_]+_test$/.test(name)) {
    throw new Error('Integration tests require a test database. Set MONGODB_DB=blackjack_test; never use blackjack.');
  }
  const client = createClient(process.env.MONGODB_URI);
  const db = client.db(`${name.slice(0, 35)}_${randomBytes(8).toString('hex')}_test`);
  const controller = new AbortController();
  const interrupt = () => controller.abort(new Error('Integration test interrupted; cleaning up test database.'));
  process.on('SIGINT', interrupt);
  process.on('SIGTERM', interrupt);
  let connected = false;
  try {
    await client.connect();
    connected = true;
    controller.signal.throwIfAborted();
    await initializeModels(db);
    await run(db, controller.signal);
    controller.signal.throwIfAborted();
  } finally {
    // Signal handlers let in-flight work finish before cleanup, preventing late writes.
    try {
      if (connected) await db.dropDatabase();
    } finally {
      try { await client.close(); }
      finally {
        process.off('SIGINT', interrupt);
        process.off('SIGTERM', interrupt);
      }
    }
  }
}
