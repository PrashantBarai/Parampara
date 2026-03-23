const mongoose = require('mongoose');

const scanLogSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: [true, 'Please provide product ID']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  location: {
    type: String,
    required: [true, 'Please provide location']
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isFraud: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('ScanLog', scanLogSchema);
