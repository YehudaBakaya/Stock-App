const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const axios = require('axios');
const TelegramSettings = require('../models/TelegramSettings');
const Holding = require('../models/Holding');

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
const sendTestMessage = async (chatId, botToken) => {
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
}

module.exports = {
  bot,
  sendPriceAlert,
  sendDailySummary,
  sendTestMessage,
  sendEntryAlert
};
