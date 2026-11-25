import { createHash } from 'node:crypto';
import express from 'express';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { modules, statuses } from '../frontend/src/contentCatalog.js';
import { accountDetails, adminSession, allowAdminOrigin, login, logout, updateAccount } from './adminAuth.js';
import { getDatabase } from './db.js';

const lists = ['services', 'works', 'clients'];
const singleton = ['about', 'settings'];
const publicModules = [...lists, ...singleton];
const bodyLimit = '3mb';
const imageLimit = 2 * 1024 * 1024;
const objectId = /^[a-f0-9]{24}$/;
const imageId = /^[a-f0-9]{64}$/;

const imagePath = z.string().max(2048).refine(value => {
  if (!value || /^\/img\/[a-z0-9][a-z0-9_.-]*$/i.test(value) ||
      /^\/api\/media\?id=[a-f0-9]{64}$/.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}, 'Use an uploaded image or an HTTPS image URL.');

const fields = {
  required: z.string().trim().min(1).max(160),
  text: z.string().trim().max(300),
  textarea: z.string().trim().max(6000),
  image: imagePath,
  category: z.string().trim().min(1).max(50),
  order: z.number().int().min(0).max(10000),
  count: z.number().min(0).max(1e9).multipleOf(0.01),
  rating: z.number().min(0).max(5).multipleOf(0.5),
  email: z.union([z.email().max(254), z.literal('')]),
  phone: z.string().trim().max(50).regex(/^[+\d(). x-]*$/i),
};

export const contentSchemas = Object.fromEntries(publicModules.map(resource => [
  resource, z.strictObject(Object.fromEntries(modules[resource].fields.map(
    ([name, , type]) => [name, fields[type]],
  ))),
]));

const filters = Object.freeze({
  services: ['name', 'description', 'tags'],
  works: ['name', 'category', 'description'],
  clients: ['name', 'company', 'role'],
  consultations: ['name', 'email', 'service', 'message'],
});
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const stringQuery = (input) => typeof input === 'string' ? input.trim() : '';
const serialized = (document) => ({ ...document, _id: document._id.toString() });
const publicProjection = { createdAt: 0, updatedAt: 0 };
const listOrder = { order: 1, _id: 1 };

async function getList(db, req, res, resource) {
  const collection = db.collection(resource);
  const { filter, search, page, size, sort } = req.query;
  const term = stringQuery(search).slice(0, 100);
  const selected = stringQuery(filter).slice(0, 50);
  const requestedPage = Math.max(1, Math.min(10000, Math.trunc(Number(page) || 1)));
  const pageSize = [10, 25, 50].includes(Number(size)) ? Number(size) : 10;
  const match = {};
  if (term) {
    const expression = new RegExp(escapeRegex(term), 'i');
    match.$or = filters[resource].map(field => ({ [field]: expression }));
  }
  if (selected && resource === 'works') match.category = selected;
  if (resource === 'services') {
    if (selected === 'With image') match.image = { $exists: true, $nin: ['', null] };
    if (selected === 'Without image') match.image = { $in: ['', null] };
  }
  if (resource === 'clients') {
    if (selected === modules.clients.options[0]) match.rating = 5;
    if (selected === modules.clients.options[1]) match.rating = { $gte: 4, $lt: 5 };
    if (selected === modules.clients.options[2]) match.rating = { $lt: 4 };
  }
  if (statuses.includes(selected) && resource === 'consultations') {
    match.status = selected === 'New' ? { $in: ['New', null] } : selected;
  }
  const sorting = sort === 'name'
    ? { name: 1, _id: 1 }
    : resource === 'consultations' || sort === 'recent' ? { createdAt: -1, _id: -1 } : listOrder;
  const total = await collection.countDocuments(match);
  const currentPage = Math.min(requestedPage, Math.max(1, Math.ceil(total / pageSize)));
  const [documents, options] = await Promise.all([
    collection.find(match).sort(sorting).skip((currentPage - 1) * pageSize).limit(pageSize).toArray(),
    resource === 'works' ? collection.distinct('category') : Promise.resolve(modules[resource].options || []),
  ]);
  return res.json({
    rows: documents.map(document => {
      const row = serialized(document);
      return resource === 'consultations' ? { ...row, status: row.status || 'New' } : row;
    }),
    total, page: currentPage, size: pageSize, options,
  });
}

function detectedImage(buffer) {
  if (buffer.length < 16) return null;
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) return 'image/jpeg';
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

async function uploadImage(db, req, res) {
  const encoded = req.body?.base64;
  if (typeof encoded !== 'string' || encoded.length > Math.ceil(imageLimit / 3) * 4 ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
    return res.status(400).json({ error: 'Choose a JPEG, PNG or WebP file up to 2 MB.' });
  }
  const bytes = Buffer.from(encoded, 'base64');
  const mime = detectedImage(bytes);
  if (!mime || bytes.length > imageLimit) {
    return res.status(400).json({ error: 'Choose a JPEG, PNG or WebP file up to 2 MB.' });
  }
  const id = createHash('sha256').update(bytes).digest('hex');
  await db.collection('media').updateOne({ _id: id },
    { $setOnInsert: { mime, bytes, createdAt: new Date() } }, { upsert: true });
  return res.status(201).json({ url: '/api/media?id=' + id });
}

async function writeResource(db, req, res, resource) {
  const collection = db.collection(resource);
  const isSingle = singleton.includes(resource);
  const isLead = resource === 'consultations';
  const id = stringQuery(req.query.id);
  const identity = isSingle ? 'site' : isLead && objectId.test(id) ? new ObjectId(id) : id;

  if (req.method === 'GET') {
    if (!isSingle) return getList(db, req, res, resource);
    return res.json(await collection.findOne({ _id: identity }) || {});
  }
  if (req.method === 'DELETE' && !isSingle && objectId.test(id)) {
    const { deletedCount } = await collection.deleteOne({ _id: identity });
    return deletedCount ? res.sendStatus(204) : res.status(404).json({ error: 'Record not found.' });
  }
  const create = req.method === 'POST' && !isSingle && !isLead;
  const update = req.method === 'PUT' && (isSingle || objectId.test(id));
  if (!create && !update) return res.status(405).json({ error: 'Unsupported operation.' });

  const schema = isLead ? z.strictObject({ status: z.enum(statuses) }) : contentSchemas[resource];
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = modules[resource].fields.find(([name]) => name === issue.path[0]);
    return res.status(400).json({ error: field ? field[1] + '. ' + issue.message : issue.message });
  }
  const now = new Date();
  if (create) {
    const record = { _id: new ObjectId().toHexString(), ...parsed.data, createdAt: now, updatedAt: now };
    await collection.insertOne(record);
    return res.status(201).json(record);
  }
  const result = await collection.updateOne({ _id: identity },
    { $set: { ...parsed.data, updatedAt: now }, ...isSingle && { $setOnInsert: { createdAt: now } } },
    { upsert: isSingle });
  return result.matchedCount || result.upsertedCount
    ? res.sendStatus(204) : res.status(404).json({ error: 'Record not found.' });
}

export function mountContent(app, database = getDatabase) {
  app.all('/api/admin', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    return next();
  }, allowAdminOrigin, express.json({ limit: bodyLimit }), async (req, res) => {
    const resource = stringQuery(req.query.resource);
    if (database === getDatabase && (!process.env.MONGODB_URI ||
        Buffer.byteLength(process.env.ADMIN_JWT_SECRET || '') < 32)) {
      return res.status(503).json({ error: 'Admin setup is incomplete. Configure MongoDB and the JWT secret on the backend.' });
    }
    const db = await database();
    if (resource === 'session' && req.method === 'POST') return login(db, req, res);
    const session = await adminSession(db, req);
    if (resource === 'session' && req.method === 'DELETE') return logout(db, res, session);
    if (!session) return res.status(401).json({ error: 'Sign in to continue.' });
    if (resource === 'session' && req.method === 'GET') return res.json(accountDetails(session));
    if (resource === 'profile' && req.method === 'PUT') return updateAccount(db, req, res, session, false);
    if (resource === 'password' && req.method === 'PUT') return updateAccount(db, req, res, session, true);
    if (resource === 'media' && req.method === 'POST') return uploadImage(db, req, res);
    if ([...publicModules, 'consultations'].includes(resource)) return writeResource(db, req, res, resource);
    return res.status(404).json({ error: 'Resource not found.' });
  });

  app.get('/api/content', async (_req, res) => {
    res.set('Cache-Control', 'no-store');
    if (database === getDatabase && !process.env.MONGODB_URI) return res.json(null);
    const db = await database();
    const ready = await db.collection('content_meta').findOne({ _id: 'site' });
    if (!ready) return res.json(null);
    const result = await Promise.all(publicModules.map(resource => {
      const collection = db.collection(resource);
      return singleton.includes(resource)
        ? collection.findOne({ _id: 'site' }, { projection: publicProjection })
        : collection.find({}, { projection: publicProjection }).sort(listOrder).toArray();
    }));
    return res.json(Object.fromEntries(publicModules.map((resource, i) => [resource, result[i]])));
  });

  app.get('/api/media', async (req, res) => {
    const id = stringQuery(req.query.id);
    if (!imageId.test(id)) return res.sendStatus(404);
    const db = await database();
    const image = await db.collection('media').findOne({ _id: id }, { promoteBuffers: true });
    if (!image) return res.sendStatus(404);
    res.set({
      'Content-Type': image.mime, 'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
    return res.send(image.bytes);
  });
}
