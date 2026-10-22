import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApp } from './app.js';

async function withApi(db, run) {
  const server = createApp(db).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

test('health pings MongoDB and reports outages', async () => {
  for (const available of [true, false]) {
    await withApi({ command: async command => {
      assert.deepEqual(command, { ping: 1 });
      if (!available) throw new Error('offline');
    } }, async url => {
      const response = await fetch(`${url}/api/health`);
      assert.equal(response.status, available ? 200 : 503);
    });
  }
});

test('creates a trimmed item and reads through the collection', async () => {
  const records = [];
  const db = { collection(name) {
    assert.equal(name, 'items');
    return {
      async insertOne(item) {
        records.push({ ...item, _id: 'test-id' });
        return { insertedId: 'test-id' };
      },
      find(query) {
        assert.deepEqual(query, {});
        return { sort(order) {
          assert.deepEqual(order, { _id: -1 });
          return { limit(count) {
            assert.equal(count, 100);
            return { toArray: async () => records };
          } };
        } };
      },
    };
  } };
  await withApi(db, async url => {
    const response = await fetch(`${url}/api/items`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: ' Example ', ignored: true }),
    });
    assert.equal(response.status, 201);
    const item = await response.json();
    assert.equal(item.name, 'Example');
    assert.equal(item._id, 'test-id');
    assert.equal(item.ignored, undefined);
    assert.ok(item.createdAt);
    const listed = await fetch(`${url}/api/items`);
    assert.deepEqual(await listed.json(), { items: [item] });
  });
});

test('rejects invalid input and malformed JSON without database calls', async () => {
  await withApi({}, async url => {
    for (const body of [{}, { name: '' }, { name: { $ne: null } }, { name: 'x'.repeat(101) }]) {
      const response = await fetch(`${url}/api/items`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      assert.equal(response.status, 400);
    }
    const malformed = await fetch(`${url}/api/items`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{',
    });
    assert.equal(malformed.status, 400);
    assert.equal((await fetch(`${url}/missing`)).status, 404);
  });
});

test('database errors return generic JSON', async () => {
  await withApi({ collection() { throw new Error('secret'); } }, async url => {
    const response = await fetch(`${url}/api/items`);
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: 'Unable to complete request' });
  });
});
