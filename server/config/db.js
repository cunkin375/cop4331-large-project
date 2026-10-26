import { MongoClient } from 'mongodb';
import { initializeModels } from '../models/index.js';

// Connects, pings, and prepares collections/indexes before the API starts.
export async function connectDb(uri, dbName) {
  if (!uri) throw new Error('A MongoDB connection string is required');
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    const db = client.db(dbName);
    await db.command({ ping: 1 });
    await initializeModels(db);
    return { client, db };
  } catch (error) {
    await client.close();
    throw error;
  }
}
