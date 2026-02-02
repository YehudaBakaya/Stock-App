const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const axios = require('axios');
const TelegramSettings = require('../models/TelegramSettings');
const Holding = require('../models/Holding');
const TradingGoals = require('../models/TradingGoals');

const token = process.env.TELEGRAM_BOT_TOKEN;
const TWELVE_API_KEY = process.env.TWELVEDATA_API_KEY;
const TWELVE_BASE_URL = 'https://api.twelvedata.com';
let bot = null;
const botCache = new Map();

// Initialize bot only if token exists
if (token && token !== 'your-telegram-bot-token') {
  bot = new TelegramBot(token, { polling: true });
  console.log('🤖 Telegram bot started');

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

💡 טיפ: ודא שהפעלת את ההתראות באפליקציה!
    `;
    
    bot.sendMessage(chatId, helpMessage);
  });

  // Handle /status command
  bot.onText(/\/status/, async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, '✅ הבוט פעיל ומחובר!');
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

// Send daily summary
const sendDailySummary = async (chatId, portfolioData, botToken) => {
  const client = getBotForToken(botToken);
  if (!client) return;
  
  const emoji = portfolioData.pnl >= 0 ? '🟢' : '🔴';
  
  const message = `
📊 <b>סיכום יומי</b>

💼 שווי תיק: $${portfolioData.totalValue.toLocaleString()}
${emoji} רווח/הפסד: ${portfolioData.pnl >= 0 ? '+' : ''}$${portfolioData.pnl.toFixed(2)}
📈 אחוז שינוי: ${portfolioData.pnl >= 0 ? '+' : ''}${portfolioData.pnlPercent.toFixed(2)}%

🏆 מניה מובילה: ${portfolioData.topStock || 'N/A'}
📉 מניה בפיגור: ${portfolioData.bottomStock || 'N/A'}

⏰ ${new Date().toLocaleString('he-IL')}
  `;
  
  try {
    await client.sendMessage(chatId, message, { parse_mode: 'HTML' });
  } catch (err) {
    console.error('Error sending daily summary:', err);
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

const sendPortfolioSummary = async (settings, frequencyLabel) => {
  const client = getBotForToken(settings.botToken);
  if (!client) return;

  const holdings = await Holding.find({ userId: settings.userId }).lean();
  const goals = await TradingGoals.findOne({ userId: settings.userId }).lean();

  const uniqueSymbols = [...new Set(holdings.map((holding) => holding.symbol))];
  const quotes = {};
  for (const symbol of uniqueSymbols) {
    try {
      const quote = await fetchQuote(symbol);
      const price = parseFloat(quote.price || 0);
      if (Number.isFinite(price) && price > 0) {
        quotes[symbol] = price;
      }
    } catch (err) {
      continue;
    }
  }

  const calcTotals = (filterFn) => {
    let value = 0;
    let cost = 0;
    holdings.filter(filterFn).forEach((holding) => {
      const price = quotes[holding.symbol] || holding.buyPrice;
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

  const message = `
📊 <b>סיכום תיק (${frequencyLabel})</b>

🧠 טווח ארוך
• שווי: ${formatCurrency(longTotals.value)}
• רווח/הפסד: ${longTotals.pnl >= 0 ? '+' : ''}${formatCurrency(longTotals.pnl)}
• שינוי: ${longTotals.pnlPercent.toFixed(2)}%

⚡ טריידים
• סה״כ הון: ${formatCurrency(tradeCapital)}
• תשואה שבועית: ${tradeWeeklyReturn.toFixed(2)}%

💼 סה״כ הון כולל: ${formatCurrency(totalEquity)}

⏰ עודכן: ${new Date().toLocaleString('he-IL')}
  `;

  await client.sendMessage(settings.chatId, message, { parse_mode: 'HTML' });
};

const alertCooldown = new Map();

const shouldSendAlert = (key, cooldownMs) => {
  const lastSent = alertCooldown.get(key);
  if (lastSent && Date.now() - lastSent < cooldownMs) {
    return false;
  }
  alertCooldown.set(key, Date.now());
  return true;
};

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

// Schedule daily summary at 18:00 Israel time
if (bot) {
  cron.schedule('0 18 * * *', async () => {
    console.log('📊 Running daily summary job...');
    // Here you would fetch all users with active notifications
    // and send them their daily summary
  }, {
    timezone: 'Asia/Jerusalem'
  });

  cron.schedule('*/30 * * * *', async () => {
    console.log('🚨 Running entry alert job...');
    await runEntryAlerts();
  }, {
    timezone: 'Asia/Jerusalem'
  });

  cron.schedule('* * * * *', async () => {
    const now = new Date();
    const timeZone = 'Asia/Jerusalem';
    const nowParts = getZonedParts(now, timeZone);

    const settingsList = await TelegramSettings.find({
      isActive: true,
      $or: [
        { summaryDailyEnabled: true },
        { summaryWeeklyEnabled: true },
        { summaryMonthlyEnabled: true }
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
    }
  }, {
    timezone: 'Asia/Jerusalem'
  });
}

module.exports = {
  bot,
  sendPriceAlert,
  sendDailySummary,
  sendTestMessage,
  sendEntryAlert
};
