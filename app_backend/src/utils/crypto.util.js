/**
 * crypto.util.js — AES-256-CBC Encryption for Aadhaar KYC
 * 
 * Uses Node.js built-in crypto module.
 * Encrypts Aadhaar numbers before storing in MongoDB.
 * Only decryptable with the server's ENCRYPTION_KEY.
 * 
 * The encrypted value is stored as:  iv:encryptedData (hex)
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const KEY = crypto.scryptSync(
  process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'default-encryption-key',
  'parampara-salt',
  32
);

/**
 * Encrypt a plaintext Aadhaar number
 * @param {string} aadhaar - 12-digit Aadhaar number
 * @returns {string} - Encrypted string in format "iv:ciphertext"
 */
function encryptAadhaar(aadhaar) {
  if (!aadhaar || aadhaar.length !== 12) {
    throw new Error('Aadhaar must be exactly 12 digits');
  }

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(aadhaar, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt an encrypted Aadhaar number
 * @param {string} encryptedData - Encrypted string in format "iv:ciphertext"
 * @returns {string} - Original 12-digit Aadhaar number
 */
function decryptAadhaar(encryptedData) {
  if (!encryptedData || !encryptedData.includes(':')) {
    throw new Error('Invalid encrypted data format');
  }

  const [ivHex, encrypted] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Get masked Aadhaar for display (XXXX-XXXX-1234)
 * @param {string} aadhaar - 12-digit Aadhaar
 * @returns {string} - Masked version
 */
function maskAadhaar(aadhaar) {
  if (!aadhaar || aadhaar.length !== 12) return 'XXXX-XXXX-XXXX';
  return `XXXX-XXXX-${aadhaar.slice(-4)}`;
}

module.exports = { encryptAadhaar, decryptAadhaar, maskAadhaar };
