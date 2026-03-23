const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  productId: { type: String, required: true, index: true },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  finalPrice: { type: Number, required: true },
  priceBreakdown: {
    basePrice: { type: Number },
    warehouseMargin: { type: Number, default: 0 },
    distributorMargin: { type: Number, default: 0 },
    retailerMargin: { type: Number, default: 0 },
    totalMargins: { type: Number },
  },
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'DELIVERED', 'RETURNED', 'CANCELLED'],
    default: 'PENDING',
  },
  blockchainTxId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

OrderSchema.index({ buyerId: 1, status: 1 });

module.exports = mongoose.model('Order', OrderSchema);
