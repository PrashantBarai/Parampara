const ScanLog = require('../models/scan.model');
const FraudService = require('../services/fraud.service');
const ProductService = require('../services/product.service');

/**
 * @route   POST /api/scan
 * @desc    Log a product scan
 * @access  Public
 */
exports.logScan = async (req, res) => {
  try {
    const { productId, location, userId } = req.body;

    // Validate required fields
    if (!productId || !location) {
      return res.status(400).json({
        success: false,
        message: 'Please provide productId and location'
      });
    }

    // Verify product exists
    const productExists = await ProductService.verifyProductExists(productId);
    if (!productExists) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Create scan log
    const scan = await ScanLog.create({
      productId,
      userId: userId || null,
      location,
      isFraud: false
    });

    res.status(201).json({
      success: true,
      message: 'Scan logged successfully',
      scan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   POST /api/scan/fraud-check
 * @desc    Check for fraud on a scan
 * @access  Public
 */
exports.checkFraud = async (req, res) => {
  try {
    const { productId, location } = req.body;

    // Validate required fields
    if (!productId || !location) {
      return res.status(400).json({
        success: false,
        message: 'Please provide productId and location'
      });
    }

    // Check for fraud
    const fraudCheck = await FraudService.checkFraud(productId, location);

    res.status(200).json({
      success: true,
      productId,
      fraudCheck
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   GET /api/scan/:productId/logs
 * @desc    Get all scan logs for a product
 * @access  Public
 */
exports.getScanLogs = async (req, res) => {
  try {
    const { productId } = req.params;

    const scanLogs = await ScanLog.find({ productId })
      .populate('userId', 'name email role')
      .sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      productId,
      scans: scanLogs.length,
      scanLogs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   GET /api/scan/:productId/fraud-stats
 * @desc    Get fraud statistics for a product
 * @access  Public
 */
exports.getFraudStats = async (req, res) => {
  try {
    const { productId } = req.params;

    const fraudStats = await FraudService.getFraudStats(productId);

    res.status(200).json({
      success: true,
      fraudStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   GET /api/scan/:productId/alert
 * @desc    Get fraud alert for a product
 * @access  Public
 */
exports.getFraudAlert = async (req, res) => {
  try {
    const { productId } = req.params;

    const alert = await FraudService.getProductFraudAlert(productId);

    res.status(200).json({
      success: true,
      alert
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   POST /api/scan/:scanId/mark-fraud
 * @desc    Mark a scan as fraudulent
 * @access  Private
 */
exports.markScanAsFraud = async (req, res) => {
  try {
    const { scanId } = req.params;
    const { reason } = req.body;

    const scan = await FraudService.markScanAsFraud(scanId, reason);

    res.status(200).json({
      success: true,
      message: 'Scan marked as fraudulent',
      scan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
