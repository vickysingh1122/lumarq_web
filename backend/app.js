import express from 'express';
import { getDatabase } from './db.js';
import { mountContent } from './content.js';

const services = new Set([
  'Website Development', 'Mobile App Development', 'SEO & Growth',
  'Cloud & DevOps', 'UI/UX Design', 'Other',
]);
const budgets = new Set([
  null, 'Under $5k', '$5k – $15k', '$15k – $50k', '$50k+', 'Not sure yet',
]);

async function saveConsultation(consultation) {
  const db = await getDatabase();
  await db.collection('consultations').insertOne({ ...consultation, status: 'New' });
}

export function createApp(save = saveConsultation, database = getDatabase) {
  const app = express();
  app.disable('x-powered-by');
  mountContent(app, database);
  app.use(express.json({ limit: '32kb' }));

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.post('/api/consultations', async (req, res) => {
    const body = req.body ?? {};
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const { service, budget = null, company_site: website } = body;

    if (name.length < 2 || name.length > 200 ||
        email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ||
        message.length < 10 || message.length > 10000 ||
        typeof service !== "string" || !service.trim() || service.length > 160 || !budgets.has(budget) || website) {
      return res.status(400).json({ error: 'Invalid consultation details.' });
    }

    if (!services.has(service) && (save !== saveConsultation ||
        !await (await database()).collection('services').findOne({ name: service }))) {
      return res.status(400).json({ error: 'Invalid consultation service.' });
    }
    await save({ name, email, service, budget, message, createdAt: new Date() });
    return res.status(201).json({ status: 'saved' });
  });

  app.use((_req, res) => res.status(404).json({ error: 'Route not found.' }));

  app.use((error, req, res, _next) => {
    if (error.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Request too large.' });
    }
    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Invalid JSON.' });
    }
    console.error('Lumarq API error', error.name);
    return res.status(503).json({ error: req.path === '/api/consultations' ? 'Unable to save consultation.' : 'Service temporarily unavailable.' });
  });

  return app;
}

export default createApp();
