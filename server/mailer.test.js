import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sendVerificationEmail, sendResetEmail } from './utils/mailer.js';

test('Mailgun HTTPS delivery and safe failures', async t => {
  const originalEnv = { ...process.env };
  t.after(() => { process.env = originalEnv; });
  for (const [key, value] of Object.entries({ API_KEY: 'test-key', MAILGUN_DOMAIN: 'mg.example.com', MAIL_FROM: 'App <mail@mg.example.com>', CLIENT_URL: 'https://example.com/', MAILGUN_API_URL: 'https://api.mailgun.net' })) {
    process.env[key] = value;
  }
  const calls = [];
  const fetchMock = t.mock.method(globalThis, 'fetch', async (...args) => {
    calls.push(args);
    return { ok: true, json: async () => ({ id: 'queued' }) };
  });
  const user = { username: 'Alice', email: 'alice@example.com' };
  assert.deepEqual(await sendVerificationEmail(user, 'a+b'), { id: 'queued' });
  await sendResetEmail(user, 'reset');
  const [url, request] = calls[0];
  assert.equal(url, 'https://api.mailgun.net/v3/mg.example.com/messages');
  assert.equal(request.method, 'POST');
  assert.equal(request.headers.Authorization, `Basic ${Buffer.from('api:test-key').toString('base64')}`);
  assert.equal(request.body.get('to'), user.email);
  assert.match(request.body.get('text'), /https:\/\/example.com\/verify-email\?token=a%2Bb/);
  assert.match(calls[1][1].body.get('text'), /reset-password\?token=reset/);
  fetchMock.mock.mockImplementation(async () => ({ ok: false, status: 401 }));
  await assert.rejects(sendResetEmail(user, 'secret'), { name: 'MailgunHTTP401Error', message: 'Mailgun request failed (HTTP 401)' });
  process.env.API_KEY = ''; 
  await assert.rejects(sendResetEmail(user, 'secret'), /API_KEY is not configured/);
});
