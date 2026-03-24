const mongoose = require('mongoose');

const ScanLogSchema = new mongoose.Schema({
  productId: { type: String, required: true, index: true },
  scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  anonymousId: { type: String },
  location: { type: String },
  coordinates: { lat: Number, lng: Number },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now },
  isFraud: { type: Boolean, default: false },
  fraudReason: { type: String },
  ownerMismatch: { type: Boolean, default: false },
  qrSignatureValid: { type: Boolean, default: null },
});

ScanLogSchema.index({ productId: 1, timestamp: -1 });
ScanLogSchema.index({ isFraud: 1 });

ScanLogSchema.statics.getRecentScans = function (productId, hours = 1) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  return this.find({ productId, timestamp: { $gte: since } }).sort({ timestamp: -1 });
};

ScanLogSchema.statics.getFraudulent = function () {
  return this.find({ isFraud: true }).sort({ timestamp: -1 });
};

module.exports = mongoose.model('ScanLog', ScanLogSchema);
