const mongoose = require('mongoose');
const { VERIFICATION_STATUSES } = require('../utils/constants');

const ArtisanSchema = new mongoose.Schema({
  artisanId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  craft: { type: String, required: true },
  location: { type: String, required: true },
  registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // GI Certificate
  giCertificateCID: { type: String },
  giCertificateHash: { type: String },

  // Verification
  verificationStatus: {
    type: String,
    enum: VERIFICATION_STATUSES,
    default: 'PENDING_VERIFICATION',
  },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date },
  rejectionReason: { type: String },

  // Fraud tracking
  flaggedAt: { type: Date },
  flagReason: { type: String },

  blockchainTxId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

ArtisanSchema.index({ verificationStatus: 1 });
ArtisanSchema.index({ registeredBy: 1 });

ArtisanSchema.statics.getPendingVerifications = function () {
  return this.find({ verificationStatus: 'PENDING_VERIFICATION' }).populate('registeredBy', 'name org');
};

ArtisanSchema.statics.getByNgo = function (ngoUserId) {
  return this.find({ registeredBy: ngoUserId });
};

module.exports = mongoose.model('Artisan', ArtisanSchema);
