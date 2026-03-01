const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const axios = require('axios');
const TelegramSettings = require('../models/TelegramSettings');
const Holding = require('../models/Holding');
const TradingGoals = require('../models/TradingGoals');
const Watchlist = require('../models/Watchlist');
const {
  computeRSI,
  computeMACD,
  computeBollinger,
  findSupportResistance,
  generateSignal,
  interpretRSI,
  signalEmoji,
} = require('../utils/technicalIndicators');
const { analyzeStock } = require('./aiService');

const token = process.env.TELEGRAM_BOT_TOKEN;
const TWELVE_API_KEY = process.env.TWELVEDATA_API_KEY;
const TWELVE_BASE_URL = 'https://api.twelvedata.com';
let bot = null;
const botCache = new Map();

// Use webhook in production (Render), polling in development
const isProduction = !!(process.env.RENDER || process.env.NODE_ENV === 'production');

// Render may set RENDER_EXTERNAL_URL or RENDER_EXTERNAL_HOSTNAME
const getRenderBaseUrl = () => {
  if (process.env.RENDER_EXTERNAL_URL) return process.env.RENDER_EXTERNAL_URL;
  if (process.env.RENDER_EXTERNAL_HOSTNAME) return `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`;
  if (process.env.SERVER_URL) return process.env.SERVER_URL;
  return null;
};

// Initialize bot only if token exists
if (token && token !== 'your-telegram-bot-token') {
  const renderBaseUrl = getRenderBaseUrl();
  if (isProduction && renderBaseUrl) {
    bot = new TelegramBot(token, { polling: false });
    const webhookUrl = `${renderBaseUrl}/api/telegram/webhook/${token}`;
    bot.setWebHook(webhookUrl)
      .then(() => console.log(`🤖 Telegram bot started (webhook → ${renderBaseUrl})`))
      .catch((err) => console.error('❌ Failed to set Telegram webhook:', err.message));
  } else {
    bot = new TelegramBot(token, { polling: true });
    console.log('🤖 Telegram bot started (polling mode)');
    if (isProduction) {
      console.warn('⚠️  No RENDER_EXTERNAL_URL / RENDER_EXTERNAL_HOSTNAME / SERVER_URL found — using polling');
    }
  }

  // Handle /start command
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const welcomeMessage = `
🎉 ברוך הבא ל-StockPro Bot!

📱 ה-Chat ID שלך: <code>${chatId}</code>

העתק את המספר הזה והדבק אותו באפליקציה כדי לקבל התראות על:
• 📈 שינויי מחיר משמעותיים
• 📊 סיכום יומי של התיק שלך
• ⚠️ התראות חשובות
• 🔔 פריצות רמות טכניות

פקודות זמינות:
/analyze SYMBOL — ניתוח טכני + AI לכל מניה
/status — בדוק סטטוס ההתראות
/help — עזרה מלאה

לחץ על המספר כדי להעתיק אותו!
    `;

    bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'HTML' });
  });

  // Handle /help command
  bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    const helpMessage = `
📚 עזרה - StockPro Bot

פקודות זמינות:
/start - קבל את ה-Chat ID שלך
/help - הצג עזרה
/status - בדוק סטטוס ההתראות
/analyze SYMBOL - ניתוח טכני + AI (לדוגמה: /analyze AAPL)

💡 טיפ: ודא שהפעלת את ההתראות באפליקציה!
    `;

    bot.sendMessage(chatId, helpMessage);
  });

  // Handle /status command
  bot.onText(/\/status/, async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, '✅ הבוט פעיל ומחובר!');
  });

  // Handle /analyze SYMBOL command — ניתוח טכני + AI
  bot.onText(/\/analyze(?:\s+(\S+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const symbol = (match[1] || '').trim().toUpperCase();

    if (!symbol) {
      bot.sendMessage(chatId, '❌ נא לציין סמל מניה. לדוגמה: /analyze AAPL');
      return;
    }

    try {
      await bot.sendMessage(chatId, `🔍 מנתח את ${symbol}...`);

      const series = await fetchTimeSeries(symbol, 60);
      if (!Array.isArray(series?.values) || series.values.length < 30) {
        throw new Error('אין מספיק נתונים היסטוריים');
      }

      const vals = series.values.slice().reverse(); // oldest first
      const closes = vals.map((v) => parseFloat(v.close));
      const highs = vals.map((v) => parseFloat(v.high));
      const lows = vals.map((v) => parseFloat(v.low));

      const rsiArr = computeRSI(closes);
      const macdData = computeMACD(closes);
      const bollingerData = computeBollinger(closes);
      const { support, resistance } = findSupportResistance(highs, lows, closes);

      const price = closes[closes.length - 1];
      const prevPrice = closes[closes.length - 2] || price;
      const changePercent = prevPrice > 0 ? ((price - prevPrice) / prevPrice) * 100 : 0;

      const { signal, reasons } = generateSignal(rsiArr, macdData, price, bollingerData);
      const rsi = rsiArr[rsiArr.length - 1];
      const histogram = macdData.histogram[macdData.histogram.length - 1];
      const bbLower = bollingerData.lower[bollingerData.lower.length - 1];
      const bbUpper = bollingerData.upper[bollingerData.upper.length - 1];

      let bollingerPos = 'באמצע הרצועה';
      if (bbLower !== null && price <= bbLower * 1.005) bollingerPos = 'בתחתית הרצועה';
      else if (bbUpper !== null && price >= bbUpper * 0.995) bollingerPos = 'בראש הרצועה';

      // AI analysis (optional — returns null if no API key)
      const aiText = await analyzeStock(symbol, {
        price,
        changePercent,
        rsi,
        macdHistogram: histogram,
        bollingerPos,
        support,
        resistance,
        signal,
      });

      const reasonsText = reasons.map((r) => `• ${r}`).join('\n');

      let message =
        `📊 <b>ניתוח טכני — ${symbol}</b>\n\n` +
        `💵 מחיר: $${price.toFixed(2)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)\n` +
        `📈 RSI: ${interpretRSI(rsi)}\n` +
        `📉 MACD: ${histogram !== null ? (histogram > 0 ? '✅ היסטוגרמה חיובית' : '⚠️ היסטוגרמה שלילית') : '—'}\n` +
        `📊 Bollinger: מחיר ${bollingerPos}\n`;

      if (support !== null) message += `🛡 תמיכה: $${support.toFixed(2)}\n`;
      if (resistance !== null) message += `🎯 התנגדות: $${resistance.toFixed(2)}\n`;

      message += `\n🚦 <b>אות:</b> ${signalEmoji(signal)}\n`;

      if (reasonsText) {
        message += `\n<b>סיבות:</b>\n${reasonsText}\n`;
      }

      if (aiText) {
        message += `\n🤖 <b>ניתוח AI:</b>\n${aiText}`;
      }

      await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
    } catch (err) {
      console.error(`[/analyze ${symbol}] error:`, err.message);
      bot.sendMessage(chatId, `❌ לא ניתן לנתח את ${symbol}: ${err.message}`);
    }
  });
} else {
  console.log('⚠️ Telegram bot token not configured');
}

const getBotForToken = (botToken) => {
  const trimmed = typeof botToken === 'string' ? botToken.trim() : '';
  if (!trimmed || trimmed === 'your-telegram-bot-token') {
    return bot;
  }
  if (botCache.has(trimmed)) {
    return botCache.get(trimmed);
  }
  const instance = new TelegramBot(trimmed, { polling: false });
  botCache.set(trimmed, instance);
  return instance;
};

// Send price alert
const sendPriceAlert = async (chatId, symbol, price, change, botToken) => {
  const client = getBotForToken(botToken);
  if (!client) return;

  const emoji = change >= 0 ? '🟢' : '🔴';
  const arrow = change >= 0 ? '📈' : '📉';

  const message = `
${emoji} <b>התראת מחיר!</b>

${arrow} <b>${symbol}</b>
💵 מחיר: $${price.toFixed(2)}
📊 שינוי: ${change >= 0 ? '+' : ''}${change.toFixed(2)}%

⏰ ${new Date().toLocaleString('he-IL')}
  `;

  try {
    await client.sendMessage(chatId, message, { parse_mode: 'HTML' });
  } catch (err) {
    console.error('Error sending price alert:', err);
  }
};

// Send test message
const sendTestMessage = async (chatId, botToken, userId) => {
  if (userId) {
    await sendPortfolioSummary({ chatId, botToken, userId }, 'בדיקה');
    return;
  }
  const client = getBotForToken(botToken);
  if (!client) {
    throw new Error('Telegram bot not configured');
  }

  const message = `
✅ <b>הודעת בדיקה</b>

🎉 ההתראות הוגדרו בהצלחה!
תקבל הודעות על שינויים בתיק שלך.

⏰ ${new Date().toLocaleString('he-IL')}
  `;

  await client.sendMessage(chatId, message, { parse_mode: 'HTML' });
};

const sendEntryAlert = async (chatId, payload, botToken) => {
  const client = getBotForToken(botToken);
  if (!client) return;
  const directionEmoji = payload.changePercent >= 0 ? '🟢' : '🔴';
  const message = `
${directionEmoji} <b>Trade Entry Alert</b>

<b>${payload.symbol}</b>
Price: $${payload.price.toFixed(2)}
Change: ${payload.changePercent >= 0 ? '+' : ''}${payload.changePercent.toFixed(2)}%
Volume: ${payload.volume.toLocaleString()} (${payload.volumeMultiplier.toFixed(2)}x avg)

⏰ ${new Date().toLocaleString('en-US')}
  `;

  await client.sendMessage(chatId, message, { parse_mode: 'HTML' });
};

const getZonedParts = (date, timeZone) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short'
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    weekday: map.weekday
  };
};

const weekdayToNumber = (weekday) => {
  const map = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6
  };
  return map[weekday];
};

const isSameDay = (a, b) => (
  a.year === b.year && a.month === b.month && a.day === b.day
);

const isSameMonth = (a, b) => (
  a.year === b.year && a.month === b.month
);

const isSameWeek = (a, b) => {
  const dateA = new Date(a.year, a.month - 1, a.day);
  const dateB = new Date(b.year, b.month - 1, b.day);
  const diff = Math.abs(dateA - dateB);
  return diff < 7 * 24 * 60 * 60 * 1000;
};

const parseTime = (time) => {
  const [hour, minute] = String(time || '20:00').split(':').map((part) => parseInt(part, 10));
  return {
    hour: Number.isFinite(hour) ? hour : 20,
    minute: Number.isFinite(minute) ? minute : 0
  };
};

const calculateTradeCapital = (goals) => {
  if (!goals) return 0;
  const baseCapital = Number.isFinite(goals.baseCapital) ? goals.baseCapital : 0;
  const entries = goals.profitEntries || {};
  const days = entries.days || {};
  const weeks = entries.weeks || {};
  const months = entries.months || {};

  const monthMap = new Map();
  Object.entries(days).forEach(([dayKey, value]) => {
    const monthKey = dayKey.slice(0, 7);
    const entry = monthMap.get(monthKey) || { days: 0, weeks: 0, hasWeeks: false };
    entry.days += Number(value) || 0;
    monthMap.set(monthKey, entry);
  });

  Object.entries(weeks).forEach(([weekKey, value]) => {
    const parts = weekKey.split('-');
    const monthKey = `${parts[0]}-${parts[1]}`;
    const entry = monthMap.get(monthKey) || { days: 0, weeks: 0, hasWeeks: false };
    entry.weeks += Number(value) || 0;
    entry.hasWeeks = true;
    monthMap.set(monthKey, entry);
  });

  let total = 0;
  const allMonths = new Set([
    ...Object.keys(months),
    ...monthMap.keys()
  ]);
  allMonths.forEach((monthKey) => {
    if (typeof months[monthKey] === 'number') {
      total += months[monthKey];
      return;
    }
    const entry = monthMap.get(monthKey);
    if (!entry) return;
    total += entry.hasWeeks ? entry.weeks : entry.days;
  });

  return Math.max(baseCapital + total, 0);
};

const formatCurrency = (value) => `$${Number(value || 0).toLocaleString()}`;

// ── Helper: fetch TwelveData time series (daily) ───────────────────────────

const fetchTimeSeries = async (symbol, outputsize = 30) => {
  const response = await axios.get(`${TWELVE_BASE_URL}/time_series`, {
    params: {
      symbol,
      interval: '1day',
      outputsize,
      apikey: TWELVE_API_KEY
    },
    timeout: 10000
  });
  return response.data || {};
};

// ── Portfolio summary ──────────────────────────────────────────────────────

const sendPortfolioSummary = async (settings, frequencyLabel) => {
  const client = getBotForToken(settings.botToken);
  if (!client) return;

  const holdings = await Holding.find({ userId: settings.userId }).lean();
  const goals = await TradingGoals.findOne({ userId: settings.userId }).lean();
  const { getQuote } = require('./stockService');

  const uniqueSymbols = [...new Set(holdings.map((holding) => holding.symbol))];
  const quotes = {};
  for (const symbol of uniqueSymbols) {
    try {
      const quote = await getQuote(symbol);
      const price = Number(quote?.price || 0);
      if (Number.isFinite(price) && price > 0) {
        quotes[symbol] = quote;
      }
    } catch {
      continue;
    }
  }

  const calcTotals = (filterFn) => {
    let value = 0;
    let cost = 0;
    holdings.filter(filterFn).forEach((holding) => {
      const price = quotes[holding.symbol]?.price || holding.buyPrice;
      value += holding.shares * price;
      cost += holding.shares * holding.buyPrice;
    });
    const pnl = value - cost;
    const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;
    return { value, pnl, pnlPercent };
  };

  const longTotals = calcTotals((holding) => holding.portfolioType !== 'trade');
  const tradeHoldingsTotals = calcTotals((holding) => holding.portfolioType === 'trade');
  const tradeCapital = goals ? calculateTradeCapital(goals) : tradeHoldingsTotals.value;
  const tradeWeeklyReturn = Number.isFinite(goals?.weeklyReturn) ? goals.weeklyReturn : 0;
  const totalEquity = longTotals.value + tradeHoldingsTotals.value + tradeCapital;

  // Build per-holding lines with RSI + signal for long portfolio
  let holdingLines = '';
  const longHoldings = holdings.filter((h) => h.portfolioType !== 'trade').slice(0, 5);
  for (const holding of longHoldings) {
    const q = quotes[holding.symbol];
    if (!q) continue;
    const pnl = holding.shares * (q.price - holding.buyPrice);
    const pnlPct = holding.buyPrice > 0 ? ((q.price - holding.buyPrice) / holding.buyPrice) * 100 : 0;
    const changeEmoji = (q.changePercent || 0) >= 0 ? '📈' : '📉';
    holdingLines += `\n• <b>${holding.symbol}</b> $${Number(q.price).toFixed(2)} ${changeEmoji} ${Number(q.changePercent || 0).toFixed(1)}%  (P&L: ${pnl >= 0 ? '+' : ''}${formatCurrency(pnl)}, ${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(1)}%)`;
  }

  const message = `
📊 <b>סיכום תיק (${frequencyLabel})</b>

🧠 <b>טווח ארוך</b>
• שווי: ${formatCurrency(longTotals.value)}
• רווח/הפסד: ${longTotals.pnl >= 0 ? '+' : ''}${formatCurrency(longTotals.pnl)}
• שינוי: ${longTotals.pnlPercent.toFixed(2)}%${holdingLines}

⚡ <b>טריידים</b>
• סה״כ הון: ${formatCurrency(tradeCapital)}
• תשואה שבועית: ${tradeWeeklyReturn.toFixed(2)}%

💼 <b>סה״כ הון כולל:</b> ${formatCurrency(totalEquity)}

⏰ עודכן: ${new Date().toLocaleString('he-IL')}
  `;

  await client.sendMessage(settings.chatId, message, { parse_mode: 'HTML' });
};

// ── Cooldown helper ────────────────────────────────────────────────────────

const alertCooldown = new Map();

const shouldSendAlert = (key, cooldownMs) => {
  const lastSent = alertCooldown.get(key);
  if (lastSent && Date.now() - lastSent < cooldownMs) {
    return false;
  }
  alertCooldown.set(key, Date.now());
  return true;
};

// ── Legacy quote helper (kept for entry alerts) ────────────────────────────

const fetchQuote = async (symbol) => {
  const response = await axios.get(`${TWELVE_BASE_URL}/quote`, {
    params: {
      symbol,
      apikey: TWELVE_API_KEY
    }
  });
  return response.data || {};
};

const fetchAverageVolume = async (symbol) => {
  const response = await axios.get(`${TWELVE_BASE_URL}/time_series`, {
    params: {
      symbol,
      interval: '1day',
      outputsize: 30,
      apikey: TWELVE_API_KEY
    }
  });
  const series = response.data || {};
  if (series.status === 'error' || !Array.isArray(series.values)) {
    return null;
  }
  const volumes = series.values
    .slice(1, 21)
    .map((item) => parseFloat(item.volume || 0))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (volumes.length === 0) {
    return null;
  }
  const sum = volumes.reduce((acc, value) => acc + value, 0);
  return sum / volumes.length;
};

// ── E3 — Breakout Alerts ───────────────────────────────────────────────────

const runBreakoutAlerts = async () => {
  if (!TWELVE_API_KEY) return;

  const settingsList = await TelegramSettings.find({
    isActive: true,
    notifyBreakout: true,
  }).lean();

  for (const settings of settingsList) {
    const watchlistItems = await Watchlist.find({ userId: settings.userId }).lean();
    if (!watchlistItems.length) continue;

    const client = getBotForToken(settings.botToken);
    if (!client) continue;

    const { getQuote } = require('./stockService');

    for (const item of watchlistItems) {
      try {
        const quote = await getQuote(item.symbol);
        if (!quote?.price) continue;

        const series = await fetchTimeSeries(item.symbol, 30);
        if (!Array.isArray(series?.values) || series.values.length < 10) continue;

        const vals = series.values.slice().reverse();
        const closes = vals.map((v) => parseFloat(v.close));
        const highs = vals.map((v) => parseFloat(v.high));
        const lows = vals.map((v) => parseFloat(v.low));

        const { support, resistance } = findSupportResistance(highs, lows, closes);
        const price = quote.price;

        if (resistance !== null && Number.isFinite(resistance) && price >= resistance * 1.005) {
          const key = `breakout-up-${settings.userId}-${item.symbol}`;
          if (shouldSendAlert(key, 8 * 60 * 60 * 1000)) {
            const msg =
              `🚀 <b>פריצת התנגדות!</b>\n\n` +
              `<b>${item.symbol}</b> פרץ את רמת ההתנגדות\n` +
              `💵 מחיר: $${price.toFixed(2)}\n` +
              `🎯 התנגדות: $${resistance.toFixed(2)}\n\n` +
              `⏰ ${new Date().toLocaleString('he-IL')}`;
            await client.sendMessage(settings.chatId, msg, { parse_mode: 'HTML' });
          }
        } else if (support !== null && Number.isFinite(support) && price <= support * 0.995) {
          const key = `breakout-down-${settings.userId}-${item.symbol}`;
          if (shouldSendAlert(key, 8 * 60 * 60 * 1000)) {
            const msg =
              `🚨 <b>שבירת תמיכה!</b>\n\n` +
              `<b>${item.symbol}</b> שבר את רמת התמיכה\n` +
              `💵 מחיר: $${price.toFixed(2)}\n` +
              `🛡 תמיכה: $${support.toFixed(2)}\n\n` +
              `⏰ ${new Date().toLocaleString('he-IL')}`;
            await client.sendMessage(settings.chatId, msg, { parse_mode: 'HTML' });
          }
        }
      } catch (err) {
        console.error(`[breakout] ${item.symbol}:`, err.message);
      }
    }
  }
};

// ── E1 — Watchlist Daily Update ────────────────────────────────────────────

const runWatchlistUpdate = async () => {
  if (!TWELVE_API_KEY) return;

  const settingsList = await TelegramSettings.find({
    isActive: true,
    notifyWatchlistUpdate: true,
  }).lean();

  const { getQuote } = require('./stockService');
  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const now = new Date();
  const dayName = dayNames[now.getDay()];
  const dateStr = now.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });

  for (const settings of settingsList) {
    const key = `watchlist-daily-${settings.userId}`;
    if (!shouldSendAlert(key, 20 * 60 * 60 * 1000)) continue;

    const watchlistItems = await Watchlist.find({ userId: settings.userId }).lean();
    if (!watchlistItems.length) continue;

    const client = getBotForToken(settings.botToken);
    if (!client) continue;

    const lines = [];
    for (const item of watchlistItems.slice(0, 8)) {
      try {
        const quote = await getQuote(item.symbol);
        if (!quote?.price) continue;

        const series = await fetchTimeSeries(item.symbol, 30);
        let rsiStr = '';
        let sigStr = '';

        if (Array.isArray(series?.values) && series.values.length >= 15) {
          const vals = series.values.slice().reverse();
          const closes = vals.map((v) => parseFloat(v.close));
          const highs = vals.map((v) => parseFloat(v.high));
          const lows = vals.map((v) => parseFloat(v.low));

          const rsiArr = computeRSI(closes);
          const macdData = computeMACD(closes);
          const bollingerData = computeBollinger(closes);
          const { signal } = generateSignal(rsiArr, macdData, quote.price, bollingerData);
          const rsi = rsiArr[rsiArr.length - 1];

          rsiStr = rsi !== null ? `RSI ${rsi.toFixed(0)}` : '';
          sigStr = signalEmoji(signal);
        }

        const changeEmoji = quote.changePercent >= 0 ? '📈' : '📉';
        const changeStr = `${quote.changePercent >= 0 ? '+' : ''}${Number(quote.changePercent).toFixed(2)}%`;
        let line = `<b>${item.symbol}</b>  $${Number(quote.price).toFixed(2)}  ${changeEmoji} ${changeStr}`;
        if (rsiStr) line += `\n${rsiStr}`;
        if (sigStr) line += `  ·  💡 ${sigStr}`;
        line += '\n─────────────────';
        lines.push(line);
      } catch (err) {
        console.error(`[watchlist update] ${item.symbol}:`, err.message);
        continue;
      }
    }

    if (!lines.length) continue;

    const message =
      `📊 <b>עדכון רשימת מעקב</b>\n` +
      `יום ${dayName}, ${dateStr}\n\n` +
      lines.join('\n') +
      `\n\n💡 שלח /analyze SYMBOL לניתוח מעמיק`;

    try {
      await client.sendMessage(settings.chatId, message, { parse_mode: 'HTML' });
    } catch (err) {
      console.error('[watchlist update] send error:', err.message);
    }
  }
};

// ── Entry alert runner ─────────────────────────────────────────────────────

const runEntryAlerts = async () => {
  if (!bot || !TWELVE_API_KEY) {
    return;
  }

  const settingsList = await TelegramSettings.find({
    isActive: true,
    notifyEntryAlerts: true
  }).lean();

  if (!settingsList.length) {
    return;
  }

  for (const settings of settingsList) {
    const holdings = await Holding.find({ userId: settings.userId }).lean();
    const symbols = [...new Set(holdings.map((holding) => holding.symbol))];
    if (!symbols.length) {
      continue;
    }

    for (const symbol of symbols) {
      try {
        const quote = await fetchQuote(symbol);
        const price = parseFloat(quote.price || 0);
        const volume = parseFloat(quote.volume || 0);
        const changePercent = parseFloat(quote.percent_change || 0);

        if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(volume) || volume <= 0) {
          continue;
        }

        const avgVolume = await fetchAverageVolume(symbol);
        if (!avgVolume || avgVolume <= 0) {
          continue;
        }

        const multiplier = volume / avgVolume;
        const meetsChange = Math.abs(changePercent) >= (settings.entryChangeThreshold || 3);
        const meetsVolume = multiplier >= (settings.entryVolumeMultiplier || 2);

        if (meetsChange && meetsVolume) {
          const key = `${settings.userId}-${symbol}`;
          if (shouldSendAlert(key, 6 * 60 * 60 * 1000)) {
            await sendEntryAlert(settings.chatId, {
              symbol,
              price,
              changePercent,
              volume,
              volumeMultiplier: multiplier
            }, settings.botToken);
          }
        }
      } catch (err) {
        console.error('Entry alert error:', err.message || err);
      }
    }
  }
};

// ── Cron: every 5 minutes — price alerts + breakout alerts ────────────────
cron.schedule('*/5 * * * *', async () => {
  try {
    const Alert = require('../models/Alert');
    const { getQuote } = require('./stockService');

    // --- User-created watchlist alerts ---
    const activeAlerts = await Alert.find({ isActive: true });
    for (const alert of activeAlerts) {
      const quote = await getQuote(alert.symbol);
      if (!quote?.price) continue;

      const price = quote.price;
      const triggered =
        (alert.condition === 'above' && price >= alert.targetPrice) ||
        (alert.condition === 'below' && price <= alert.targetPrice);

      if (!triggered) continue;

      alert.isActive = false;
      alert.triggeredAt = new Date();
      await alert.save();

      const settings = await TelegramSettings.findOne({ userId: alert.userId, isActive: true });
      if (!settings?.chatId) continue;

      const client = getBotForToken(settings.botToken);
      const direction = alert.condition === 'above' ? '⬆️ עלה מעל' : '⬇️ ירד מתחת ל';
      const msg =
        `🔔 <b>התראת מחיר</b>\n\n` +
        `${alert.symbol} ${direction} $${alert.targetPrice}\n` +
        `מחיר נוכחי: <b>$${price.toFixed(2)}</b>`;
      await client.sendMessage(settings.chatId, msg, { parse_mode: 'HTML' });
    }

    // --- Portfolio price-change alerts (notifyPriceChange) ---
    const priceAlertUsers = await TelegramSettings.find({
      isActive: true,
      notifyPriceChange: true,
    }).lean();

    for (const settings of priceAlertUsers) {
      const holdings = await Holding.find({ userId: settings.userId }).lean();
      const symbols = [...new Set(holdings.map((h) => h.symbol))];
      for (const symbol of symbols) {
        try {
          const quote = await getQuote(symbol);
          if (!quote?.price || !Number.isFinite(quote.changePercent)) continue;
          const threshold = settings.priceThreshold || 5;
          if (Math.abs(quote.changePercent) < threshold) continue;

          const key = `portfolio-price-${settings.userId}-${symbol}`;
          if (!shouldSendAlert(key, 4 * 60 * 60 * 1000)) continue;

          const client = getBotForToken(settings.botToken);
          if (!client) continue;

          const isUp = quote.changePercent >= 0;
          const msg =
            `${isUp ? '📈' : '📉'} <b>שינוי מחיר בתיק</b>\n\n` +
            `<b>${symbol}</b>\n` +
            `מחיר: $${Number(quote.price).toFixed(2)}\n` +
            `שינוי יומי: ${isUp ? '+' : ''}${Number(quote.changePercent).toFixed(2)}%\n\n` +
            `⏰ ${new Date().toLocaleString('he-IL')}`;
          await client.sendMessage(settings.chatId, msg, { parse_mode: 'HTML' });
        } catch (err) {
          console.error(`Portfolio price alert error (${symbol}):`, err.message);
        }
      }
    }

    // --- E3: Breakout alerts ---
    await runBreakoutAlerts();

  } catch (err) {
    console.error('Price alert cron error:', err.message || err);
  }
}, { timezone: 'Asia/Jerusalem' });

if (bot) {
  cron.schedule('*/30 * * * *', async () => {
    console.log('🚨 Running entry alert job...');
    await runEntryAlerts();
  }, {
    timezone: 'Asia/Jerusalem'
  });

  // ── Cron: every minute — portfolio summaries + watchlist update ───────────
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    const timeZone = 'Asia/Jerusalem';
    const nowParts = getZonedParts(now, timeZone);

    const settingsList = await TelegramSettings.find({
      isActive: true,
      $or: [
        { summaryDailyEnabled: true },
        { summaryWeeklyEnabled: true },
        { summaryMonthlyEnabled: true },
        { notifyWatchlistUpdate: true }
      ]
    }).lean();

    for (const settings of settingsList) {
      const { hour: dailyHour, minute: dailyMinute } = parseTime(settings.summaryDailyTime);
      const { hour: weeklyHour, minute: weeklyMinute } = parseTime(settings.summaryWeeklyTime);
      const { hour: monthlyHour, minute: monthlyMinute } = parseTime(settings.summaryMonthlyTime);

      if (settings.summaryDailyEnabled) {
        const last = settings.lastDailySentAt ? getZonedParts(settings.lastDailySentAt, timeZone) : null;
        if (!last || !isSameDay(last, nowParts)) {
          if (nowParts.hour === dailyHour && nowParts.minute === dailyMinute) {
            await sendPortfolioSummary(settings, 'יומי');
            await TelegramSettings.updateOne(
              { _id: settings._id },
              { $set: { lastDailySentAt: now } }
            );
          }
        }
      }

      if (settings.summaryWeeklyEnabled) {
        const last = settings.lastWeeklySentAt ? getZonedParts(settings.lastWeeklySentAt, timeZone) : null;
        if (!last || !isSameWeek(last, nowParts)) {
          const weekday = weekdayToNumber(nowParts.weekday);
          if (weekday === settings.summaryWeeklyDay && nowParts.hour === weeklyHour && nowParts.minute === weeklyMinute) {
            await sendPortfolioSummary(settings, 'שבועי');
            await TelegramSettings.updateOne(
              { _id: settings._id },
              { $set: { lastWeeklySentAt: now } }
            );
          }
        }
      }

      if (settings.summaryMonthlyEnabled) {
        const last = settings.lastMonthlySentAt ? getZonedParts(settings.lastMonthlySentAt, timeZone) : null;
        if (!last || !isSameMonth(last, nowParts)) {
          if (nowParts.day === settings.summaryMonthlyDay && nowParts.hour === monthlyHour && nowParts.minute === monthlyMinute) {
            await sendPortfolioSummary(settings, 'חודשי');
            await TelegramSettings.updateOne(
              { _id: settings._id },
              { $set: { lastMonthlySentAt: now } }
            );
          }
        }
      }

      // E1 — Watchlist daily update at user-configured time
      if (settings.notifyWatchlistUpdate) {
        const { hour: wlHour, minute: wlMinute } = parseTime(settings.watchlistUpdateTime);
        if (nowParts.hour === wlHour && nowParts.minute === wlMinute) {
          // runWatchlistUpdate handles per-user cooldown (20h)
          await runWatchlistUpdate();
        }
      }
    }
  }, {
    timezone: 'Asia/Jerusalem'
  });
}

const handleWebhookUpdate = (update) => {
  if (bot) bot.processUpdate(update);
};

module.exports = {
  bot,
  sendPriceAlert,
  sendTestMessage,
  sendEntryAlert,
  handleWebhookUpdate,
};
