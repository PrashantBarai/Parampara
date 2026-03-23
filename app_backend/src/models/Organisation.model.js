const mongoose = require('mongoose');
const { ORG_TYPES } = require('../utils/constants');

const OrganisationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  type: { type: String, required: true, enum: ORG_TYPES },
  mspId: { type: String, required: true },
  peerUrl: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

OrganisationSchema.statics.findByMspId = function (mspId) {
  return this.findOne({ mspId });
};

module.exports = mongoose.model('Organisation', OrganisationSchema);
