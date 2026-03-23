const Product = require('../models/Product.model');
const blockchainService = require('./blockchain.service');
const { VALID_TRANSFERS } = require('../utils/constants');
const { hashCustomerIdentity } = require('../utils/hash.util');

class TransferService {
  async transferOwnership(user, productId, toOrg) {
    const product = await Product.findOne({ productId });
    if (!product) throw { status: 404, error: 'PROD_001', message: 'Product not found' };
    if (product.isRetired) throw { status: 400, error: 'RET_002', message: 'Product is RETIRED' };
    if (!product.isOwnedBy(user.id)) throw { status: 403, error: 'XFER_002', message: 'Not current owner' };

    // Validate transfer sequence
    if (!this.isValidTransfer(user.org, toOrg)) {
      throw { status: 400, error: 'XFER_001', message: `Invalid transfer: ${user.org} → ${toOrg}` };
    }

    // LEDGER FIRST
    const txId = await blockchainService.submitTransaction(
      user.org, 'TransferOwnership', productId, user.org, toOrg
    );

    // Sync MongoDB
    product.currentOwnerOrg = toOrg;

    // Status updates
    const statusMap = {
      WarehouseOrg: 'IN_WAREHOUSE', DistributorOrg: 'IN_DISTRIBUTION',
      RetailerOrg: 'IN_RETAIL', CustomerOrg: 'SOLD',
    };
    product.status = statusMap[toOrg] || product.status;

    // If transferred to customer, bind identity
    if (toOrg === 'CustomerOrg') {
      // The new owner will be set by the order flow
      // But we store the customer hash for traceability
    }

    await product.save();
    return { productId, fromOrg: user.org, toOrg, status: product.status, txId };
  }

  isValidTransfer(fromOrg, toOrg) {
    return VALID_TRANSFERS[fromOrg] === toOrg;
  }
}

module.exports = new TransferService();
