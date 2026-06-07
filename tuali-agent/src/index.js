require('dotenv').config();

const REQUIRED_ENV = ['MONGO_URI', 'GROQ_API_KEY'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error('\n❌ Faltan variables en tu .env:');
  missing.forEach(k => console.error(`   • ${k}`));
  process.exit(1);
}

const express  = require('express');
const cors     = require('cors');
const { connectDB } = require('./db/mongo');

const chatRoute    = require('./routes/chat');
const insightsRoute = require('./routes/insights');

const goalsRoute   = require('./routes/goals');
const actionsRoute = require('./routes/actions');

const notificationsRoute = require('./routes/notifications');
const rewardsRoute       = require('./routes/rewards');
const authRoute          = require('./routes/auth');
const rankingRoute       = require('./routes/ranking');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middlewares ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use('/goals',   goalsRoute);
app.use('/actions', actionsRoute);
app.use('/notifications', notificationsRoute);
app.use('/rewards',       rewardsRoute);
app.use('/auth',          authRoute);
app.use('/ranking',       rankingRoute);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'tuali-growth-agent', ts: new Date().toISOString() });
});

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/chat',     chatRoute);
app.use('/insights', insightsRoute);

// ── Error handler global ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

// ── Arranque ─────────────────────────────────────────────────────────────────
async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`\n🚀 Tuali Growth Agent corriendo en http://localhost:${PORT}`);
      console.log(`   POST /chat          → agente conversacional`);
      console.log(`   GET  /insights/:id  → insights proactivos`);
      console.log(`   GET  /health        → status\n`);
    });
  } catch (err) {
    console.error('❌ No se pudo iniciar:', err.message);
    process.exit(1);
  }
}

start();
