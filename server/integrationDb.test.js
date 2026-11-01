import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runIntegration } from './integrationDb.js';

function testConfig(t, name) {
  const original = process.env.MONGODB_DB;
  if (name === undefined) delete process.env.MONGODB_DB;
  else process.env.MONGODB_DB = name;
  t.after(() => {
    if (original === undefined) delete process.env.MONGODB_DB;
    else process.env.MONGODB_DB = original;
  });
}

test('integration scripts reject live or unspecified databases before connecting', async t => {
  testConfig(t, undefined);
  for (const name of [undefined, '', 'blackjack', 'test', 'blackjack_test/other']) {
    if (name === undefined) delete process.env.MONGODB_DB;
    else process.env.MONGODB_DB = name;
    await assert.rejects(runIntegration(() => assert.fail('must not run'), () => assert.fail('must not connect')), /MONGODB_DB=blackjack_test/);
  }
});

test('isolated test databases are dropped after success, errors, and interruption', async t => {
  testConfig(t, 'blackjack_test');
  const names = [];
  for (const outcome of ['success', 'error', 'SIGINT', 'SIGTERM']) {
    const events = [];
    const db = {
      collection: () => ({ createIndex: async () => {} }),
      listCollections: () => ({ hasNext: async () => true }),
      command: async () => {},
      dropDatabase: async () => events.push('drop'),
    };
    const client = {
      db(name) { names.push(name); return db; },
      connect: async () => events.push('connect'),
      close: async () => events.push('close'),
    };
    const run = runIntegration(async (_db, signal) => {
      if (outcome === 'error') throw new Error('test failure');
      if (outcome.startsWith('SIG')) {
        process.emit(outcome);
        assert.ok(signal.aborted);
        await Promise.resolve();
      }
      events.push('work finished');
    }, () => client);
    if (outcome === 'success') await run;
    else await assert.rejects(run, /test failure|interrupted/);
    assert.deepEqual(events.slice(-2), ['drop', 'close']);
  }
  assert.equal(new Set(names).size, 4);
  assert.ok(names.every(name => name !== 'blackjack_test' && name.endsWith('_test')));
});
