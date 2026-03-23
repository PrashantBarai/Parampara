const fabricService = require('./fabric.service');
const { fabricConfig, hasAccessToFunction } = require('../config/fabric');

class BlockchainService {
  /**
   * Register product on blockchain
   */
  async registerProductOnChain(productData, userOrg = 'NGOOrg') {
    try {
      // Check access
      if (!hasAccessToFunction(userOrg, 'registerProduct')) {
        throw new Error(`${userOrg} does not have permission to register products`);
      }

      // Initialize gateway
      await fabricService.initializeGateway(userOrg, fabricConfig.userContext.adminUser);

      // Call chaincode function
      const result = await fabricService.submitTransaction(
        'registerProduct',
        productData.productId,
        productData.name,
        userOrg,
        productData.basePrice.toString(),
        productData.imageCID || ''
      );

      await fabricService.disconnect();
      return result;
    } catch (error) {
      console.error('[BlockchainService] Product registration failed:', error);
      await fabricService.disconnect();
      throw error;
    }
  }

  /**
   * Add lifecycle checkpoint on blockchain
   */
  async addLifecycleOnChain(productId, stage, org, imageCID = '') {
    try {
      // Check access
      if (!hasAccessToFunction(org, 'addLifecycle')) {
        throw new Error(`${org} does not have permission to add lifecycle`);
      }

      // Initialize gateway
      await fabricService.initializeGateway(org, fabricConfig.userContext.adminUser);

      // Call chaincode function
      const result = await fabricService.submitTransaction(
        'addLifecycle',
        productId,
        stage,
        org,
        imageCID
      );

      await fabricService.disconnect();
      return result;
    } catch (error) {
      console.error('[BlockchainService] Lifecycle addition failed:', error);
      await fabricService.disconnect();
      throw error;
    }
  }

  /**
   * Add margin on blockchain
   */
  async addMarginOnChain(productId, org, margin) {
    try {
      // Check access
      if (!hasAccessToFunction(org, 'addMargin')) {
        throw new Error(`${org} does not have permission to add margin`);
      }

      // Initialize gateway
      await fabricService.initializeGateway(org, fabricConfig.userContext.adminUser);

      // Call chaincode function
      const result = await fabricService.submitTransaction(
        'addMargin',
        productId,
        org,
        margin.toString()
      );

      await fabricService.disconnect();
      return result;
    } catch (error) {
      console.error('[BlockchainService] Margin addition failed:', error);
      await fabricService.disconnect();
      throw error;
    }
  }

  /**
   * Transfer ownership on blockchain
   */
  async transferOwnershipOnChain(productId, newOwner, org) {
    try {
      // Check access
      if (!hasAccessToFunction(org, 'transferOwnership')) {
        throw new Error(`${org} does not have permission to transfer ownership`);
      }

      // Initialize gateway
      await fabricService.initializeGateway(org, fabricConfig.userContext.adminUser);

      // Call chaincode function
      const result = await fabricService.submitTransaction(
        'transferOwnership',
        productId,
        newOwner
      );

      await fabricService.disconnect();
      return result;
    } catch (error) {
      console.error('[BlockchainService] Ownership transfer failed:', error);
      await fabricService.disconnect();
      throw error;
    }
  }

  /**
   * Get product from blockchain
   */
  async getProductFromChain(productId, org = 'NGOOrg') {
    try {
      // Check access
      if (!hasAccessToFunction(org, 'getProduct')) {
        throw new Error(`${org} does not have permission to view product`);
      }

      // Initialize gateway
      await fabricService.initializeGateway(org, fabricConfig.userContext.adminUser);

      // Call chaincode function
      const result = await fabricService.evaluateTransaction('getProduct', productId);

      await fabricService.disconnect();
      return result;
    } catch (error) {
      console.error('[BlockchainService] Product retrieval failed:', error);
      await fabricService.disconnect();
      throw error;
    }
  }

  /**
   * Get product history from blockchain
   */
  async getHistoryFromChain(productId, org = 'NGOOrg') {
    try {
      // Check access
      if (!hasAccessToFunction(org, 'getHistory')) {
        throw new Error(`${org} does not have permission to view history`);
      }

      // Initialize gateway
      await fabricService.initializeGateway(org, fabricConfig.userContext.adminUser);

      // Call chaincode function
      const result = await fabricService.evaluateTransaction('getHistory', productId);

      await fabricService.disconnect();
      return result;
    } catch (error) {
      console.error('[BlockchainService] History retrieval failed:', error);
      await fabricService.disconnect();
      throw error;
    }
  }

  /**
   * Add feedback on blockchain
   */
  async addFeedbackOnChain(productId, customerHash, rating, comment) {
    try {
      // Check access - only CustomerOrg can add feedback
      const org = 'CustomerOrg';
      if (!hasAccessToFunction(org, 'addFeedback')) {
        throw new Error(`${org} does not have permission to add feedback`);
      }

      // Initialize gateway
      await fabricService.initializeGateway(org, fabricConfig.userContext.adminUser);

      // Call chaincode function
      const result = await fabricService.submitTransaction(
        'addFeedback',
        productId,
        customerHash,
        rating.toString(),
        comment
      );

      await fabricService.disconnect();
      return result;
    } catch (error) {
      console.error('[BlockchainService] Feedback addition failed:', error);
      await fabricService.disconnect();
      throw error;
    }
  }

  /**
   * Get all available organizations
   */
  getAvailableOrganizations() {
    return Object.keys(fabricConfig.organizations);
  }

  /**
   * Get available functions for an organization
   */
  getAvailableFunctions(org) {
    return fabricConfig.access[org] || [];
  }

  /**
   * Initialize blockchain network (development/testing only)
   */
  async initializeNetwork() {
    try {
      await fabricService.initializeGateway('NGOOrg', fabricConfig.userContext.adminUser);
      await fabricService.submitTransaction('initLedger');
      await fabricService.disconnect();
      return { success: true, message: 'Network initialized' };
    } catch (error) {
      console.error('[BlockchainService] Network initialization failed:', error);
      await fabricService.disconnect();
      throw error;
    }
  }
}

module.exports = new BlockchainService();
