const ScanLog = require('../models/ScanLog.model');
const Product = require('../models/Product.model');
const Lifecycle = require('../models/Lifecycle.model');
const fraudService = require('../services/fraud.service');
const { verifyQRSignature } = require('../utils/qr.util');

exports.scan = async (req, res) => {
  try {
    const { productId, location, coordinates, sig } = req.body;
    const product = await Product.findOne({ productId }).populate('ngoId', 'name');
    if (!product) return res.status(404).json({ success: false, error: 'SCAN_001', message: 'Product not found' });

    // Validate QR signature if provided
    let sigValid = null;
    if (sig) {
      sigValid = verifyQRSignature(productId, sig);
      if (!sigValid) {
        console.warn(`⚠️ Invalid QR signature for product ${productId}`);
      }
    }

    // Log the scan
    const scanLog = await ScanLog.create({
      productId, scannedBy: req.user?.id, anonymousId: req.headers['x-anonymous-id'],
      location, coordinates, userAgent: req.headers['user-agent'],
      qrSignatureValid: sigValid,
    });

    // Run fraud detection in background (doesn't block response)
    const fraudResult = await fraudService.analyzeScan(productId, { location, coordinates });
    if (fraudResult.isFraud) {
      scanLog.isFraud = true;
      scanLog.fraudReason = fraudResult.reasons.join('; ');
      await scanLog.save();
    }

    // ALWAYS return full product details (public scan)
    const lifecycle = await Lifecycle.find({ productId }).sort({ timestamp: 1 });

    res.json({
      success: true,
      data: {
        product: {
          productId: product.productId, name: product.name, description: product.description,
          basePrice: product.basePrice, currentPrice: product.currentPrice,
          artisanId: product.artisanId, status: product.status,
          imageCID: product.imageCID, currentOwnerOrg: product.currentOwnerOrg,
          registeredBy: product.ngoId?.name,
        },
        journey: lifecycle,
        qrSignatureValid: sigValid,
        fraudAlert: fraudResult.isFraud ? { severity: fraudResult.severity, reasons: fraudResult.reasons } : null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
