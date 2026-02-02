const express = require('express');
const router = express.Router();
const TradingGoals = require('../models/TradingGoals');
const auth = require('../middleware/auth');

// Get trading goals
router.get('/', auth, async (req, res) => {
  try {
    const goals = await TradingGoals.findOne({ userId: req.user.id });
    res.json(goals);
  } catch (err) {
    console.error('Get trading goals error:', err);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// Save trading goals
router.post('/', auth, async (req, res) => {
  try {
    const {
      baseCapital,
      targetCapital,
      weeklyReturn,
      calendarView,
      activeMonth,
      profitEntries
    } = req.body;

    const goals = await TradingGoals.findOneAndUpdate(
      { userId: req.user.id },
      {
        userId: req.user.id,
        baseCapital: Number(baseCapital) || 0,
        targetCapital: Number(targetCapital) || 0,
        weeklyReturn: Number(weeklyReturn) || 0,
        calendarView: calendarView || 'day',
        activeMonth: activeMonth ? new Date(activeMonth) : new Date(),
        profitEntries: profitEntries || { days: {}, weeks: {}, months: {} }
      },
      { upsert: true, new: true }
    );

    res.json(goals);
  } catch (err) {
    console.error('Save trading goals error:', err);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

module.exports = router;
