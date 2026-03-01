const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  symbol: { type: String, required: true, uppercase: true, trim: true },
  type: { type: String, enum: ['buy', 'sell'], required: true },
  shares: { type: Number, required: true, min: 0 },
  price: { type: Number, required: true, min: 0 },
  portfolioType: { type: String, enum: ['long', 'trade'], default: 'long' },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
