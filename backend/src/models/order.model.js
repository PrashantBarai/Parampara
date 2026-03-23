const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: [true, 'Please provide product ID']
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide buyer ID']
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide seller ID']
  },
  finalPrice: {
    type: Number,
    required: [true, 'Please provide final price']
  },
  priceBreakdown: {
    basePrice: {
      type: Number,
      required: true
    },
    distributorMargin: {
      type: Number,
      default: 0
    },
    retailerMargin: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', orderSchema);
