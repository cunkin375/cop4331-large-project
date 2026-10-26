import { createHash, randomBytes } from 'node:crypto';
import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { User, hashPassword } from '../models/User.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { HttpError, asyncHandler } from '../middleware/errors.js';

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;
// Password length follows the existing User model (12–128 characters).
const PASSWORD_MIN = 12;
const PASSWORD_MAX = 128;
const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RESEND_MESSAGE = 'If that account exists and is unverified, a new verification email has been sent.';
const FORGOT_MESSAGE = 'If an account with that email exists, a password reset email has been sent.';

// Only SHA-256 hashes of tokens are stored; the raw token goes out by email.
const hashToken = token => createHash('sha256').update(token).digest('hex');

function issueToken(ttlMs) {
  const token = randomBytes(32).toString('hex');
  return { token, hash: hashToken(token), expires: new Date(Date.now() + ttlMs) };
}

const isFilled = value => typeof value === 'string' && value.trim() !== '';

function requireFields(body, fields) {
  const missing = fields.filter(field => !isFilled(body?.[field]));
  if (missing.length) throw new HttpError(400, `Missing required field(s): ${missing.join(', ')}`);
}

function normalizeEmail(email) {
  const value = email.trim().toLowerCase();
  if (value.length > 254 || !EMAIL_PATTERN.test(value)) throw new HttpError(400, 'A valid email is required');
  return value;
}

function checkPassword(password) {
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    throw new HttpError(400, `Password must contain ${PASSWORD_MIN}–${PASSWORD_MAX} characters`);
  }
}

// Email delivery failures are logged, never exposed, so responses stay uniform.
function deliver(sending) {
  Promise.resolve().then(sending).catch(error => console.error('Email delivery failed:', error.name));
}

const publicUser = user => ({ id: String(user._id), username: user.username, email: user.email });

export function createAuthRouter(db, mailer) {
  const router = Router();
  const users = () => db.collection('users');

  router.post('/register', asyncHandler(async (req, res) => {
    requireFields(req.body, ['username', 'email', 'password']);
    const username = req.body.username.trim();
    if (!USERNAME_PATTERN.test(username)) {
      throw new HttpError(400, 'Username must contain 3–20 letters, digits, or underscores');
    }
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;
    checkPassword(password);

    const created = await new User(db).create({ username, email, password });
    const verify = issueToken(VERIFY_TTL_MS);
    await users().updateOne({ _id: created._id }, { $set: {
      emailVerified: false, verifyTokenHash: verify.hash, verifyTokenExpires: verify.expires,
      updatedAt: new Date(),
    } });
    const user = { _id: created._id, username, email };
    deliver(() => mailer.sendVerificationEmail(user, verify.token));
    res.status(201).json({
      message: 'Account created. Check your email to verify your address before logging in.',
      user: publicUser(user),
    });
  }));

  router.get('/verify-email', asyncHandler(async (req, res) => {
    const { token } = req.query;
    if (!isFilled(token)) throw new HttpError(400, 'Missing required field(s): token');
    const result = await users().findOneAndUpdate(
      { verifyTokenHash: hashToken(token), verifyTokenExpires: { $gt: new Date() } },
      { $set: { emailVerified: true, updatedAt: new Date() },
        $unset: { verifyTokenHash: '', verifyTokenExpires: '' } },
    );
    if (!result) throw new HttpError(400, 'Verification link is invalid or has expired');
    res.json({ message: 'Email verified. You can now log in.' });
  }));

  router.post('/resend-verification', asyncHandler(async (req, res) => {
    requireFields(req.body, ['email']);
    const email = normalizeEmail(req.body.email);
    const verify = issueToken(VERIFY_TTL_MS);
    const user = await users().findOneAndUpdate(
      { email, emailVerified: false },
      { $set: { verifyTokenHash: verify.hash, verifyTokenExpires: verify.expires, updatedAt: new Date() } },
      { projection: { username: 1, email: 1 } },
    );
    if (user) deliver(() => mailer.sendVerificationEmail(user, verify.token));
    res.json({ message: RESEND_MESSAGE });
  }));

  router.post('/login', asyncHandler(async (req, res) => {
    const identifier = isFilled(req.body?.email) ? req.body.email : req.body?.username;
    if (!isFilled(identifier) || !isFilled(req.body?.password)) {
      throw new HttpError(400, 'Missing required field(s): username or email, password');
    }
    const login = identifier.trim().toLowerCase();
    const found = await users().findOne(
      login.includes('@') ? { email: login } : { usernameKey: login },
      { projection: { email: 1, emailVerified: 1 } },
    );
    // authenticate() still runs a hash when no user matched, keeping timing uniform.
    const user = await new User(db).authenticate(found?.email ?? '', req.body.password);
    if (!user) throw new HttpError(401, 'Invalid username/email or password');
    // Accounts created before email verification existed have no flag and may log in.
    if (found.emailVerified === false) {
      throw new HttpError(403, 'Verify your email before logging in');
    }
    res.json({ token: signToken(user), user: publicUser({ ...user, email: found.email }) });
  }));

  router.post('/forgot-password', asyncHandler(async (req, res) => {
    requireFields(req.body, ['email']);
    const email = normalizeEmail(req.body.email);
    const reset = issueToken(RESET_TTL_MS);
    const user = await users().findOneAndUpdate(
      { email },
      { $set: { resetTokenHash: reset.hash, resetTokenExpires: reset.expires, updatedAt: new Date() } },
      { projection: { username: 1, email: 1 } },
    );
    if (user) deliver(() => mailer.sendResetEmail(user, reset.token));
    res.json({ message: FORGOT_MESSAGE });
  }));

  router.post('/reset-password', asyncHandler(async (req, res) => {
    requireFields(req.body, ['token', 'password']);
    const { token, password } = req.body;
    checkPassword(password);
    const result = await users().findOneAndUpdate(
      { resetTokenHash: hashToken(token), resetTokenExpires: { $gt: new Date() } },
      { $set: { passwordHash: await hashPassword(password), updatedAt: new Date() },
        $unset: { resetTokenHash: '', resetTokenExpires: '' } },
    );
    if (!result) throw new HttpError(400, 'Reset link is invalid or has expired');
    res.json({ message: 'Password updated. You can now log in.' });
  }));

  router.get('/me', requireAuth, asyncHandler(async (req, res) => {
    const user = await users().findOne(
      { _id: new ObjectId(req.user.id) },
      { projection: { username: 1, email: 1 } },
    );
    if (!user) throw new HttpError(404, 'User not found');
    res.json(publicUser(user));
  }));

  return router;
}
