const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const auth = require('../middleware/auth');

// Get all alerts for user
router.get('/', auth, async (req, res) => {
  try {
    const alerts = await Alert.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    console.error('Get alerts error:', err);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// Create alert
router.post('/', auth, async (req, res) => {
  try {
    const { symbol, condition, targetPrice } = req.body;
    if (!symbol || !condition || !targetPrice) {
      return res.status(400).json({ message: 'נא למלא את כל השדות' });
    }
    if (!['above', 'below'].includes(condition)) {
      return res.status(400).json({ message: 'תנאי לא תקין' });
    }
    const alert = await Alert.create({
      userId: req.user.id,
      symbol: symbol.toUpperCase(),
      condition,
      targetPrice: parseFloat(targetPrice)
    });
    res.status(201).json(alert);
  } catch (err) {
    console.error('Create alert error:', err);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// Delete alert
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await Alert.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!result) return res.status(404).json({ message: 'לא נמצא' });
    res.json({ message: 'נמחק בהצלחה' });
  } catch (err) {
    console.error('Delete alert error:', err);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

// Toggle alert active/inactive
router.patch('/:id/toggle', auth, async (req, res) => {
  try {
    const alert = await Alert.findOne({ _id: req.params.id, userId: req.user.id });
    if (!alert) return res.status(404).json({ message: 'לא נמצא' });
    alert.isActive = !alert.isActive;
    if (alert.isActive) alert.triggeredAt = null;
    await alert.save();
    res.json(alert);
  } catch (err) {
    console.error('Toggle alert error:', err);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

module.exports = router;
