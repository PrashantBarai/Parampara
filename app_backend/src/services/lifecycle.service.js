const Product = require('../models/Product.model');
const Lifecycle = require('../models/Lifecycle.model');
const Margin = require('../models/Margin.model');
const blockchainService = require('./blockchain.service');
const imageService = require('./image.service');
const pricingService = require('./pricing.service');
const { STAGE_MAP, RE_STAGE_MAP } = require('../utils/constants');

class LifecycleService {
  async addStage(user, productId, stageData, imageFile) {
    const product = await Product.findOne({ productId });
    if (!product) throw { status: 404, error: 'PROD_001', message: 'Product not found' };
    if (product.isRetired) throw { status: 400, error: 'RET_002', message: 'Product is RETIRED' };
    if (!product.isOwnedBy(user.id)) throw { status: 403, error: 'LIFE_002', message: 'Not current owner' };

    // Validate margin
    const validation = pricingService.validateMargin(product.basePrice, product.currentPrice, stageData.marginValue);
    if (!validation.valid) throw { status: 422, error: 'LIFE_003', message: validation.message };

    let imageCID = '', imageHash = '';
    if (imageFile) {
      imageCID = await imageService.uploadToIPFS(imageFile.buffer, imageFile.originalname);
      imageHash = imageService.getImageHash(imageFile.buffer);
    }

    const stage = product.returnCount > 0 ? (RE_STAGE_MAP[user.org] || stageData.stage) : (STAGE_MAP[user.org] || stageData.stage);

    // LEDGER FIRST
    const txId = await blockchainService.submitTransaction(
      user.org, 'AddLifecycle', productId, stage, user.org, imageCID, imageHash, stageData.location || ''
    );
    await blockchainService.submitTransaction(
      user.org, 'AddMargin', productId, user.org, stageData.marginValue.toString()
    );

    // Sync MongoDB
    const newPrice = product.currentPrice + stageData.marginValue;
    const lifecycle = await Lifecycle.create({
      productId, stage, org: user.org, userId: user.id,
      imageCID, imageHash, marginAdded: stageData.marginValue,
      priceAtStage: newPrice, location: stageData.location,
      isReturn: product.returnCount > 0, blockchainTxId: txId,
    });

    const margin = await Margin.create({
      productId, org: user.org, value: stageData.marginValue,
      percentage: ((stageData.marginValue / product.basePrice) * 100).toFixed(2),
    });

    product.currentPrice = newPrice;
    product.lifecycle.push(lifecycle._id);
    product.margins.push(margin._id);
    await product.save();

    return { lifecycle, margin, newPrice, txId };
  }

  async getJourney(productId) {
    return Lifecycle.getProductJourney(productId);
  }
}

module.exports = new LifecycleService();
