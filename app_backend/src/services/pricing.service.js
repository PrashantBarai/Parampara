const { PRICE_CAP_MULTIPLIER } = require('../utils/constants');

class PricingService {
  /**
   * Calculate current price from base + margins
   */
  calculateCurrentPrice(basePrice, margins) {
    const totalMargins = margins.reduce((sum, m) => sum + (m.value || 0), 0);
    return basePrice + totalMargins;
  }

  /**
   * Validate a new margin addition
   */
  validateMargin(basePrice, currentPrice, newMargin) {
    const newPrice = currentPrice + newMargin;
    const maxPrice = basePrice * PRICE_CAP_MULTIPLIER;
    const valid = newPrice <= maxPrice;

    return {
      valid,
      newPrice,
      maxPrice,
      percentageOfBase: ((newMargin / basePrice) * 100).toFixed(2),
      message: valid ? 'Margin accepted' : `Price ${newPrice} exceeds cap ${maxPrice} (${PRICE_CAP_MULTIPLIER}x base)`,
    };
  }

  /**
   * Get full price breakdown for a product
   */
  getPriceBreakdown(product, margins) {
    const breakdown = {
      basePrice: product.basePrice,
      margins: margins.map((m) => ({
        org: m.org,
        value: m.value,
        percentage: ((m.value / product.basePrice) * 100).toFixed(2),
      })),
      totalMargins: margins.reduce((sum, m) => sum + m.value, 0),
    };
    breakdown.finalPrice = breakdown.basePrice + breakdown.totalMargins;
    return breakdown;
  }
}

module.exports = new PricingService();
