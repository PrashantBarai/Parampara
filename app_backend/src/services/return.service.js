const Product = require('../models/Product.model');
const Return = require('../models/Return.model');
const Lifecycle = require('../models/Lifecycle.model');
const blockchainService = require('./blockchain.service');
const imageService = require('./image.service');
const { MAX_RETURNS, RETURN_TARGET_ORG } = require('../utils/constants');
const { v4: uuidv4 } = require('uuid');

class ReturnService {
  async initiateReturn(customerUser, productId, reason, imageFile) {
    const product = await Product.findOne({ productId });
    if (!product) throw { status: 404, error: 'PROD_001', message: 'Product not found' };
    if (product.status !== 'SOLD' && product.status !== 'DELIVERED') {
      throw { status: 400, message: 'Product must be SOLD or DELIVERED to initiate return' };
    }
    if (!product.isOwnedBy(customerUser.id)) {
      throw { status: 403, error: 'RET_003', message: 'Not the customer who purchased this product' };
    }
    if (product.returnCount >= MAX_RETURNS) {
      throw { status: 400, error: 'RET_001', message: `Max returns (${MAX_RETURNS}) reached. Product is RETIRED.` };
    }

    let imageCID = '', imageHash = '';
    if (imageFile) {
      imageCID = await imageService.uploadToIPFS(imageFile.buffer, imageFile.originalname);
      imageHash = imageService.getImageHash(imageFile.buffer);
    }

    // LEDGER FIRST
    const customerHash = product.ownerCustomerHash || '';
    const txIdReturn = await blockchainService.submitTransaction(
      'CustomerOrg', 'InitiateReturn', productId, customerHash, reason
    );
    const txIdTransfer = await blockchainService.submitTransaction(
      'CustomerOrg', 'TransferOwnership', productId, 'CustomerOrg', RETURN_TARGET_ORG
    );

    // Sync MongoDB
    const returnNumber = product.returnCount + 1;
    const returnId = `RET-${uuidv4().slice(0, 8).toUpperCase()}`;

    const returnDoc = await Return.create({
      returnId, productId, customerId: customerUser.id,
      reason, imageCID, imageHash, returnNumber,
      status: 'INITIATED', blockchainTxId: txIdReturn,
    });

    // Add return lifecycle entry
    await Lifecycle.create({
      productId, stage: 'RETURNED', org: 'CustomerOrg',
      userId: customerUser.id, imageCID, imageHash,
      marginAdded: 0, priceAtStage: product.currentPrice,
      isReturn: true, blockchainTxId: txIdReturn,
    });

    product.returnCount = returnNumber;
    product.currentOwnerOrg = RETURN_TARGET_ORG;
    product.status = returnNumber >= MAX_RETURNS ? 'RETIRED' : 'RETURNED';
    product.isRetired = returnNumber >= MAX_RETURNS;
    product.ownerCustomerHash = null;
    await product.save();

    return { returnDoc, product, txId: txIdReturn };
  }

  async receiveReturn(warehouseUser, returnId) {
    const returnDoc = await Return.findOne({ returnId });
    if (!returnDoc) throw { status: 404, message: 'Return not found' };
    returnDoc.status = 'RECEIVED_BY_WAREHOUSE';
    await returnDoc.save();
    return returnDoc;
  }

  async repairAndRelease(warehouseUser, returnId, notes) {
    const returnDoc = await Return.findOne({ returnId });
    if (!returnDoc) throw { status: 404, message: 'Return not found' };

    const product = await Product.findOne({ productId: returnDoc.productId });
    if (product.isRetired) throw { status: 400, error: 'RET_002', message: 'Product is RETIRED' };

    returnDoc.status = 'REPAIRED';
    returnDoc.warehouseNotes = notes;
    await returnDoc.save();

    product.status = 'IN_WAREHOUSE';
    product.currentOwner = warehouseUser.id;
    await product.save();

    return { returnDoc, product };
  }

  async getReturnHistory(productId) {
    return Return.find({ productId }).sort({ createdAt: -1 });
  }
}

module.exports = new ReturnService();
