const mongoose = require('mongoose');

const lifecycleSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: [true, 'Please provide product ID']
  },
  stage: {
    type: String,
    enum: ['NGO', 'DISTRIBUTOR', 'RETAILER'],
    required: [true, 'Please provide stage']
  },
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide actor ID']
  },
  role: {
    type: String,
    enum: ['NGO', 'DISTRIBUTOR', 'RETAILER'],
    required: [true, 'Please provide role']
  },
  imageCID: {
    type: String,
    default: null
  },
  imageHash: {
    type: String,
    required: [true, 'Please provide image hash']
  },
  priceAtStage: {
    type: Number,
    required: [true, 'Please provide price at stage']
  },
  marginAdded: {
    type: Number,
    default: 0
  },
  location: {
    type: String,
    required: [true, 'Please provide location']
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Lifecycle', lifecycleSchema);
