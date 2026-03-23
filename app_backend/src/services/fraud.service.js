const ScanLog = require('../models/ScanLog.model');
const Product = require('../models/Product.model');

class FraudService {
  /**
   * Analyze a scan for potential fraud
   */
  async analyzeScan(productId, scanData) {
    const reasons = [];

    // 1. Frequency anomaly: >5 scans in 1 hour
    const frequencyResult = await this.checkFrequencyAnomaly(productId);
    if (frequencyResult.isFraud) reasons.push(frequencyResult.reason);

    // 2. Location anomaly: 2+ cities in <1 hour
    if (scanData.location) {
      const locationResult = await this.checkLocationAnomaly(productId, scanData.location);
      if (locationResult.isFraud) reasons.push(locationResult.reason);
    }

    // 3. Black market re-entry: product in supply chain without official RETURN
    const blackMarketResult = await this.detectBlackMarketReentry(productId);
    if (blackMarketResult.isFraud) reasons.push(blackMarketResult.reason);

    return {
      isFraud: reasons.length > 0,
      reasons,
      severity: reasons.length >= 2 ? 'HIGH' : reasons.length === 1 ? 'MEDIUM' : 'NONE',
    };
  }

  /**
   * Check scan frequency anomaly (>5 scans in 1 hour)
   */
  async checkFrequencyAnomaly(productId) {
    const recentScans = await ScanLog.getRecentScans(productId, 1);
    if (recentScans.length > 5) {
      return {
        isFraud: true,
        reason: `FREQUENCY_ANOMALY: ${recentScans.length} scans in last 1 hour`,
      };
    }
    return { isFraud: false };
  }

  /**
   * Check location anomaly (scans from different cities in short time)
   */
  async checkLocationAnomaly(productId, newLocation) {
    const recentScans = await ScanLog.getRecentScans(productId, 1);
    const uniqueLocations = new Set(recentScans.map((s) => s.location).filter(Boolean));
    uniqueLocations.add(newLocation);

    if (uniqueLocations.size >= 3) {
      return {
        isFraud: true,
        reason: `LOCATION_ANOMALY: Scanned in ${uniqueLocations.size} different locations in 1 hour`,
      };
    }
    return { isFraud: false };
  }

  /**
   * Detect black market re-entry
   * If product status is SOLD but appears in supply chain without RETURN
   */
  async detectBlackMarketReentry(productId) {
    const product = await Product.findOne({ productId });
    if (!product) return { isFraud: false };

    if (product.status === 'SOLD' && product.currentOwnerOrg !== 'CustomerOrg') {
      return {
        isFraud: true,
        reason: `BLACK_MARKET_REENTRY: Product SOLD but found with ${product.currentOwnerOrg} without RETURN`,
        lastRegisteredBuyer: product.ownerCustomerHash,
      };
    }
    return { isFraud: false };
  }
}

module.exports = new FraudService();
