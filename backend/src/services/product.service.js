const Product = require('../models/product.model');
const Lifecycle = require('../models/lifecycle.model');
const { generateProductId, generateMetadataHash } = require('../utils/hash.util');

class ProductService {
  /**
   * Create a new product
   */
  async createProduct(productData, userId) {
    try {
      const productId = generateProductId(productData);
      
      // Check if product already exists
      const existingProduct = await Product.findOne({ productId });
      if (existingProduct) {
        throw new Error('Product already exists');
      }

      const metadataHash = generateMetadataHash({
        name: productData.name,
        description: productData.description,
        origin: productData.origin,
        manufacturerName: productData.manufacturerName,
        basePrice: productData.basePrice
      });

      const product = await Product.create({
        productId,
        name: productData.name,
        description: productData.description,
        origin: productData.origin,
        manufacturerName: productData.manufacturerName,
        ngoId: userId,
        basePrice: productData.basePrice,
        currentPrice: productData.basePrice,
        imageCID: productData.imageCID || null,
        imageHash: productData.imageHash,
        metadataHash,
        currentOwner: userId,
        status: 'CREATED'
      });

      // Create initial lifecycle entry
      await Lifecycle.create({
        productId,
        stage: 'NGO',
        actorId: userId,
        role: 'NGO',
        imageCID: productData.imageCID || null,
        imageHash: productData.imageHash,
        priceAtStage: productData.basePrice,
        marginAdded: 0,
        location: productData.location || 'Unknown'
      });

      return product;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(productId) {
    try {
      const product = await Product.findOne({ productId })
        .populate('ngoId', 'name email organizationName')
        .populate('currentOwner', 'name email role organizationName');
      
      if (!product) {
        throw new Error('Product not found');
      }

      return product;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all products
   */
  async getAllProducts(filters = {}) {
    try {
      const query = {};
      
      if (filters.status) query.status = filters.status;
      if (filters.ngoId) query.ngoId = filters.ngoId;
      if (filters.currentOwner) query.currentOwner = filters.currentOwner;

      const products = await Product.find(query)
        .populate('ngoId', 'name email organizationName')
        .populate('currentOwner', 'name email role organizationName')
        .sort({ createdAt: -1 });

      return products;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update product status
   */
  async updateProductStatus(productId, newStatus) {
    try {
      const product = await Product.findOneAndUpdate(
        { productId },
        { status: newStatus },
        { new: true }
      );

      if (!product) {
        throw new Error('Product not found');
      }

      return product;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify product exists and return details
   */
  async verifyProductExists(productId) {
    try {
      const product = await Product.findOne({ productId });
      return product !== null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get product price details
   */
  async getProductPricing(productId) {
    try {
      const product = await Product.findOne({ productId });
      
      if (!product) {
        throw new Error('Product not found');
      }

      return {
        productId: product.productId,
        basePrice: product.basePrice,
        currentPrice: product.currentPrice,
        status: product.status
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ProductService();
