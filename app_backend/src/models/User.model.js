const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES, ALL_ORGS } = require('../utils/constants');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true, enum: ROLES },
  org: { type: String, required: true, enum: ALL_ORGS },
  location: { type: String, default: '' },
  aadhaarEncrypted: { type: String, default: '' },  // AES-256-CBC encrypted Aadhaar
  aadhaarLastFour: { type: String, default: '' },   // Last 4 digits for display (e.g. XXXX-XXXX-1234)
  kycVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});


UserSchema.index({ org: 1, role: 1 });

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

// Compare password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Strip sensitive fields
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.aadhaarEncrypted;  // Never expose encrypted Aadhaar in API responses
  delete obj.__v;
  return obj;
};

// Find users by org
UserSchema.statics.findByOrg = function (org) {
  return this.find({ org, isActive: true });
};

module.exports = mongoose.model('User', UserSchema);
