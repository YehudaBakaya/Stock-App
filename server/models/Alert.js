const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  symbol: { type: String, required: true, uppercase: true, trim: true },
  condition: { type: String, enum: ['above', 'below'], required: true },
  targetPrice: { type: Number, required: true, min: 0 },
  isActive: { type: Boolean, default: true, index: true },
  triggeredAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);
