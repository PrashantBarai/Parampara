const imageService = require('../services/image.service');
const Product = require('../models/Product.model');
const blockchainService = require('../services/blockchain.service');

exports.verifyImage = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!req.file) return res.status(400).json({ success: false, error: 'IMG_001', message: 'Image file required' });

    const product = await Product.findOne({ productId });
    if (!product) return res.status(404).json({ success: false, error: 'PROD_001', message: 'Product not found' });

    const result = imageService.verifyImage(req.file.buffer, product.imageHash);
    res.json({
      success: true,
      data: {
        productId, isAuthentic: result.match,
        originalHash: result.originalHash, uploadedHash: result.uploadedHash,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
