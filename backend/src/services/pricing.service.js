const Product = require('../models/product.model');
const Lifecycle = require('../models/lifecycle.model');

class PricingService {
  /**
   * Calculate final price with margins
   */
  calculateFinalPrice(basePrice, distributorMargin = 0, retailerMargin = 0) {
    const finalPrice = basePrice + distributorMargin + retailerMargin;
    return finalPrice;
  }

  /**
   * Validate price is not below base price
   */
  validatePrice(productId, proposedPrice) {
    return new Promise(async (resolve, reject) => {
      try {
        const product = await Product.findOne({ productId });
        
        if (!product) {
          reject(new Error('Product not found'));
        }

        if (proposedPrice < product.basePrice) {
          resolve({
            valid: false,
            message: `Price cannot be below base price of ${product.basePrice}`
          });
        } else {
          resolve({
            valid: true,
            message: 'Price is valid'
          });
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Calculate margin for a stage
   */
  calculateMargin(currentPrice, previousPrice) {
    return Math.max(0, currentPrice - previousPrice);
  }

  /**
   * Get complete price breakdown
   */
  async getPriceBreakdown(productId) {
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
        totalMarginAdded: product.currentPrice - product.basePrice,
        stages: []
      };

      for (let i = 0; i < lifecycle.length; i++) {
        const stage = lifecycle[i];
        const previousPrice = i === 0 ? product.basePrice : lifecycle[i - 1].priceAtStage;

        breakdown.stages.push({
          stage: stage.stage,
          role: stage.role,
          actor: stage.actorId,
          timestamp: stage.timestamp,
          priceAtStage: stage.priceAtStage,
          marginAdded: stage.marginAdded,
          cumulativeMargin: stage.priceAtStage - product.basePrice
        });
      }

      return breakdown;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calculate profit/margin for a specific actor
   */
  async getActorProfit(productId, actorId) {
    try {
      const lifecycleEntries = await Lifecycle.find({ 
        productId, 
        actorId 
      }).sort({ timestamp: 1 });

      if (lifecycleEntries.length === 0) {
        return {
          actorId,
          productId,
          totalMargin: 0,
          entries: []
        };
      }

      const totalMargin = lifecycleEntries.reduce((sum, entry) => sum + entry.marginAdded, 0);

      return {
        actorId,
        productId,
        totalMargin,
        entries: lifecycleEntries.map(entry => ({
          stage: entry.stage,
          margin: entry.marginAdded,
          timestamp: entry.timestamp
        }))
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update product price (for lifecycle transitions)
   */
  async updateProductPrice(productId, newPrice) {
    try {
      const product = await Product.findOne({ productId });
      
      if (!product) {
        throw new Error('Product not found');
      }

      if (newPrice < product.basePrice) {
        throw new Error('New price cannot be below base price');
      }

      const updatedProduct = await Product.findOneAndUpdate(
        { productId },
        { currentPrice: newPrice },
        { new: true }
      );

      return updatedProduct;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new PricingService();
