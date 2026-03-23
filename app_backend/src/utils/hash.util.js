const crypto = require('crypto');

/**
 * Generate SHA-256 hash of a buffer or string
 */
const sha256 = (input) => {
  const data = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Hash customer identity for privacy-preserving on-chain storage
 */
const hashCustomerIdentity = (userId, email) => {
  return sha256(`${userId}:${email}`);
};

/**
 * Hash image buffer for verification
 */
const hashImage = (buffer) => {
  return sha256(buffer);
};

/**
 * Compare two hashes
 */
const compareHashes = (hash1, hash2) => {
  return hash1 === hash2;
};

module.exports = {
  sha256,
  hashCustomerIdentity,
  hashImage,
  compareHashes,
};
