const express = require('express');
const router = express.Router();
const Holding = require('../models/Holding');
const auth = require('../middleware/auth');

// Get all holdings
router.get('/', auth, async (req, res) => {
  try {
    const holdings = await Holding.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    res.json(holdings);
  } catch (err) {
    console.error('Get holdings error:', err);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// Get single holding
router.get('/:id', auth, async (req, res) => {
  try {
    const holding = await Holding.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!holding) {
      return res.status(404).json({ message: 'החזקה לא נמצאה' });
    }

    res.json(holding);
  } catch (err) {
    console.error('Get holding error:', err);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// Add holding
router.post('/', auth, async (req, res) => {
  try {
    const { symbol, shares, buyPrice, buyDate } = req.body;

    // Validation
    if (!symbol || !shares || !buyPrice) {
      return res.status(400).json({ message: 'נא למלא את כל השדות' });
    }

    if (shares <= 0 || buyPrice <= 0) {
      return res.status(400).json({ message: 'ערכים לא תקינים' });
    }

    const holding = new Holding({
      userId: req.user.id,
      symbol: symbol.toUpperCase().trim(),
      shares: parseFloat(shares),
      buyPrice: parseFloat(buyPrice),
      buyDate: buyDate ? new Date(buyDate) : new Date()
    });

    await holding.save();
    res.status(201).json(holding);
  } catch (err) {
    console.error('Add holding error:', err);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// Update holding
router.put('/:id', auth, async (req, res) => {
  try {
    const { shares, buyPrice, buyDate } = req.body;

    const holding = await Holding.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { 
        shares: parseFloat(shares),
        buyPrice: parseFloat(buyPrice),
        buyDate: buyDate ? new Date(buyDate) : undefined
      },
      { new: true }
    );

    if (!holding) {
      return res.status(404).json({ message: 'החזקה לא נמצאה' });
    }

    res.json(holding);
  } catch (err) {
    console.error('Update holding error:', err);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// Delete holding
router.delete('/:id', auth, async (req, res) => {
  try {
    const holding = await Holding.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!holding) {
      return res.status(404).json({ message: 'החזקה לא נמצאה' });
    }

    res.json({ message: 'נמחק בהצלחה' });
  } catch (err) {
    console.error('Delete holding error:', err);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// Get portfolio summary
router.get('/summary/stats', auth, async (req, res) => {
  try {
    const holdings = await Holding.find({ userId: req.user.id });
    
    const totalCost = holdings.reduce((sum, h) => sum + (h.shares * h.buyPrice), 0);
    const totalShares = holdings.reduce((sum, h) => sum + h.shares, 0);
    const uniqueSymbols = [...new Set(holdings.map(h => h.symbol))];

    res.json({
      totalHoldings: holdings.length,
      totalCost,
      totalShares,
      uniqueSymbols: uniqueSymbols.length,
      symbols: uniqueSymbols
    });
  } catch (err) {
    console.error('Get summary error:', err);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

module.exports = router;