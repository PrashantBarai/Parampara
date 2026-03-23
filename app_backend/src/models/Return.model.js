const mongoose = require('mongoose');

const ReturnSchema = new mongoose.Schema({
  returnId: { type: String, required: true, unique: true },
  productId: { type: String, required: true, index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  imageCID: { type: String },
  imageHash: { type: String },
  returnNumber: { type: Number, required: true },
  status: {
    type: String,
    enum: ['INITIATED', 'IN_TRANSIT', 'RECEIVED_BY_WAREHOUSE', 'REPAIRED', 'REJECTED'],
    default: 'INITIATED',
  },
  warehouseNotes: { type: String },
  blockchainTxId: { type: String },
  createdAt: { type: Date, default: Date.now },
});


module.exports = mongoose.model('Return', ReturnSchema);
