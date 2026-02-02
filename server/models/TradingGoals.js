const mongoose = require('mongoose');

const tradingGoalsSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true
  },
  baseCapital: {
    type: Number,
    default: 0
  },
  targetCapital: {
    type: Number,
    default: 0
  },
  weeklyReturn: {
    type: Number,
    default: 0
  },
  calendarView: {
    type: String,
    enum: ['day', 'week', 'month'],
    default: 'day'
  },
  activeMonth: {
    type: Date,
    default: Date.now
  },
  profitEntries: {
    days: { type: Object, default: {} },
    weeks: { type: Object, default: {} },
    months: { type: Object, default: {} }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TradingGoals', tradingGoalsSchema);
