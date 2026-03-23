const ProductService = require('../services/product.service');
const BlockchainService = require('../services/blockchain.service');
const { generateQRCode, generateQRCodeBuffer } = require('../utils/qr.util');

/**
 * @route   POST /api/products/create
 * @desc    Create a new product (NGO only) - Registers on blockchain
 * @access  Private
 */
exports.createProduct = async (req, res) => {
  try {
    const { name, description, origin, manufacturerName, basePrice, imageHash, imageCID, location } = req.body;

    // Validate required fields
    if (!name || !description || !origin || !manufacturerName || !basePrice || !imageHash) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Create product in MongoDB
    const product = await ProductService.createProduct(
      {
        name,
        description,
        origin,
        manufacturerName,
        basePrice,
        imageHash,
        imageCID,
        location
      },
      req.user.id
    );

    // Register on blockchain (via NGOOrg)
    try {
      await BlockchainService.registerProductOnChain(
        {
          productId: product.productId,
          name,
          basePrice: parseFloat(basePrice),
          imageCID: imageCID || ''
        },
        'NGOOrg'
      );
      product.blockchainStatus = 'registered';
    } catch (blockchainError) {
      console.error('Blockchain registration failed:', blockchainError.message);
      product.blockchainStatus = 'pending';
      product.blockchainError = blockchainError.message;
    }

    // Generate QR code
    const qrCode = await generateQRCode(product.productId);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
      qrCode
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   GET /api/products/:productId
 * @desc    Get product by ID
 * @access  Public
 */
exports.getProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await ProductService.getProductById(productId);

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   GET /api/products
 * @desc    Get all products with filters
 * @access  Public
 */
exports.getAllProducts = async (req, res) => {
  try {
    const filters = {};

    if (req.query.status) filters.status = req.query.status;
    if (req.query.ngoId) filters.ngoId = req.query.ngoId;
    if (req.query.currentOwner) filters.currentOwner = req.query.currentOwner;

    const products = await ProductService.getAllProducts(filters);

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   PUT /api/products/:productId/status
 * @desc    Update product status
 * @access  Private
 */
exports.updateProductStatus = async (req, res) => {
  try {
    const { productId } = req.params;
    const { status } = req.body;

    const validStatuses = ['CREATED', 'IN_TRANSIT', 'DELIVERED', 'SOLD'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status provided'
      });
    }

    const product = await ProductService.updateProductStatus(productId, status);

    res.status(200).json({
      success: true,
      message: 'Product status updated',
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   GET /api/products/:productId/pricing
 * @desc    Get product pricing details
 * @access  Public
 */
exports.getProductPricing = async (req, res) => {
  try {
    const { productId } = req.params;

    const pricing = await ProductService.getProductPricing(productId);

    res.status(200).json({
      success: true,
      pricing
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   GET /api/products/:productId/qr
 * @desc    Get QR code for product
 * @access  Public
 */
exports.getProductQR = async (req, res) => {
  try {
    const { productId } = req.params;

    // Verify product exists
    const exists = await ProductService.verifyProductExists(productId);
    if (!exists) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const qrCode = await generateQRCode(productId);

    res.status(200).json({
      success: true,
      productId,
      qrCode
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
