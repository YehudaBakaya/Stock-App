const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');

const token = process.env.TELEGRAM_BOT_TOKEN;
let bot = null;

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

// Send price alert
const sendPriceAlert = async (chatId, symbol, price, change) => {
  if (!bot) return;
  
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
    await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
  } catch (err) {
    console.error('Error sending price alert:', err);
  }
};

// Send daily summary
const sendDailySummary = async (chatId, portfolioData) => {
  if (!bot) return;
  
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
    await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
  } catch (err) {
    console.error('Error sending daily summary:', err);
  }
};

// Send test message
const sendTestMessage = async (chatId) => {
  if (!bot) {
    throw new Error('Telegram bot not configured');
  }
  
  const message = `
✅ <b>הודעת בדיקה</b>

🎉 ההתראות הוגדרו בהצלחה!
תקבל הודעות על שינויים בתיק שלך.

⏰ ${new Date().toLocaleString('he-IL')}
  `;
  
  await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
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
}

module.exports = {
  bot,
  sendPriceAlert,
  sendDailySummary,
  sendTestMessage
};