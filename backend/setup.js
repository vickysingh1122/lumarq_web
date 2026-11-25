import { randomBytes } from 'node:crypto';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import initial from '../frontend/src/initialContent.json' with { type: 'json' };
import { contentSchemas } from './content.js';
import { hashPassword } from './adminAuth.js';
import { closeDatabase, getDatabase } from './db.js';
import { modules } from '../frontend/src/contentCatalog.js';

async function setup() {
  const resetAdmin = process.argv.includes('--reset-admin');
  const email = z.string().trim().toLowerCase().email().max(254).safeParse(process.env.ADMIN_BOOTSTRAP_EMAIL);
  const password = z.string().min(14).max(256).safeParse(process.env.ADMIN_BOOTSTRAP_PASSWORD);
  if (resetAdmin && (!email.success || !password.success)) {
    if (!email.success) console.error('Set ADMIN_BOOTSTRAP_EMAIL to a valid email address in the root .env.');
    if (!password.success) console.error('Set ADMIN_BOOTSTRAP_PASSWORD to a password of 14–256 characters in the root .env.');
    process.exitCode = 1;
    return;
  }

  const db = await getDatabase();
  await Promise.all([
    db.collection('admin_users').createIndex({ email: 1 }, { unique: true }),
    db.collection('admin_sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection('admin_sessions').createIndex({ adminId: 1 }),
    db.collection('admin_login_limits').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection('consultations').createIndex({ createdAt: -1, _id: -1 }),
    db.collection('consultations').createIndex({ status: 1, createdAt: -1, _id: -1 }),
    ...['services', 'works', 'clients'].flatMap(name => [
      db.collection(name).createIndex({ order: 1, _id: 1 }),
      db.collection(name).createIndex({ name: 1, _id: 1 }),
    ]),
    db.collection('works').createIndex({ category: 1, order: 1, _id: 1 }),
  ]);
  if (!await db.collection('content_meta').findOne({ _id: 'site' })) {
    const now = new Date();
    for (const [name, value] of Object.entries(initial)) {
      const records = Array.isArray(value) ? value : [value];
      const collection = db.collection(name);
      await collection.bulkWrite(records.map(record => {
        const clean = Object.fromEntries(modules[name].fields.map(([key]) => [key, record[key]]));
        const fields = contentSchemas[name].parse(clean);
        return {
          updateOne: {
            filter: { _id: record._id },
            update: { $setOnInsert: { ...fields, createdAt: now, updatedAt: now } },
            upsert: true,
          },
        };
      }));
    }
    await db.collection('content_meta').updateOne({ _id: 'site' },
      { $setOnInsert: { schemaVersion: 1, createdAt: now } }, { upsert: true });
  }
  console.log('Content and indexes are ready.');

  if (resetAdmin) {
    const admins = db.collection('admin_users');
    const user = await admins.findOneAndUpdate({ email: email.data }, {
      $set: { passwordHash: await hashPassword(password.data), credentialVersion: randomBytes(16).toString("hex"), active: true, updatedAt: new Date() },
      $setOnInsert: { _id: new ObjectId().toHexString(), createdAt: new Date() },
    }, { upsert: true, returnDocument: 'after', projection: { _id: 1 } });
    await db.collection('admin_sessions').deleteMany({ adminId: user._id });
    console.log('Admin credentials saved. Previous sessions revoked.');
  }
}

try {
  await setup();
} catch (error) {
  console.error('Database setup failed:', error.name, error.code ?? '');
  process.exitCode = 1;
} finally {
  await closeDatabase().catch(() => {});
}
