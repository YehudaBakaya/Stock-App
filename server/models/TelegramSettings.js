const mongoose = require('mongoose');

const telegramSettingsSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true
  },
  chatId: { 
    type: String, 
    required: true 
  },
  botToken: {
    type: String,
    default: ''
  },
  isActive: { 
    type: Boolean, 
    default: false 
  },
  notifyPriceChange: { 
    type: Boolean, 
    default: true 
  },
  notifyDailySummary: { 
    type: Boolean, 
    default: true 
  },
  notifyEntryAlerts: {
    type: Boolean,
    default: true
  },
  priceThreshold: { 
    type: Number, 
    default: 5,
    min: 1,
    max: 50
  },
  entryChangeThreshold: {
    type: Number,
    default: 3,
    min: 0.5,
    max: 50
  },
  entryVolumeMultiplier: {
    type: Number,
    default: 2,
    min: 1,
    max: 10
  },
  summaryDailyEnabled: {
    type: Boolean,
    default: false
  },
  summaryWeeklyEnabled: {
    type: Boolean,
    default: false
  },
  summaryMonthlyEnabled: {
    type: Boolean,
    default: false
  },
  summaryDailyTime: {
    type: String,
    default: '20:00'
  },
  summaryWeeklyDay: {
    type: Number,
    default: 5,
    min: 0,
    max: 6
  },
  summaryWeeklyTime: {
    type: String,
    default: '20:00'
  },
  summaryMonthlyDay: {
    type: Number,
    default: 1,
    min: 1,
    max: 28
  },
  summaryMonthlyTime: {
    type: String,
    default: '20:00'
  },
  lastDailySentAt: {
    type: Date
  },
  lastWeeklySentAt: {
    type: Date
  },
  lastMonthlySentAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TelegramSettings', telegramSettingsSchema);
