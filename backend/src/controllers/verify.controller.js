const ImageService = require('../services/image.service');

/**
 * @route   POST /api/verify/image
 * @desc    Verify product image
 * @access  Public
 */
exports.verifyImage = async (req, res) => {
  try {
    const { productId, uploadedImageHash } = req.body;

    // Validate required fields
    if (!productId || !uploadedImageHash) {
      return res.status(400).json({
        success: false,
        message: 'Please provide productId and uploadedImageHash'
      });
    }

    const result = await ImageService.verifyImage(productId, uploadedImageHash);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   POST /api/verify/images
 * @desc    Batch verify images
 * @access  Public
 */
exports.batchVerifyImages = async (req, res) => {
  try {
    const { verificationData } = req.body;

    // Validate required fields
    if (!Array.isArray(verificationData) || verificationData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of verificationData'
      });
    }

    const results = await ImageService.batchVerifyImages(verificationData);

    res.status(200).json({
      success: true,
      ...results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   POST /api/verify/compare-hashes
 * @desc    Compare two image hashes
 * @access  Public
 */
exports.compareHashes = async (req, res) => {
  try {
    const { hash1, hash2 } = req.body;

    // Validate required fields
    if (!hash1 || !hash2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide hash1 and hash2'
      });
    }

    const comparison = ImageService.compareImageHashes(hash1, hash2);

    res.status(200).json({
      success: true,
      comparison
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   POST /api/verify/cid
 * @desc    Validate image CID
 * @access  Public
 */
exports.validateCID = async (req, res) => {
  try {
    const { cid } = req.body;

    // Validate required fields
    if (!cid) {
      return res.status(400).json({
        success: false,
        message: 'Please provide CID'
      });
    }

    const validation = await ImageService.validateImageCID(cid);

    res.status(200).json({
      success: true,
      ...validation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   GET /api/verify/:productId/history
 * @desc    Get image verification history
 * @access  Public
 */
exports.getVerificationHistory = async (req, res) => {
  try {
    const { productId } = req.params;

    const history = await ImageService.getImageVerificationHistory(productId);

    res.status(200).json({
      success: true,
      history
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};
