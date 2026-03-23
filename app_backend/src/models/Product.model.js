const mongoose = require('mongoose');
const { PRODUCT_STATUSES, MAX_RETURNS } = require('../utils/constants');

const ProductSchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  artisanId: { type: String, required: true },
  ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Pricing (basePrice is immutable after creation)
  basePrice: { type: Number, required: true, min: 0 },
  currentPrice: { type: Number, required: true, min: 0 },

  // Image verification
  imageCID: { type: String },
  imageHash: { type: String },

  // Ownership
  currentOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  currentOwnerOrg: { type: String },
  ownerCustomerHash: { type: String }, // SHA-256 of customer identity (after SOLD)

  // Status
  status: { type: String, enum: PRODUCT_STATUSES, default: 'REGISTERED' },

  // Return tracking
  returnCount: { type: Number, default: 0 },
  isRetired: { type: Boolean, default: false },

  // QR Code
  qrCodeData: { type: String },

  // References
  lifecycle: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lifecycle' }],
  margins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Margin' }],

  // Blockchain
  blockchainTxId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

ProductSchema.index({ currentOwnerOrg: 1, status: 1 });
ProductSchema.index({ artisanId: 1 });
ProductSchema.index({ ngoId: 1 });

// Prevent basePrice mutation after creation
ProductSchema.pre('save', function (next) {
  if (!this.isNew && this.isModified('basePrice')) {
    return next(new Error('basePrice is immutable after creation'));
  }
  // Auto-retire after max returns
  if (this.returnCount >= MAX_RETURNS) {
    this.isRetired = true;
    this.status = 'RETIRED';
  }
  next();
});

// Check ownership
ProductSchema.methods.isOwnedBy = function (userId) {
  return this.currentOwner && this.currentOwner.toString() === userId.toString();
};

module.exports = mongoose.model('Product', ProductSchema);
