import { once } from 'node:events';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MongoClient } from 'mongodb';
import app from './app.js';
import { closeDatabase } from './db.js';

const uri = process.env.MONGODB_TEST_URI;
const testDatabase = 'lumarq_test_' + randomBytes(8).toString('hex');
const email = 'admin@example.test';
const password = randomBytes(24).toString('hex');

test('admin authentication, MongoDB CRUD, media and public content', { skip: !uri }, async context => {
  process.env.MONGODB_URI = uri;
  process.env.MONGODB_DB = testDatabase;
  process.env.ADMIN_JWT_SECRET = randomBytes(32).toString('hex');
  delete process.env.ADMIN_ORIGIN;
  const mongo = await MongoClient.connect(uri);
  context.after(async () => {
    await closeDatabase();
    await mongo.db(testDatabase).dropDatabase();
    await mongo.close();
  });

  const setup = () => execFileSync(process.execPath, ['backend/setup.js', '--reset-admin'], {
    env: { ...process.env, ADMIN_BOOTSTRAP_EMAIL: email, ADMIN_BOOTSTRAP_PASSWORD: password },
  });
  setup();
  const server = app.listen(0, '127.0.0.1');
  context.after(() => server.close());
  await once(server, 'listening');
  const origin = 'http://127.0.0.1:' + server.address().port;
  let cookie;
  const admin = (resource, method = 'GET', body, query = {}, extra = {}) => fetch(
    origin + '/api/admin?' + new URLSearchParams({ resource, ...query }),
    {
      method,
      headers: {
        ...(cookie && { Cookie: cookie }),
        ...(method !== 'GET' && { Origin: origin, 'Content-Type': 'application/json' }),
        ...extra,
      },
      ...(method !== 'GET' && { body: JSON.stringify(body ?? {}) }),
    },
  );

  assert.equal((await admin('consultations')).status, 401);
  assert.equal((await admin('session', 'POST', { email, password }, {}, { Origin: 'https://example.test' })).status, 403);
  assert.equal((await admin('session', 'POST', { email, password: 'wrong' })).status, 401);
  const signedIn = await admin('session', 'POST', { email, password });
  assert.equal(signedIn.status, 200);
  assert.deepEqual(await signedIn.json(), { email, displayName: '' });
  const setCookie = signedIn.headers.get('set-cookie');
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Strict/i);
  cookie = setCookie.split(';')[0];
  const [cookieName, token] = cookie.split('=');
  const altered = cookieName + '=' + token.replace(/\.(.)/, (_, char) => '.' + (char === 'a' ? 'b' : 'a'));
  assert.equal((await admin('services', 'GET', undefined, {}, { Cookie: altered })).status, 401);

  const seeded = await (await fetch(origin + '/api/content')).json();
  assert.equal(seeded.services.length, 6);
  assert.equal(seeded.works.length, 8);
  assert.equal(seeded.clients.length, 5);
  assert.equal('consultations' in seeded, false);
  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jXlEAAAAASUVORK5CYII=';
  assert.equal((await admin('media', 'POST', { base64: 'PHN2Zz4=' })).status, 400);
  const uploaded = await admin('media', 'POST', { base64: png });
  assert.equal(uploaded.status, 201);
  const { url } = await uploaded.json();
  const image = await fetch(origin + url);
  assert.equal(image.headers.get('content-type'), 'image/png');
  assert.equal(Buffer.from(await image.arrayBuffer()).toString('base64'), png);

  const service = { name: 'Managed service', description: 'Configured in admin', image: url, alt: 'Example',
    tags: '', metric: '', metricLabel: '', formLabel: 'Managed', order: 100 };
  assert.equal((await admin('services', 'POST', { ...service, image: 'javascript:alert(1)' })).status, 400);
  const created = await admin('services', 'POST', service);
  assert.equal(created.status, 201);
  const { _id } = await created.json();
  assert.equal((await admin('services', 'PUT', { ...service, description: 'Updated' }, { id: _id })).status, 204);

  for (let i = 1; i <= 11; i++) {
    const result = await admin('works', 'POST', { name: 'Filtered work ' + i, category: 'New category',
      description: '', image: '', alt: '', kpi: '', order: i });
    assert.equal(result.status, 201);
  }
  const secondPage = await (await admin('works', 'GET', undefined, {
    search: 'Filtered work', filter: 'New category', page: 2, size: 10,
  })).json();
  assert.equal(secondPage.total, 11);
  assert.equal(secondPage.rows.length, 1);
  const client = await admin('clients', 'POST', { name: 'New Client', role: 'Director',
    company: 'Example', quote: 'Excellent work.', rating: 4.5, image: url, order: 60 });
  assert.equal(client.status, 201);

  for (const [name, changes] of [['about', { count0: 22 }], ['settings', { logo: url, email: 'new@example.test' }]]) {
    const { _id: _key, ...data } = seeded[name];
    assert.equal((await admin(name, 'PUT', { ...data, ...changes })).status, 204);
  }
  const content = await (await fetch(origin + '/api/content')).json();
  assert.equal(content.about.count0, 22);
  assert.equal(content.settings.logo, url);
  assert.equal(content.services.find(row => row._id === _id).description, 'Updated');
  assert.equal(content.works.length, 19);
  assert.equal(content.clients.length, 6);
  const withImages = await admin('services', 'GET', undefined, { filter: 'With image' }).then(response => response.json());
  assert.ok(withImages.rows.every(row => row.image));
  const rated = await admin('clients', 'GET', undefined, { filter: '4 to 4.5 stars' }).then(response => response.json());
  assert.equal(rated.total, 2);

  const inquiry = await fetch(origin + '/api/consultations', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Customer', email: 'visitor@example.test', service: service.name, message: 'A real project request.' }),
  });
  assert.equal(inquiry.status, 201);
  const leads = await (await admin('consultations', 'GET', undefined, { filter: 'New' })).json();
  assert.equal(leads.total, 1);
  const lead = leads.rows[0];
  assert.equal((await admin('consultations', 'PUT', { status: 'Closed' }, { id: lead._id })).status, 204);
  assert.equal((await admin('consultations', 'GET', undefined, { filter: 'Closed' }).then(response => response.json())).total, 1);
  assert.equal((await admin('services', 'DELETE', {}, { id: _id })).status, 204);
  assert.equal((await admin('session', 'DELETE')).status, 204);
  assert.equal((await admin('services')).status, 401);

  setup();
  const reseeded = await (await fetch(origin + '/api/content')).json();
  assert.equal(reseeded.about.count0, 22);
  assert.equal(reseeded.services.length, 6);

  const previousEnvironment = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const secure = await admin('session', 'POST', { email, password }, {}, { Origin: origin.replace('http:', 'https:') });
    assert.equal(secure.status, 200);
    assert.match(secure.headers.get('set-cookie'), /^__Host-lumarq-admin=/);
    assert.match(secure.headers.get('set-cookie'), /; Secure/i);
  } finally {
    if (previousEnvironment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnvironment;
  }
  await mongo.db(testDatabase).collection('admin_login_limits').updateMany({}, { $set: { attempts: 12 } });
  assert.equal((await admin('session', 'POST', { email, password })).status, 429);
  await mongo.db(testDatabase).collection('admin_login_limits').deleteMany({});
  assert.equal((await admin('profile', 'PUT', { email, displayName: 'Admin', currentPassword: password })).status, 401);
  const fresh = await admin('session', 'POST', { email, password });
  cookie = fresh.headers.get('set-cookie').split(';')[0];
  assert.equal((await admin('profile', 'PUT', { email, displayName: 'Admin', currentPassword: 'incorrect' })).status, 400);
  const profile = await admin('profile', 'PUT', { email, displayName: 'Admin', currentPassword: password });
  assert.deepEqual(await profile.json(), { email, displayName: 'Admin', signInRequired: false });
  assert.deepEqual(await (await admin('session')).json(), { email, displayName: 'Admin' });
  const updatedEmail = 'new-admin@example.test';
  const updated = await admin('profile', 'PUT', { email: updatedEmail, displayName: 'Admin', currentPassword: password });
  assert.equal((await updated.json()).signInRequired, true);
  assert.equal((await admin('session')).status, 401);
  assert.equal((await admin('session', 'POST', { email, password })).status, 401);
  const signedBackIn = await admin('session', 'POST', { email: updatedEmail, password });
  cookie = signedBackIn.headers.get('set-cookie').split(';')[0];
  const newPassword = randomBytes(24).toString('hex');
  const changed = await admin('password', 'PUT', { currentPassword: password, newPassword });
  assert.equal((await changed.json()).signInRequired, true);
  assert.equal((await admin('session')).status, 401);
  assert.equal((await admin('session', 'POST', { email: updatedEmail, password })).status, 401);
  assert.equal((await admin('session', 'POST', { email: updatedEmail, password: newPassword })).status, 200);

});
