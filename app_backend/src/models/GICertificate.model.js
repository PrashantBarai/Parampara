const mongoose = require('mongoose');

const GICertificateSchema = new mongoose.Schema({
  certificateId: { type: String, required: true, unique: true },
  artisanId: { type: String, required: true, index: true },
  certificateCID: { type: String, required: true },
  certificateHash: { type: String, required: true },
  issuedBy: { type: String },
  issuedDate: { type: Date },
  expiryDate: { type: Date },
  craftType: { type: String },
  region: { type: String },

  validationStatus: {
    type: String,
    enum: ['PENDING', 'VALID', 'INVALID', 'EXPIRED'],
    default: 'PENDING',
  },
  validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  validatedAt: { type: Date },

  blockchainTxId: { type: String },
  createdAt: { type: Date, default: Date.now },
});


module.exports = mongoose.model('GICertificate', GICertificateSchema);
