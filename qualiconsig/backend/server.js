/* ============================================================
   QUALICONSIG API - server.js
   Node.js + Express + Supabase
   ============================================================ */
require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const rateLimit    = require('express-rate-limit');

const authRoutes     = require('./routes/auth');
const bannersRoutes  = require('./routes/banners');
const cardsRoutes    = require('./routes/cards');
const whyRoutes      = require('./routes/why');
const servicesRoutes = require('./routes/services');
const postsRoutes    = require('./routes/posts');
const settingsRoutes = require('./routes/settings');
const contactsRoutes = require('./routes/contacts');
const usersRoutes    = require('./routes/users');
const uploadRoutes   = require('./routes/upload');
const dashRoutes     = require('./routes/dashboard');

const app = express();

/* ===== CORS ===== */
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

/* ===== SEGURANÇA ===== */
app.use(helmet());
app.use(express.json({ limit: '10mb' }));

/* ===== RATE LIMIT ===== */
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Muitas tentativas. Aguarde.' } }));
app.use('/api',      rateLimit({ windowMs: 1  * 60 * 1000, max: 300 }));

/* ===== HEALTH CHECK ===== */
app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

/* ===== ROTAS ===== */
app.use('/api/auth',      authRoutes);
app.use('/api/banners',   bannersRoutes);
app.use('/api/cards',     cardsRoutes);
app.use('/api/why-items', whyRoutes);
app.use('/api/services',  servicesRoutes);
app.use('/api/posts',     postsRoutes);
app.use('/api/settings',  settingsRoutes);
app.use('/api/contacts',  contactsRoutes);
app.use('/api/users',     usersRoutes);
app.use('/api/upload',    uploadRoutes);
app.use('/api/dashboard', dashRoutes);

/* ===== ERRO 404 ===== */
app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada' }));

/* ===== ERRO GLOBAL ===== */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ API Qualiconsig rodando na porta ${PORT}`));
