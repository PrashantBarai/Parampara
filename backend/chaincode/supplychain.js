'use strict';

const { Contract } = require('fabric-contract-api');

class SupplychainContract extends Contract {
  /**
   * Register a new product
   * Only NGOOrg can call this
   */
  async registerProduct(ctx, productId, name, ngo, basePrice, imageCID) {
    console.info('============= START : registerProduct ===========');

    // Verify caller is NGOOrg
    const clientOrgId = ctx.clientIdentity.getMSPID();
    if (clientOrgId !== 'NGOOrgMSP') {
      throw new Error(`Only NGOOrg can register products. Caller: ${clientOrgId}`);
    }

    // Check if product already exists
    const productAsBytes = await ctx.stub.getState(productId);
    if (productAsBytes && productAsBytes.length > 0) {
      throw new Error(`Product ${productId} already exists`);
    }

    // Create product object
    const product = {
      productId,
      name,
      ngo,
      basePrice: parseFloat(basePrice),
      imageCID,
      currentOwner: ngo,
      status: 'registered',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [
        {
          stage: 'registered',
          owner: ngo,
          timestamp: new Date().toISOString(),
          imageCID
        }
      ],
      margins: []
    };

    // Store product
    await ctx.stub.putState(productId, Buffer.from(JSON.stringify(product)));

    // Emit event
    ctx.stub.setEvent('ProductRegistered', Buffer.from(JSON.stringify({
      productId,
      name,
      ngo,
      basePrice
    })));

    console.info('============= END : registerProduct ===========');
    return JSON.stringify(product);
  }

  /**
   * Add lifecycle checkpoint
   * Called by Warehouse, Distributor, or Retailer
   */
  async addLifecycle(ctx, productId, stage, org, imageCID) {
    console.info('============= START : addLifecycle ===========');

    // Verify caller is authorized
    const clientOrgId = ctx.clientIdentity.getMSPID();
    const authorizedOrgs = ['WarehouseOrgMSP', 'DistributorOrgMSP', 'RetailerOrgMSP'];
    if (!authorizedOrgs.includes(clientOrgId)) {
      throw new Error(`Only Warehouse, Distributor, or Retailer can add lifecycle. Caller: ${clientOrgId}`);
    }

    // Get product
    const productAsBytes = await ctx.stub.getState(productId);
    if (!productAsBytes || productAsBytes.length === 0) {
      throw new Error(`Product ${productId} does not exist`);
    }

    const product = JSON.parse(productAsBytes.toString());

    // Verify supply chain sequence
    const validSequence = ['registered', 'manufactured', 'warehoused', 'distributed', 'retailed'];
    const currentIndex = validSequence.indexOf(product.status);
    const nextIndex = validSequence.indexOf(stage);

    if (nextIndex <= currentIndex) {
      throw new Error(`Invalid stage transition. Current: ${product.status}, Requested: ${stage}`);
    }

    // Add to history
    product.history.push({
      stage,
      owner: org,
      timestamp: new Date().toISOString(),
      imageCID
    });

    product.status = stage;
    product.currentOwner = org;
    product.updatedAt = new Date().toISOString();

    // Store updated product
    await ctx.stub.putState(productId, Buffer.from(JSON.stringify(product)));

    // Emit event
    ctx.stub.setEvent('LifecycleAdded', Buffer.from(JSON.stringify({
      productId,
      stage,
      org,
      timestamp: new Date().toISOString()
    })));

    console.info('============= END : addLifecycle ===========');
    return JSON.stringify(product);
  }

  /**
   * Add margin for product
   * Called by Warehouse, Distributor, or Retailer
   */
  async addMargin(ctx, productId, org, margin) {
    console.info('============= START : addMargin ===========');

    // Verify caller is authorized
    const clientOrgId = ctx.clientIdentity.getMSPID();
    const authorizedOrgs = ['WarehouseOrgMSP', 'DistributorOrgMSP', 'RetailerOrgMSP'];
    if (!authorizedOrgs.includes(clientOrgId)) {
      throw new Error(`Only Warehouse, Distributor, or Retailer can add margin. Caller: ${clientOrgId}`);
    }

    // Get product
    const productAsBytes = await ctx.stub.getState(productId);
    if (!productAsBytes || productAsBytes.length === 0) {
      throw new Error(`Product ${productId} does not exist`);
    }

    const product = JSON.parse(productAsBytes.toString());

    // Add margin
    product.margins.push({
      org,
      margin: parseFloat(margin),
      timestamp: new Date().toISOString()
    });

    product.updatedAt = new Date().toISOString();

    // Store updated product
    await ctx.stub.putState(productId, Buffer.from(JSON.stringify(product)));

    // Emit event
    ctx.stub.setEvent('MarginAdded', Buffer.from(JSON.stringify({
      productId,
      org,
      margin: parseFloat(margin)
    })));

    console.info('============= END : addMargin ===========');
    return JSON.stringify(product);
  }

  /**
   * Transfer ownership of product
   * Called by Warehouse, Distributor, or Retailer
   */
  async transferOwnership(ctx, productId, newOwner) {
    console.info('============= START : transferOwnership ===========');

    // Verify caller is authorized
    const clientOrgId = ctx.clientIdentity.getMSPID();
    const authorizedOrgs = ['WarehouseOrgMSP', 'DistributorOrgMSP', 'RetailerOrgMSP'];
    if (!authorizedOrgs.includes(clientOrgId)) {
      throw new Error(`Only Warehouse, Distributor, or Retailer can transfer ownership. Caller: ${clientOrgId}`);
    }

    // Get product
    const productAsBytes = await ctx.stub.getState(productId);
    if (!productAsBytes || productAsBytes.length === 0) {
      throw new Error(`Product ${productId} does not exist`);
    }

    const product = JSON.parse(productAsBytes.toString());

    const previousOwner = product.currentOwner;
    product.currentOwner = newOwner;
    product.updatedAt = new Date().toISOString();

    // Store updated product
    await ctx.stub.putState(productId, Buffer.from(JSON.stringify(product)));

    // Emit event
    ctx.stub.setEvent('OwnershipTransferred', Buffer.from(JSON.stringify({
      productId,
      from: previousOwner,
      to: newOwner,
      timestamp: new Date().toISOString()
    })));

    console.info('============= END : transferOwnership ===========');
    return JSON.stringify(product);
  }

  /**
   * Get product details
   * Readable by all organizations
   */
  async getProduct(ctx, productId) {
    console.info('============= START : getProduct ===========');

    const productAsBytes = await ctx.stub.getState(productId);
    if (!productAsBytes || productAsBytes.length === 0) {
      throw new Error(`Product ${productId} does not exist`);
    }

    console.info('============= END : getProduct ===========');
    return productAsBytes.toString();
  }

  /**
   * Get product history
   * Readable by all organizations
   */
  async getHistory(ctx, productId) {
    console.info('============= START : getHistory ===========');

    const productAsBytes = await ctx.stub.getState(productId);
    if (!productAsBytes || productAsBytes.length === 0) {
      throw new Error(`Product ${productId} does not exist`);
    }

    const product = JSON.parse(productAsBytes.toString());

    console.info('============= END : getHistory ===========');
    return JSON.stringify({
      productId,
      history: product.history,
      margins: product.margins,
      currentOwner: product.currentOwner,
      status: product.status
    });
  }

  /**
   * Add feedback (customer review)
   * Only CustomerOrg can call this
   */
  async addFeedback(ctx, productId, customerHash, rating, comment) {
    console.info('============= START : addFeedback ===========');

    // Verify caller is CustomerOrg
    const clientOrgId = ctx.clientIdentity.getMSPID();
    if (clientOrgId !== 'CustomerOrgMSP') {
      throw new Error(`Only CustomerOrg can add feedback. Caller: ${clientOrgId}`);
    }

    // Get product
    const productAsBytes = await ctx.stub.getState(productId);
    if (!productAsBytes || productAsBytes.length === 0) {
      throw new Error(`Product ${productId} does not exist`);
    }

    const product = JSON.parse(productAsBytes.toString());

    // Initialize feedback array if not exists
    if (!product.feedback) {
      product.feedback = [];
    }

    // Add feedback
    product.feedback.push({
      customerHash,
      rating: parseInt(rating),
      comment,
      timestamp: new Date().toISOString()
    });

    product.updatedAt = new Date().toISOString();

    // Store updated product
    await ctx.stub.putState(productId, Buffer.from(JSON.stringify(product)));

    // Emit event
    ctx.stub.setEvent('FeedbackAdded', Buffer.from(JSON.stringify({
      productId,
      customerHash,
      rating: parseInt(rating),
      timestamp: new Date().toISOString()
    })));

    console.info('============= END : addFeedback ===========');
    return JSON.stringify({ success: true, message: 'Feedback added successfully' });
  }

  /**
   * Initialize ledger with sample products (development only)
   */
  async initLedger(ctx) {
    console.info('============= START : initLedger ===========');

    const products = [
      {
        productId: 'PARAM001',
        name: 'Organic Cotton Fabric',
        ngo: 'NGOOrg',
        basePrice: 100,
        imageCID: 'QmSampleCID001',
        currentOwner: 'NGOOrg',
        status: 'registered',
        history: [],
        margins: [],
        feedback: []
      }
    ];

    for (let i = 0; i < products.length; i++) {
      products[i].docType = 'product';
      await ctx.stub.putState(
        products[i].productId,
        Buffer.from(JSON.stringify(products[i]))
      );
      console.info('Added <--> ', products[i]);
    }

    console.info('============= END : initLedger ===========');
  }
}

module.exports = SupplychainContract;
