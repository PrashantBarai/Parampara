const mongoose = require('mongoose');
const { PT_VALUE_INR } = require('../utils/constants');

const TokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  org: { type: String, required: true },
  balance: { type: Number, default: 0, min: 0 },

  transactions: [{
    type: { type: String, enum: ['EARNED', 'PENALTY', 'REDEEMED'] },
    amount: { type: Number },
    reason: { type: String },
    referenceId: { type: String },
    blockchainTxId: { type: String },
    timestamp: { type: Date, default: Date.now },
  }],

  totalEarned: { type: Number, default: 0 },
  totalPenalised: { type: Number, default: 0 },
  totalRedeemed: { type: Number, default: 0 },

  updatedAt: { type: Date, default: Date.now },
});

TokenSchema.methods.getValueInINR = function () {
  return this.balance * PT_VALUE_INR;
};

module.exports = mongoose.model('Token', TokenSchema);
