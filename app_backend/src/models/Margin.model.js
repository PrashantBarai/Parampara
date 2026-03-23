const mongoose = require('mongoose');

const MarginSchema = new mongoose.Schema({
  productId: { type: String, required: true, index: true },
  org: { type: String, required: true },
  value: { type: Number, required: true, min: 0 },
  percentage: { type: Number },
  timestamp: { type: Date, default: Date.now },
});

MarginSchema.index({ productId: 1, org: 1 });

module.exports = mongoose.model('Margin', MarginSchema);
