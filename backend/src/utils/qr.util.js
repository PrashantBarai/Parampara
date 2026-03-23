const QRCode = require('qrcode');

/**
 * Generate QR code from product ID
 * @param {string} productId - Product ID
 * @returns {Promise<string>} - QR code as data URL
 */
const generateQRCode = async (productId) => {
  try {
    const qrDataUrl = await QRCode.toDataURL(productId, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300
    });
    return qrDataUrl;
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
};

/**
 * Generate QR code as buffer (PNG)
 * @param {string} productId - Product ID
 * @returns {Promise<Buffer>} - QR code as PNG buffer
 */
const generateQRCodeBuffer = async (productId) => {
  try {
    const qrBuffer = await QRCode.toBuffer(productId, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300
    });
    return qrBuffer;
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
};

module.exports = {
  generateQRCode,
  generateQRCodeBuffer
};
