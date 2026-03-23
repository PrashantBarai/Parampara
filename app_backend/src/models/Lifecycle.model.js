const mongoose = require('mongoose');
const { LIFECYCLE_STAGES } = require('../utils/constants');

const LifecycleSchema = new mongoose.Schema({
  productId: { type: String, required: true, index: true },
  stage: { type: String, required: true, enum: LIFECYCLE_STAGES },
  org: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  imageCID: { type: String },
  imageHash: { type: String },

  marginAdded: { type: Number, default: 0 },
  priceAtStage: { type: Number, required: true },

  location: { type: String },
  coordinates: { lat: Number, lng: Number },

  isReturn: { type: Boolean, default: false },

  blockchainTxId: { type: String },
  timestamp: { type: Date, default: Date.now },
});

LifecycleSchema.index({ productId: 1, timestamp: 1 });
LifecycleSchema.index({ org: 1 });

LifecycleSchema.statics.getProductJourney = function (productId) {
  return this.find({ productId }).sort({ timestamp: 1 }).populate('userId', 'name org');
};

module.exports = mongoose.model('Lifecycle', LifecycleSchema);
