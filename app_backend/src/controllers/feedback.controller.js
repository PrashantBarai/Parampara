const Feedback = require('../models/Feedback.model');
const Product = require('../models/Product.model');
const Order = require('../models/Order.model');
const blockchainService = require('../services/blockchain.service');
const imageService = require('../services/image.service');
const { hashCustomerIdentity } = require('../utils/hash.util');

exports.submit = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    // Verify customer has an order for this product
    const order = await Order.findOne({ productId, buyerId: req.user.id });
    if (!order) return res.status(400).json({ success: false, error: 'FEED_002', message: 'No order for this product' });

    const customerHash = hashCustomerIdentity(req.user.id, req.user.email);
    let imageCID = '';
    if (req.file) imageCID = await imageService.uploadToIPFS(req.file.buffer, req.file.originalname);

    // LEDGER FIRST
    const txId = await blockchainService.submitTransaction(
      'CustomerOrg', 'AddFeedback', productId, customerHash, rating.toString(), comment || '', imageCID
    );

    const feedback = await Feedback.create({
      productId, customerHash, rating, comment, imageCID, blockchainTxId: txId,
    });

    res.status(201).json({ success: true, data: { feedback, txId } });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.getByProduct = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ productId: req.params.productId }).sort({ timestamp: -1 });
    const stats = await Feedback.getAverageRating(req.params.productId);
    res.json({ success: true, data: { feedbacks, stats } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
