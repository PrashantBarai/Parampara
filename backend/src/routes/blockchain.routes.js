const express = require('express');
const BlockchainService = require('../services/blockchain.service');

const router = express.Router();

/**
 * @route   GET /api/blockchain/organizations
 * @desc    Get all available organizations on the blockchain
 * @access  Public
 */
router.get('/organizations', (req, res) => {
  try {
    const orgs = BlockchainService.getAvailableOrganizations();
    res.status(200).json({
      success: true,
      organizations: orgs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   GET /api/blockchain/organizations/:org/functions
 * @desc    Get available functions for an organization
 * @access  Public
 */
router.get('/organizations/:org/functions', (req, res) => {
  try {
    const { org } = req.params;
    const functions = BlockchainService.getAvailableFunctions(org);

    if (!functions || functions.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Organization ${org} not found or has no available functions`
      });
    }

    res.status(200).json({
      success: true,
      organization: org,
      availableFunctions: functions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   GET /api/blockchain/product/:productId
 * @desc    Get product from blockchain
 * @access  Public
 */
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { org } = req.query;

    const result = await BlockchainService.getProductFromChain(productId, org || 'NGOOrg');

    res.status(200).json({
      success: true,
      product: result
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   GET /api/blockchain/product/:productId/history
 * @desc    Get product history from blockchain
 * @access  Public
 */
router.get('/product/:productId/history', async (req, res) => {
  try {
    const { productId } = req.params;
    const { org } = req.query;

    const result = await BlockchainService.getHistoryFromChain(productId, org || 'NGOOrg');

    res.status(200).json({
      success: true,
      history: result
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   POST /api/blockchain/initialize
 * @desc    Initialize blockchain network (development only)
 * @access  Private (admin)
 */
router.post('/initialize', async (req, res) => {
  try {
    const result = await BlockchainService.initializeNetwork();

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
