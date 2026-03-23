const Product = require('../models/Product.model');
const Lifecycle = require('../models/Lifecycle.model');
const Margin = require('../models/Margin.model');
const Artisan = require('../models/Artisan.model');
const blockchainService = require('./blockchain.service');
const imageService = require('./image.service');
const pricingService = require('./pricing.service');
const { generateQRCode } = require('../utils/qr.util');
const { v4: uuidv4 } = require('uuid');

class ProductService {
  /**
   * NGO Workspace: Register a new Product
   * token — required to call Fabric Gateway (Port 4000)
   */
  async createProduct(ngoUser, productData, imageFile, token) {
    // 1. Verify artisan is VERIFIED (Off-chain check)
    const artisan = await Artisan.findOne({ artisanId: productData.artisanId });
    if (!artisan || artisan.verificationStatus !== 'VERIFIED') {
      throw { status: 400, error: 'PROD_004', message: 'Artisan must be VERIFIED before product registration' };
    }

    const productId = `PROD-${uuidv4().slice(0, 8).toUpperCase()}`;
    let imageCID = '', imageHash = '';

    // 2. IPFS Storage (Off-chain image)
    if (imageFile) {
      try {
        imageCID = await imageService.uploadToIPFS(imageFile.buffer, imageFile.originalname);
        imageHash = imageService.getImageHash(imageFile.buffer);
      } catch (err) {
        console.warn('⚠️ IPFS Upload failed, continuing without image:', err.message);
      }
    }

    // 3. LEDGER REGISTRATION (On-chain via Port 4000)
    // Passes user token to the bridge
    const ledgerResult = await blockchainService.registerProduct({
      productId,
      name: productData.name,
      description: productData.description || '',
      artisanId: productData.artisanId,
      basePrice: productData.basePrice
    }, token);

    // 4. Sync to MongoDB (Off-chain indexed storage)
    const qr = await generateQRCode(productId);
    const product = await Product.create({
      productId,
      name: productData.name,
      description: productData.description,
      artisanId: productData.artisanId,
      ngoId: ngoUser.id,
      basePrice: productData.basePrice,
      currentPrice: productData.basePrice,
      imageCID,
      imageHash,
      currentOwner: ngoUser.id,
      currentOwnerOrg: ngoUser.org,
      status: 'REGISTERED',
      qrCodeData: qr.dataUrl,
      blockchainTxId: ledgerResult.txId || 'CC_INVOKE_SUCCESS'
    });

    return { product, qrCode: qr.dataUrl, ledgerResult };
  }

  async getProduct(productId, token) {
    const product = await Product.findOne({ productId })
      .populate('ngoId', 'name org').populate('currentOwner', 'name org');
    if (!product) throw { status: 404, error: 'PROD_001', message: 'Product not found' };

    // Hybrid details: Mongo + Blockchain History
    const margins = await Margin.find({ productId });
    const breakdown = pricingService.getPriceBreakdown(product, margins);
    
    let history = [];
    try {
      history = await blockchainService.getHistory(productId, token);
    } catch (err) {
      console.warn('⚠️ Ledger history fetch failed:', err.message);
    }

    return { product, priceBreakdown: breakdown, history };
  }

  async getAllProducts(filters = {}, page = 1, limit = 20) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.org) query.currentOwnerOrg = filters.org;
    if (filters.artisanId) query.artisanId = filters.artisanId;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
      .populate('ngoId', 'name org');

    return { products, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }
}

module.exports = new ProductService();
