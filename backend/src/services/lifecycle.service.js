const Product = require('../models/product.model');
const Lifecycle = require('../models/lifecycle.model');
const User = require('../models/user.model');
const PricingService = require('./pricing.service');

class LifecycleService {
  /**
   * Transfer product ownership and add lifecycle entry
   */
  async transferOwnership(productId, fromUserId, toUserId, marginAdded = 0, transferData) {
    try {
      // Get product
      const product = await Product.findOne({ productId });
      if (!product) {
        throw new Error('Product not found');
      }

      // Verify current owner
      if (product.currentOwner.toString() !== fromUserId) {
        throw new Error('Only current owner can transfer product');
      }

      // Get receiver user details
      const receiverUser = await User.findById(toUserId);
      if (!receiverUser) {
        throw new Error('Receiver user not found');
      }

      // Calculate new price
      const newPrice = product.currentPrice + marginAdded;

      // Ensure price doesn't go below base price
      if (newPrice < product.basePrice) {
        throw new Error('Product price cannot be below base price');
      }

      // Update product
      const updatedProduct = await Product.findOneAndUpdate(
        { productId },
        {
          currentOwner: toUserId,
          currentPrice: newPrice,
          status: transferData.status || product.status
        },
        { new: true }
      );

      // Create lifecycle entry
      const lifecycleEntry = await Lifecycle.create({
        productId,
        stage: receiverUser.role,
        actorId: toUserId,
        role: receiverUser.role,
        imageCID: transferData.imageCID || null,
        imageHash: transferData.imageHash,
        priceAtStage: newPrice,
        marginAdded,
        location: transferData.location || receiverUser.location || 'Unknown'
      });

      return {
        product: updatedProduct,
        lifecycle: lifecycleEntry
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get full lifecycle of a product
   */
  async getProductLifecycle(productId) {
    try {
      const lifecycle = await Lifecycle.find({ productId })
        .populate('actorId', 'name email role organizationName location')
        .sort({ timestamp: 1 });

      if (lifecycle.length === 0) {
        throw new Error('No lifecycle records found for this product');
      }

      return lifecycle;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get current stage details
   */
  async getCurrentStage(productId) {
    try {
      const latestEntry = await Lifecycle.findOne({ productId })
        .sort({ timestamp: -1 })
        .populate('actorId', 'name email role organizationName location');

      if (!latestEntry) {
        throw new Error('No lifecycle records found');
      }

      return latestEntry;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get lifecycle by stage
   */
  async getLifecycleByStage(productId, stage) {
    try {
      const entries = await Lifecycle.find({ productId, stage })
        .populate('actorId', 'name email role organizationName location')
        .sort({ timestamp: 1 });

      return entries;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get margin breakdown
   */
  async getMarginBreakdown(productId) {
    try {
      const product = await Product.findOne({ productId });
      if (!product) {
        throw new Error('Product not found');
      }

      const lifecycle = await Lifecycle.find({ productId })
        .sort({ timestamp: 1 });

      const breakdown = {
        productId,
        basePrice: product.basePrice,
        currentPrice: product.currentPrice,
        totalMargin: product.currentPrice - product.basePrice,
        margins: lifecycle.map(entry => ({
          stage: entry.stage,
          actor: entry.actorId,
          margin: entry.marginAdded,
          priceAtStage: entry.priceAtStage,
          timestamp: entry.timestamp
        }))
      };

      return breakdown;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate ownership transfer is allowed
   */
  async validateTransfer(productId, fromUserId) {
    try {
      const product = await Product.findOne({ productId });
      
      if (!product) {
        throw new Error('Product not found');
      }

      if (product.status === 'SOLD') {
        throw new Error('Cannot transfer a sold product');
      }

      if (product.currentOwner.toString() !== fromUserId) {
        throw new Error('Not authorized to transfer this product');
      }

      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new LifecycleService();
