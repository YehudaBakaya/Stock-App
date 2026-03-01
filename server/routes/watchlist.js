const express = require('express');
const router = express.Router();
const Watchlist = require('../models/Watchlist');
const auth = require('../middleware/auth');

// Get all watchlist items
router.get('/', auth, async (req, res) => {
  try {
    const items = await Watchlist.find({ userId: req.user.id }).sort({ addedAt: -1 });
    res.json(items);
  } catch (err) {
    console.error('Get watchlist error:', err);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// Add to watchlist
router.post('/', auth, async (req, res) => {
  try {
    const { symbol } = req.body;
    if (!symbol) return res.status(400).json({ message: 'נדרש סמל מניה' });

    const existing = await Watchlist.findOne({ userId: req.user.id, symbol: symbol.toUpperCase() });
    if (existing) return res.status(409).json({ message: 'המניה כבר ברשימת המעקב' });

    const item = await Watchlist.create({ userId: req.user.id, symbol: symbol.toUpperCase() });
    res.status(201).json(item);
  } catch (err) {
    console.error('Add watchlist error:', err);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// Remove from watchlist
router.delete('/:symbol', auth, async (req, res) => {
  try {
    const result = await Watchlist.findOneAndDelete({
      userId: req.user.id,
      symbol: req.params.symbol.toUpperCase()
    });
    if (!result) return res.status(404).json({ message: 'לא נמצא' });
    res.json({ message: 'הוסר בהצלחה' });
  } catch (err) {
    console.error('Remove watchlist error:', err);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

module.exports = router;
