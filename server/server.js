const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Routes
const authRoutes = require('./routes/auth');
const portfolioRoutes = require('./routes/portfolio');
const stocksRoutes = require('./routes/stocks');
const newsRoutes = require('./routes/news');
const telegramRoutes = require('./routes/telegram');
const tradingGoalsRoutes = require('./routes/tradingGoals');
const brokersRoutes = require('./routes/brokers');

// Telegram bot
require('./services/telegramBot');

const app = express();

/* =======================
   CORS (תקן + Render)
   ======================= */

const defaultOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const envOrigins = (process.env.CLIENT_URLS || "")
  .split(",")
  .map(o => o.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header("Vary", "Origin");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());

/* =======================
   Routes
   ======================= */

app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/stocks', stocksRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/trading-goals', tradingGoalsRoutes);
app.use('/api/brokers', brokersRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/* =======================
   Error handler
   ======================= */

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

/* =======================
   Mongo + Server
   ======================= */

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () =>
      console.log(`🚀 Server running on port ${PORT}`)
    );
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
