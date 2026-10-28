import express from 'express';
import { Leaderboard } from './models/Leaderboard.js';
import { registerGameRoutes } from './game.js';
import { createAuthRouter } from './routes/auth.js';
import * as defaultMailer from './utils/mailer.js';
import { errorHandler, notFound } from './middleware/errors.js';

// Pass { mailer } to replace email delivery (tests use a mock); other options go to the game routes.
export function createApp(db, { mailer = defaultMailer, ...gameOptions } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));
  registerGameRoutes(app, db, gameOptions);

  app.get('/api/health', async (_req, res) => {
    try {
      await db.command({ ping: 1 });
      res.json({ status: 'ok', database: 'connected' });
    } catch {
      res.status(503).json({ error: 'Database unavailable' });
    }
  });

  app.get('/api/leaderboard', async (req, res, next) => {
    try {
      const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        return res.status(400).json({ error: 'limit must be an integer from 1 to 100' });
      }
      res.json({ players: await new Leaderboard(db).bestAttempts(limit) });
    }
    catch (error) { next(error); }
  });

  app.get('/api/items', async (_req, res, next) => {
    try {
      const items = await db.collection('items').find({})
        .sort({ _id: -1 }).limit(100).toArray();
      res.json({ items });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/items', async (req, res, next) => {
    const name = req.body?.name;
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) {
      return res.status(400).json({ error: 'name must be a string of 1 to 100 characters' });
    }
    try {
      const item = { name: name.trim(), createdAt: new Date() };
      const result = await db.collection('items').insertOne(item);
      res.status(201).json({ ...item, _id: result.insertedId });
    } catch (error) {
      next(error);
    }
  });

  app.use('/api', createAuthRouter(db, mailer));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
