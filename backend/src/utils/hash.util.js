const crypto = require('crypto');

/**
 * Generate SHA256 hash from string
 * @param {string} data - Data to hash
 * @returns {string} - Hex encoded hash
 */
const generateSHA256Hash = (data) => {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex');
};

/**
 * Generate product ID using SHA256 hash
 * @param {Object} productData - Product data to generate ID from
 * @returns {string} - Generated product ID
 */
const generateProductId = (productData) => {
  const productString = JSON.stringify({
    name: productData.name,
    manufacturerName: productData.manufacturerName,
    origin: productData.origin,
    timestamp: Date.now()
  });
  return generateSHA256Hash(productString);
};

/**
 * Generate metadata hash from product metadata
 * @param {Object} metadata - Product metadata
 * @returns {string} - Metadata hash
 */
const generateMetadataHash = (metadata) => {
  const metadataString = JSON.stringify(metadata);
  return generateSHA256Hash(metadataString);
};

/**
 * Verify hash against original data
 * @param {string} data - Original data
 * @param {string} hash - Hash to verify against
 * @returns {boolean} - True if hash matches
 */
const verifyHash = (data, hash) => {
  return generateSHA256Hash(data) === hash;
};

module.exports = {
  generateSHA256Hash,
  generateProductId,
  generateMetadataHash,
  verifyHash
};
