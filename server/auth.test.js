import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { ObjectId } from 'mongodb';
import { createApp } from './app.js';

process.env.JWT_SECRET ||= 'test-only-jwt-secret';

const sha256 = token => createHash('sha256').update(token).digest('hex');
const PASSWORD = 'correct-horse-battery';
const alice = { username: 'alice_1', email: 'Alice@Example.com', password: PASSWORD };

// In-memory stand-in for the users collection, covering only the queries auth uses.
function fakeDb() {
  const docs = [];
  const equal = (a, b) => (a instanceof ObjectId ? a.equals(b) : a === b);
  const matches = (doc, filter) => Object.entries(filter).every(([key, value]) =>
    value?.$gt !== undefined ? doc[key] > value.$gt : equal(doc[key], value));
  const find = filter => docs.find(doc => matches(doc, filter));
  const apply = (doc, { $set = {}, $unset = {} }) => {
    Object.assign(doc, $set);
    for (const key of Object.keys($unset)) delete doc[key];
  };
  const users = {
    docs,
    async insertOne(doc) {
      for (const key of ['email', 'usernameKey']) {
        if (docs.some(existing => existing[key] === doc[key])) {
          throw Object.assign(new Error('duplicate key'), { code: 11000, keyPattern: { [key]: 1 } });
        }
      }
      const _id = new ObjectId();
      docs.push({ ...doc, _id });
      return { insertedId: _id };
    },
    async findOne(filter) {
      const doc = find(filter);
      return doc ? { ...doc } : null;
    },
    async updateOne(filter, update) {
      const doc = find(filter);
      if (doc) apply(doc, update);
    },
    async findOneAndUpdate(filter, update) {
      const doc = find(filter);
      if (!doc) return null;
      const before = { ...doc };
      apply(doc, update);
      return before;
    },
  };
  return { users, collection: name => (assert.equal(name, 'users'), users) };
}

async function withAuthApi(run) {
  const db = fakeDb();
  const mail = { verification: [], reset: [] };
  const mailer = {
    sendVerificationEmail: async (user, token) => mail.verification.push({ user, token }),
    sendResetEmail: async (user, token) => mail.reset.push({ user, token }),
  };
  const server = createApp(db, { mailer }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const call = async (method, path, body, token) => {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body && JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() };
  };
  const api = {
    post: (path, body) => call('POST', path, body),
    get: (path, token) => call('GET', path, undefined, token),
    verify: token => call('GET', `/verify-email?token=${encodeURIComponent(token)}`),
    lastVerifyToken: () => mail.verification.at(-1).token,
    lastResetToken: () => mail.reset.at(-1).token,
  };
  try {
    await run(api, db.users.docs, mail);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

async function registerAndVerify(api) {
  assert.equal((await api.post('/register', alice)).status, 201);
  assert.equal((await api.verify(api.lastVerifyToken())).status, 200);
}

test('register creates an unverified user, stores only the token hash, and sends email', async () => {
  await withAuthApi(async (api, users, mail) => {
    const res = await api.post('/register', alice);
    assert.equal(res.status, 201);
    assert.equal(res.body.user.username, 'alice_1');
    assert.equal(res.body.user.email, 'alice@example.com');
    assert.equal(res.body.token, undefined);

    assert.equal(mail.verification.length, 1);
    const { token } = mail.verification[0];
    const [stored] = users;
    assert.equal(stored.emailVerified, false);
    assert.equal(stored.verifyTokenHash, sha256(token));
    assert.ok(stored.verifyTokenExpires > new Date(Date.now() + 23 * 3600 * 1000));
    assert.ok(!stored.passwordHash.includes(PASSWORD));
  });
});

test('register rejects missing fields and invalid values with 400', async () => {
  await withAuthApi(async (api, users) => {
    const missing = await api.post('/register', { username: 'bob_1' });
    assert.equal(missing.status, 400);
    assert.match(missing.body.error, /email, password/);
    for (const body of [
      { ...alice, username: 'ab' }, { ...alice, username: 'a'.repeat(21) },
      { ...alice, email: 'not-an-email' }, { ...alice, password: 'short' },
      { ...alice, username: { $ne: null } },
    ]) {
      assert.equal((await api.post('/register', body)).status, 400);
    }
    assert.equal(users.length, 0);
  });
});

test('duplicate register returns 409 naming the field', async () => {
  await withAuthApi(async api => {
    assert.equal((await api.post('/register', alice)).status, 201);
    const dupUsername = await api.post('/register', { ...alice, username: 'ALICE_1', email: 'other@example.com' });
    assert.equal(dupUsername.status, 409);
    assert.match(dupUsername.body.error, /username/);
    const dupEmail = await api.post('/register', { ...alice, username: 'alice_2', email: 'alice@EXAMPLE.com' });
    assert.equal(dupEmail.status, 409);
    assert.match(dupEmail.body.error, /email/);
  });
});

test('verify-email marks the user verified and rejects bad or expired tokens', async () => {
  await withAuthApi(async (api, users) => {
    assert.equal((await api.post('/register', alice)).status, 201);
    const token = api.lastVerifyToken();
    assert.equal((await api.get('/verify-email')).status, 400);
    assert.equal((await api.verify('nope')).status, 400);

    users[0].verifyTokenExpires = new Date(Date.now() - 1000);
    assert.equal((await api.verify(token)).status, 400);
    users[0].verifyTokenExpires = new Date(Date.now() + 60000);

    assert.equal((await api.verify(token)).status, 200);
    assert.equal(users[0].emailVerified, true);
    assert.equal(users[0].verifyTokenHash, undefined);
    assert.equal(users[0].verifyTokenExpires, undefined);
    assert.equal((await api.verify(token)).status, 400);
  });
});

test('resend-verification is generic and issues a working token', async () => {
  await withAuthApi(async (api, _users, mail) => {
    const unknown = await api.post('/resend-verification', { email: 'nobody@example.com' });
    assert.equal(unknown.status, 200);
    assert.equal(mail.verification.length, 0);

    await api.post('/register', alice);
    const resent = await api.post('/resend-verification', { email: alice.email });
    assert.deepEqual(resent.body, unknown.body);
    assert.equal(mail.verification.length, 2);
    assert.equal((await api.verify(api.lastVerifyToken())).status, 200);

    const verified = await api.post('/resend-verification', { email: alice.email });
    assert.deepEqual(verified.body, unknown.body);
    assert.equal(mail.verification.length, 2);
  });
});

test('login is 403 before verification and returns a JWT after', async () => {
  await withAuthApi(async api => {
    await api.post('/register', alice);
    const blocked = await api.post('/login', { username: 'alice_1', password: PASSWORD });
    assert.equal(blocked.status, 403);
    assert.equal(blocked.body.token, undefined);

    assert.equal((await api.verify(api.lastVerifyToken())).status, 200);
    const byUsername = await api.post('/login', { username: 'ALICE_1', password: PASSWORD });
    assert.equal(byUsername.status, 200);
    const byEmail = await api.post('/login', { email: 'alice@example.com', password: PASSWORD });
    assert.equal(byEmail.status, 200);

    const me = await api.get('/me', byEmail.body.token);
    assert.equal(me.status, 200);
    assert.deepEqual(Object.keys(me.body).sort(), ['email', 'id', 'username']);
    assert.equal(me.body.username, 'alice_1');
  });
});

test('login is 401 for a bad password or unknown user', async () => {
  await withAuthApi(async api => {
    await registerAndVerify(api);
    const bad = await api.post('/login', { username: 'alice_1', password: 'wrong-password-123' });
    const unknown = await api.post('/login', { username: 'nobody', password: PASSWORD });
    assert.equal(bad.status, 401);
    assert.equal(unknown.status, 401);
    assert.deepEqual(bad.body, unknown.body);
    assert.equal((await api.post('/login', { password: PASSWORD })).status, 400);
  });
});

test('/api/me requires a valid bearer token', async () => {
  await withAuthApi(async api => {
    assert.equal((await api.get('/me')).status, 401);
    assert.equal((await api.get('/me', 'not-a-jwt')).status, 401);
  });
});

test('forgot-password responds identically for unknown and known emails', async () => {
  await withAuthApi(async (api, users, mail) => {
    await registerAndVerify(api);
    const unknown = await api.post('/forgot-password', { email: 'nobody@example.com' });
    assert.equal(unknown.status, 200);
    assert.equal(mail.reset.length, 0);
    const known = await api.post('/forgot-password', { email: alice.email });
    assert.deepEqual(known.body, unknown.body);
    assert.equal(mail.reset.length, 1);
    assert.equal(users[0].resetTokenHash, sha256(api.lastResetToken()));
    assert.ok(users[0].resetTokenExpires <= new Date(Date.now() + 3600 * 1000));
  });
});

test('reset-password changes the password once and rejects bad or expired tokens', async () => {
  await withAuthApi(async (api, users) => {
    await registerAndVerify(api);
    await api.post('/forgot-password', { email: alice.email });
    const token = api.lastResetToken();
    const newPassword = 'brand-new-password-42';

    assert.equal((await api.post('/reset-password', { token, password: 'short' })).status, 400);
    assert.equal((await api.post('/reset-password', { token: 'wrong', password: newPassword })).status, 400);
    assert.equal((await api.post('/reset-password', { password: newPassword })).status, 400);

    users[0].resetTokenExpires = new Date(Date.now() - 1000);
    assert.equal((await api.post('/reset-password', { token, password: newPassword })).status, 400);
    users[0].resetTokenExpires = new Date(Date.now() + 60000);

    assert.equal((await api.post('/reset-password', { token, password: newPassword })).status, 200);
    assert.equal(users[0].resetTokenHash, undefined);
    assert.equal(users[0].resetTokenExpires, undefined);
    assert.equal((await api.post('/login', { username: 'alice_1', password: PASSWORD })).status, 401);
    assert.equal((await api.post('/login', { username: 'alice_1', password: newPassword })).status, 200);
    assert.equal((await api.post('/reset-password', { token, password: 'another-password-99' })).status, 400);
  });
});
