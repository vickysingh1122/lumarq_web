import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { jwtVerify, SignJWT } from 'jose';
import { z } from 'zod';

const derive = promisify(scrypt);
const passwordCost = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
const issuer = 'lumarq-admin';
const audience = 'lumarq-dashboard';
const duration = 3600;
const dummySalt = Buffer.alloc(16);
const dummyKey = Buffer.alloc(64);
const credentials = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(256),
}).strict();

export async function hashPassword(password) {
  const salt = randomBytes(16);
  return salt.toString('hex') + ':' + (await derive(password, salt, 64, passwordCost)).toString('hex');
}

async function verifyPassword(password, stored) {
  const [salt, key] = stored?.split(':') ?? [];
  const expected = key ? Buffer.from(key, 'hex') : dummyKey;
  const actual = await derive(password, salt ? Buffer.from(salt, 'hex') : dummySalt, 64, passwordCost);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function key() {
  const value = process.env.ADMIN_JWT_SECRET;
  if (!value || Buffer.byteLength(value) < 32) throw new Error('Admin authentication is not configured');
  return Buffer.from(value);
}

const production = () => process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
const cookieName = () => production() ? '__Host-lumarq-admin' : 'lumarq-admin';
const cookieOptions = () => ({ httpOnly: true, secure: production(), sameSite: 'strict', path: '/' });

export function allowAdminOrigin(req, res, next) {
  if (req.method === 'GET' || req.method === 'HEAD') return next();
  const host = req.get('host');
  const expected = process.env.ADMIN_ORIGIN || ((production() ? 'https://' : 'http://') + host);
  if (req.get('origin') !== expected || !req.is('application/json')) {
    return res.status(403).json({ error: 'Invalid request origin or content type.' });
  }
  return next();
}

async function allowCredentialAttempt(db, req, res, scope, secret) {
  const period = 15 * 60 * 1000;
  const windowStart = Math.floor(Date.now() / period) * period;
  const requester = process.env.VERCEL ? req.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() : req.ip;
  const bucket = createHmac('sha256', secret).update(scope + ':' + (requester || 'unknown')).digest('hex');
  const limit = await db.collection('admin_login_limits').findOneAndUpdate(
    { _id: bucket + ':' + windowStart },
    { $inc: { attempts: 1 }, $setOnInsert: { expiresAt: new Date(windowStart + period) } },
    { upsert: true, returnDocument: 'after' },
  );
  if (limit.attempts <= 12) return true;
  res.set('Retry-After', String(Math.max(1, Math.ceil((windowStart + period - Date.now()) / 1000))));
  res.status(429).json({ error: 'Too many attempts. Try again later.' });
  return false;
}

export async function login(db, req, res) {
  const input = credentials.safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: 'Enter a valid email and password.' });

  const secret = key();
  if (!await allowCredentialAttempt(db, req, res, "login", secret)) return;

  const admin = await db.collection('admin_users').findOne({ email: input.data.email, active: true });
  const verified = await verifyPassword(input.data.password, admin?.passwordHash);
  if (!admin || !verified) return res.status(401).json({ error: 'Invalid email or password.' });

  const sessionId = randomBytes(24).toString('hex');
  const expires = Math.floor(Date.now() / 1000) + duration;
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' }).setIssuer(issuer).setAudience(audience)
    .setSubject(admin._id).setJti(sessionId).setIssuedAt().setExpirationTime(expires).sign(secret);
  await db.collection('admin_sessions').insertOne({
    _id: sessionId, adminId: admin._id, credentialVersion: admin.credentialVersion, expiresAt: new Date(expires * 1000),
  });
  res.cookie(cookieName(), token, { ...cookieOptions(), maxAge: duration * 1000 });
  return res.json(accountDetails(admin));
}

export async function adminSession(db, req) {
  const prefix = cookieName() + '=';
  const cookie = req.get('cookie')?.split(';').map(value => value.trim()).find(value => value.startsWith(prefix));
  if (!cookie) return null;
  const secret = key();
  let payload;
  try {
    ({ payload } = await jwtVerify(cookie.slice(prefix.length), secret,
      { issuer, audience, algorithms: ['HS256'], typ: 'JWT', requiredClaims: ['sub', 'jti', 'exp', 'iat'] }));
  } catch {
    return null;
  }
  const session = await db.collection('admin_sessions').findOne({
    _id: payload.jti, adminId: payload.sub, expiresAt: { $gt: new Date() },
  });
  if (!session) return null;
  const admin = await db.collection('admin_users').findOne(
    { _id: payload.sub, active: true, credentialVersion: session.credentialVersion }, { projection: { email: 1, displayName: 1 } },
  );
  return admin && { ...accountDetails(admin), adminId: admin._id, sessionId: session._id, credentialVersion: session.credentialVersion };
}

export async function logout(db, res, session) {
  if (session) await db.collection('admin_sessions').deleteOne({ _id: session.sessionId });
  res.clearCookie(cookieName(), cookieOptions());
  return res.sendStatus(204);
}

export function accountDetails(admin) {
  return { email: admin.email, displayName: admin.displayName ?? '' };
}

const profileSchema = credentials.omit({ password: true }).extend({
  displayName: z.string().trim().max(100),
  currentPassword: credentials.shape.password,
});
const passwordSchema = z.strictObject({
  currentPassword: credentials.shape.password,
  newPassword: z.string().min(14).max(256),
});

export async function updateAccount(db, req, res, session, changingPassword) {
  const input = (changingPassword ? passwordSchema : profileSchema).safeParse(req.body);
  if (!input.success) {
    return res.status(400).json({ error: changingPassword
      ? 'Enter your current password and a new password of 14 to 256 characters.'
      : 'Enter a valid email, a display name of up to 100 characters, and your current password.' });
  }
  if (!await allowCredentialAttempt(db, req, res, 'profile:' + session.adminId, key())) return;

  const admins = db.collection('admin_users');
  const match = { _id: session.adminId, active: true, credentialVersion: session.credentialVersion };
  const admin = await admins.findOne(match);
  if (!admin) return res.status(401).json({ error: 'Sign in again.' });
  if (!await verifyPassword(input.data.currentPassword, admin.passwordHash)) {
    return res.status(400).json({ error: 'The current password is incorrect.' });
  }

  const changes = changingPassword ? {} : {
    email: input.data.email, displayName: input.data.displayName,
  };
  if (changingPassword) {
    if (input.data.newPassword === input.data.currentPassword) {
      return res.status(400).json({ error: 'Choose a password different from your current password.' });
    }
    changes.passwordHash = await hashPassword(input.data.newPassword);
  }

  const signInRequired = changingPassword || changes.email !== admin.email;
  if (signInRequired) changes.credentialVersion = randomBytes(16).toString('hex');

  try {
    const result = await admins.updateOne({ ...match, email: admin.email }, { $set: { ...changes, updatedAt: new Date() } });
    if (!result.matchedCount) return res.status(401).json({ error: 'Sign in again.' });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: 'That email is already in use.' });
    throw error;
  }

  if (signInRequired) res.clearCookie(cookieName(), cookieOptions());
  return res.json({ ...accountDetails({ ...admin, ...changes }), signInRequired });
}
