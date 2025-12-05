const express = require('express');
const router = express.Router();
const TelegramSettings = require('../models/TelegramSettings');
const auth = require('../middleware/auth');
const { sendTestMessage } = require('../services/telegramBot');

// Get settings
router.get('/', auth, async (req, res) => {
  try {
    const settings = await TelegramSettings.findOne({ userId: req.user.id });
    res.json(settings);
  } catch (err) {
    console.error('Get telegram settings error:', err);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// Save settings
router.post('/', auth, async (req, res) => {
  try {
    const { chatId, isActive, notifyPriceChange, notifyDailySummary, priceThreshold } = req.body;

    if (!chatId) {
      return res.status(400).json({ message: 'נא להזין Chat ID' });
    }

    const settings = await TelegramSettings.findOneAndUpdate(
      { userId: req.user.id },
      {
        userId: req.user.id,
        chatId,
        isActive,
        notifyPriceChange,
        notifyDailySummary,
        priceThreshold
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

    await sendTestMessage(settings.chatId);
    res.json({ message: 'הודעת בדיקה נשלחה!' });
  } catch (err) {
    console.error('Test notification error:', err);
    res.status(500).json({ message: 'שגיאה בשליחת ההודעה' });
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