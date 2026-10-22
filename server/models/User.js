import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCallback);

// All monetary amounts use integer cents. Earnings are net winnings minus losses.
export class User {
  constructor(db) { this.collection = db.collection('users'); }

  async create({ username, email, password }) {
    if (typeof username !== 'string' || !/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      throw new TypeError('Username must contain 3–30 letters, digits, or underscores');
    }
    if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new TypeError('A valid email is required');
    }
    if (typeof password !== 'string' || password.length < 12 || password.length > 128) {
      throw new TypeError('Password must contain 12–128 characters');
    }
    const salt = randomBytes(16).toString('hex');
    const hash = (await scrypt(password, salt, 64)).toString('hex');
    const now = new Date();
    const user = {
      username, usernameKey: username.toLowerCase(), email: email.trim().toLowerCase(),
      passwordHash: `scrypt:${salt}:${hash}`, earningsCents: 0,
      gamesPlayed: 0, wins: 0, losses: 0, pushes: 0, createdAt: now, updatedAt: now,
    };
    const { insertedId } = await this.collection.insertOne(user);
    return { _id: insertedId, username, earningsCents: 0 };
  }

  async authenticate(email, password) {
    if (typeof email !== 'string' || typeof password !== 'string' || password.length > 128) return null;
    const user = await this.collection.findOne({ email: email.trim().toLowerCase() });
    const [, salt, stored] = (user?.passwordHash || `scrypt:${'0'.repeat(32)}:${'0'.repeat(128)}`).split(':');
    const candidate = await scrypt(password, salt, 64);
    if (!timingSafeEqual(candidate, Buffer.from(stored, 'hex')) || !user) return null;
    return { _id: user._id, username: user.username, earningsCents: user.earningsCents };
  }

  // Trusted game server only: never accept earnings directly from a browser.
  async recordGame(userId, netEarningsCents) {
    if (!Number.isSafeInteger(netEarningsCents) || Math.abs(netEarningsCents) > 100000000) {
      throw new TypeError('Game earnings must be integer cents within the allowed range');
    }
    const outcome = netEarningsCents > 0 ? 'wins' : netEarningsCents < 0 ? 'losses' : 'pushes';
    return this.collection.findOneAndUpdate({ _id: userId }, {
      $inc: { earningsCents: netEarningsCents, gamesPlayed: 1, [outcome]: 1 },
      $set: { updatedAt: new Date() },
    }, { returnDocument: 'after', projection: { passwordHash: 0, email: 0, usernameKey: 0 } });
  }
}
