import { once } from 'node:events';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApp } from './app.js';

test('consultation API validates, persists, and reports storage failures', async (context) => {
  const saved = [];
  const app = createApp(async (record) => {
    if (record.name === 'Storage failure') throw new Error('Test storage failure');
    saved.push(record);
  });
  const server = app.listen(0, '127.0.0.1');
  context.after(() => server.close());
  await once(server, 'listening');
  const origin = 'http://127.0.0.1:' + server.address().port;
  const post = (body) => fetch(origin + '/api/consultations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const valid = {
    name: ' Test Client ', email: 'test@example.com', service: 'Website Development',
    message: 'A test consultation message.', budget: '$5k – $15k',
  };

  assert.deepEqual(await (await fetch(origin + '/api/health')).json(), { status: 'ok' });
  assert.equal((await post({ ...valid, email: 'invalid' })).status, 400);
  assert.equal((await post({ ...valid, company_site: 'spam' })).status, 400);
  assert.equal((await post({ ...valid, service: 'invalid' })).status, 400);
  assert.equal(saved.length, 0);
  assert.equal((await post(valid)).status, 201);
  assert.equal(saved[0].name, 'Test Client');
  assert.equal(saved[0].budget, valid.budget);
  assert.ok(saved[0].createdAt instanceof Date);
  assert.equal((await post({ ...valid, name: 'Storage failure' })).status, 503);
  assert.equal(saved.length, 1);
});
