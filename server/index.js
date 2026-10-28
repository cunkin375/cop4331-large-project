import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { requireAuth } from './middleware/auth.js';

// Environment is loaded by Node's --env-file flag in package.json.
const uri = process.env.MONGODB_URI;
const database = process.env.MONGODB_DB || 'mern_lab';
const port = Number(process.env.PORT || 5000);

if (!uri) {
  console.error('Set MONGODB_URI in .env (see .env.example).');
  process.exit(1);
}
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PORT must be an integer between 1 and 65535.');
  process.exit(1);
}
let connection;
try {
  connection = await connectDb(uri, database);
} catch {
  console.error('Unable to connect to MongoDB. Check MONGODB_URI and database availability.');
  process.exit(1);
}

const { client, db } = connection;
const server = createApp(db, { requireAuth }).listen(port, '127.0.0.1', () => {
  console.log(`API listening at http://127.0.0.1:${port}`);
});
server.on('error', async () => {
  console.error('Unable to start API listener. Check whether PORT is in use.');
  await client.close();
  process.exitCode = 1;
});
let stopping = false;
const shutdown = () => {
  if (stopping) return;
  stopping = true;
  server.close(async () => {
    await client.close();
  });
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
