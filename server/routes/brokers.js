const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const BrokerConnection = require('../models/BrokerConnection');

router.get('/', auth, async (req, res) => {
  try {
    const connections = await BrokerConnection.find({ userId: req.user.id });
    res.json(connections);
  } catch (err) {
    console.error('Get broker connections error:', err);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { brokerName, credentials } = req.body;
    if (!brokerName) {
      return res.status(400).json({ message: 'חסר שם ברוקר' });
    }
    const connection = await BrokerConnection.findOneAndUpdate(
      { userId: req.user.id, brokerName },
      {
        userId: req.user.id,
        brokerName,
        credentials: credentials || {},
        connectedAt: new Date()
      },
      { upsert: true, new: true }
    );
    res.json(connection);
  } catch (err) {
    console.error('Save broker connection error:', err);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
});

module.exports = router;
