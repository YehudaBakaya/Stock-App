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
  priceThreshold: { 
    type: Number, 
    default: 5,
    min: 1,
    max: 50
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TelegramSettings', telegramSettingsSchema);