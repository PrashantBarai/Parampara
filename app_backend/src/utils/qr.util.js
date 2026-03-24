const QRCode = require('qrcode');
const CryptoJS = require('crypto-js');

const QR_HMAC_SECRET = process.env.QR_HMAC_SECRET || 'parampara_qr_hmac_default';

/**
 * Generate HMAC signature for a productId
 */
const generateQRSignature = (productId) => {
  return CryptoJS.HmacSHA256(productId, QR_HMAC_SECRET).toString();
};

/**
 * Verify QR HMAC signature
 */
const verifyQRSignature = (productId, sig) => {
  const expected = generateQRSignature(productId);
  return expected === sig;
};

/**
 * Generate QR code data URL for a product (with HMAC signature)
 */
const generateQRCode = async (productId, baseUrl = '') => {
  const verifyUrl = `${baseUrl}/verify/${productId}`;
  const sig = generateQRSignature(productId);
  const qrData = JSON.stringify({
    productId,
    sig,
    verifyUrl,
    platform: 'ParamparaChain',
  });

  const dataUrl = await QRCode.toDataURL(qrData, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    width: 400,
    margin: 2,
    color: {
      dark: '#1a1a2e',
      light: '#ffffff',
    },
  });

  return { dataUrl, qrData, verifyUrl };
};

/**
 * Generate QR code buffer for file storage (with HMAC signature)
 */
const generateQRBuffer = async (productId) => {
  const sig = generateQRSignature(productId);
  const qrData = JSON.stringify({
    productId,
    sig,
    platform: 'ParamparaChain',
  });

  return QRCode.toBuffer(qrData, {
    errorCorrectionLevel: 'H',
    type: 'png',
    width: 400,
  });
};

module.exports = {
  generateQRCode,
  generateQRBuffer,
  generateQRSignature,
  verifyQRSignature,
};
