const Product = require('../models/Product.model');
const Order = require('../models/Order.model');
const Margin = require('../models/Margin.model');
const blockchainService = require('./blockchain.service');
const pricingService = require('./pricing.service');
const { hashCustomerIdentity } = require('../utils/hash.util');
const { v4: uuidv4 } = require('uuid');

class OrderService {
  async createOrder(customerUser, productId) {
    const product = await Product.findOne({ productId });
    if (!product) throw { status: 404, error: 'PROD_001', message: 'Product not found' };
    if (product.status !== 'IN_RETAIL') throw { status: 400, message: 'Product is not available for purchase' };

    const margins = await Margin.find({ productId });
    const breakdown = pricingService.getPriceBreakdown(product, margins);

    // LEDGER FIRST — transfer to customer
    const txId = await blockchainService.submitTransaction(
      product.currentOwnerOrg, 'TransferOwnership', productId, product.currentOwnerOrg, 'CustomerOrg'
    );

    // Build price breakdown by org
    const priceBreakdown = { basePrice: product.basePrice, warehouseMargin: 0, distributorMargin: 0, retailerMargin: 0 };
    margins.forEach((m) => {
      if (m.org === 'WarehouseOrg') priceBreakdown.warehouseMargin += m.value;
      if (m.org === 'DistributorOrg') priceBreakdown.distributorMargin += m.value;
      if (m.org === 'RetailerOrg') priceBreakdown.retailerMargin += m.value;
    });
    priceBreakdown.totalMargins = priceBreakdown.warehouseMargin + priceBreakdown.distributorMargin + priceBreakdown.retailerMargin;

    const orderId = `ORD-${uuidv4().slice(0, 8).toUpperCase()}`;
    const order = await Order.create({
      orderId, productId, buyerId: customerUser.id,
      sellerId: product.currentOwner, finalPrice: breakdown.finalPrice,
      priceBreakdown, status: 'CONFIRMED', blockchainTxId: txId,
    });

    // Update product
    const customerHash = hashCustomerIdentity(customerUser.id, customerUser.email);
    product.currentOwner = customerUser.id;
    product.currentOwnerOrg = 'CustomerOrg';
    product.ownerCustomerHash = customerHash;
    product.status = 'SOLD';
    await product.save();

    return { order, priceBreakdown: breakdown, txId };
  }
}

module.exports = new OrderService();
