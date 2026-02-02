const express = require('express');
const router = express.Router();
const TelegramSettings = require('../models/TelegramSettings');
const auth = require('../middleware/auth');
const { sendTestMessage } = require('../services/telegramBot');

// Get settings
router.get('/', auth, async (req, res) => {
  try {
    const settings = await TelegramSettings.findOne({ userId: req.user.id });
    const publicToken = process.env.TELEGRAM_PUBLIC_TOKEN || '';
    if (!settings) {
      return res.json({ publicToken });
    }
    const payload = settings.toObject();
    payload.publicToken = publicToken;
    res.json(payload);
  } catch (err) {
    console.error('Get telegram settings error:', err);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// Save settings
router.post('/', auth, async (req, res) => {
  try {
    const {
      chatId,
      botToken,
      isActive,
      notifyPriceChange,
      notifyDailySummary,
      notifyEntryAlerts,
      priceThreshold,
      entryChangeThreshold,
      entryVolumeMultiplier,
      summaryDailyEnabled,
      summaryWeeklyEnabled,
      summaryMonthlyEnabled,
      summaryDailyTime,
      summaryWeeklyDay,
      summaryWeeklyTime,
      summaryMonthlyDay,
      summaryMonthlyTime
    } = req.body;

    if (!chatId) {
      return res.status(400).json({ message: 'נא להזין Chat ID' });
    }

    const settings = await TelegramSettings.findOneAndUpdate(
      { userId: req.user.id },
      {
        userId: req.user.id,
        chatId,
        botToken: botToken || '',
        isActive,
        notifyPriceChange,
        notifyDailySummary,
        priceThreshold,
        notifyEntryAlerts,
        entryChangeThreshold,
        entryVolumeMultiplier,
        summaryDailyEnabled: !!summaryDailyEnabled,
        summaryWeeklyEnabled: !!summaryWeeklyEnabled,
        summaryMonthlyEnabled: !!summaryMonthlyEnabled,
        summaryDailyTime: summaryDailyTime || '20:00',
        summaryWeeklyDay: Number.isFinite(summaryWeeklyDay) ? summaryWeeklyDay : 5,
        summaryWeeklyTime: summaryWeeklyTime || '20:00',
        summaryMonthlyDay: Number.isFinite(summaryMonthlyDay) ? summaryMonthlyDay : 1,
        summaryMonthlyTime: summaryMonthlyTime || '20:00'
      },
      { upsert: true, new: true }
    );

    res.json(settings);
  } catch (err) {
    console.error('Save telegram settings error:', err);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// Test notification
router.post('/test', auth, async (req, res) => {
  try {
    const settings = await TelegramSettings.findOne({ userId: req.user.id });
    
    if (!settings || !settings.chatId) {
      return res.status(400).json({ message: 'לא הוגדר Chat ID' });
    }

    await sendTestMessage(settings.chatId, settings.botToken, settings.userId);
    res.json({ message: 'הודעת בדיקה נשלחה!' });
  } catch (err) {
    console.error('Test notification error:', err);
    const details = err.response?.body?.description || err.message || 'Unknown error';
    res.status(500).json({ message: 'שגיאה בשליחת ההודעה', details });
  }
});

// Delete settings
router.delete('/', auth, async (req, res) => {
  try {
    await TelegramSettings.findOneAndDelete({ userId: req.user.id });
    res.json({ message: 'ההגדרות נמחקו' });
  } catch (err) {
    console.error('Delete telegram settings error:', err);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

module.exports = router;
