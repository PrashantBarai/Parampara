const LifecycleService = require('../services/lifecycle.service');
const PricingService = require('../services/pricing.service');
const BlockchainService = require('../services/blockchain.service');

/**
 * @route   POST /api/lifecycle/transfer
 * @desc    Transfer product ownership and record on blockchain
 * @access  Private
 */
exports.transferOwnership = async (req, res) => {
  try {
    const { productId, toUserId, marginAdded, imageCID, imageHash, location, status, org } = req.body;

    // Validate required fields
    if (!productId || !toUserId || imageHash === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Validate transfer is allowed
    await LifecycleService.validateTransfer(productId, req.user.id);

    // Transfer ownership in MongoDB
    const result = await LifecycleService.transferOwnership(
      productId,
      req.user.id,
      toUserId,
      marginAdded || 0,
      { imageCID, imageHash, location, status }
    );

    // Record on blockchain (via specified org or from req.user.org)
    const callingOrg = org || req.user.org || 'WarehouseOrg';
    try {
      await BlockchainService.transferOwnershipOnChain(productId, toUserId, callingOrg);
      result.blockchainStatus = 'recorded';
    } catch (blockchainError) {
      console.error('Blockchain transfer failed:', blockchainError.message);
      result.blockchainStatus = 'pending';
      result.blockchainError = blockchainError.message;
    }

    res.status(200).json({
      success: true,
      message: 'Product transferred successfully',
      product: result.product,
      lifecycle: result.lifecycle,
      blockchainStatus: result.blockchainStatus
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   GET /api/lifecycle/:productId
 * @desc    Get full lifecycle of a product
 * @access  Public
 */
exports.getProductLifecycle = async (req, res) => {
  try {
    const { productId } = req.params;

    const lifecycle = await LifecycleService.getProductLifecycle(productId);

    res.status(200).json({
      success: true,
      productId,
      stages: lifecycle.length,
      lifecycle
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   GET /api/lifecycle/:productId/current
 * @desc    Get current stage of product
 * @access  Public
 */
exports.getCurrentStage = async (req, res) => {
  try {
    const { productId } = req.params;

    const currentStage = await LifecycleService.getCurrentStage(productId);

    res.status(200).json({
      success: true,
      currentStage
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   GET /api/lifecycle/:productId/stage/:stage
 * @desc    Get lifecycle entries for a specific stage
 * @access  Public
 */
exports.getLifecycleByStage = async (req, res) => {
  try {
    const { productId, stage } = req.params;

    const validStages = ['NGO', 'DISTRIBUTOR', 'RETAILER'];
    if (!validStages.includes(stage)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid stage provided'
      });
    }

    const entries = await LifecycleService.getLifecycleByStage(productId, stage);

    res.status(200).json({
      success: true,
      stage,
      entries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   GET /api/lifecycle/:productId/margins
 * @desc    Get margin breakdown for a product
 * @access  Public
 */
exports.getMarginBreakdown = async (req, res) => {
  try {
    const { productId } = req.params;

    const breakdown = await LifecycleService.getMarginBreakdown(productId);

    res.status(200).json({
      success: true,
      breakdown
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};
