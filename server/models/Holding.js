const mongoose = require('mongoose');

const holdingSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  symbol: { 
    type: String, 
    required: true,
    uppercase: true,
    trim: true
  },
  shares: { 
    type: Number, 
    required: true,
    min: 0
  },
  buyPrice: { 
    type: Number, 
    required: true,
    min: 0
  },
  buyDate: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Compound index for user + symbol
holdingSchema.index({ userId: 1, symbol: 1 });

module.exports = mongoose.model('Holding', holdingSchema);  