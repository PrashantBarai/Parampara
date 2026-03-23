const QRCode = require('qrcode');

/**
 * Generate QR code data URL for a product
 */
const generateQRCode = async (productId, baseUrl = '') => {
  const verifyUrl = `${baseUrl}/verify/${productId}`;
  const qrData = JSON.stringify({
    productId,
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
 * Generate QR code buffer for file storage
 */
const generateQRBuffer = async (productId) => {
  const qrData = JSON.stringify({
    productId,
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
};
