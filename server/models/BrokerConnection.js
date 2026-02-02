const mongoose = require('mongoose');

const brokerConnectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  brokerName: {
    type: String,
    enum: ['Colmex', 'Interactive'],
    required: true
  },
  credentials: {
    type: Object,
    default: {}
  },
  connectedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

brokerConnectionSchema.index({ userId: 1, brokerName: 1 }, { unique: true });

module.exports = mongoose.model('BrokerConnection', brokerConnectionSchema);
