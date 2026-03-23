const ScanLog = require('../models/scan.model');

class FraudService {
  /**
   * Check for fraud indicators in scan logs
   */
  async checkFraud(productId, location) {
    try {
      const scans = await ScanLog.find({ productId })
        .sort({ timestamp: 1 });

      if (scans.length === 0) {
        return {
          isFraud: false,
          score: 0,
          indicators: []
        };
      }

      let fraudScore = 0;
      const indicators = [];

      // Check for multiple locations scanned in short time period
      const multiLocationScans = await this.checkMultipleLocations(scans);
      if (multiLocationScans.detected) {
        fraudScore += 40;
        indicators.push(multiLocationScans.indicator);
      }

      // Check for excessive scan frequency
      const frequencyCheck = await this.checkScanFrequency(scans);
      if (frequencyCheck.detected) {
        fraudScore += 30;
        indicators.push(frequencyCheck.indicator);
      }

      // Check for impossible travel distances
      const travelCheck = await this.checkImpossibleTravel(scans, location);
      if (travelCheck.detected) {
        fraudScore += 30;
        indicators.push(travelCheck.indicator);
      }

      return {
        isFraud: fraudScore > 50,
        score: fraudScore,
        indicators
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check for multiple locations in scan logs
   */
  async checkMultipleLocations(scans) {
    const locations = new Set(scans.map(s => s.location));
    
    if (locations.size > 2) {
      return {
        detected: true,
        indicator: {
          type: 'MULTIPLE_LOCATIONS',
          message: `Product scanned in ${locations.size} different locations`,
          details: Array.from(locations)
        }
      };
    }

    return { detected: false };
  }

  /**
   * Check for excessive scan frequency
   */
  async checkScanFrequency(scans) {
    if (scans.length < 3) {
      return { detected: false };
    }

    // Check if multiple scans within 1 hour
    for (let i = 1; i < scans.length; i++) {
      const timeDiff = (scans[i].timestamp - scans[i - 1].timestamp) / (1000 * 60); // Convert to minutes
      
      if (timeDiff < 60 && scans[i].location !== scans[i - 1].location) {
        return {
          detected: true,
          indicator: {
            type: 'EXCESSIVE_FREQUENCY',
            message: 'Multiple scans in different locations within 1 hour',
            timeDiffMinutes: timeDiff
          }
        };
      }
    }

    return { detected: false };
  }

  /**
   * Check for impossible travel distances
   */
  async checkImpossibleTravel(scans, currentLocation) {
    if (scans.length < 2) {
      return { detected: false };
    }

    // Simple check: if same location appears after different location, it might be suspicious
    const lastScan = scans[scans.length - 1];
    const recentLocations = scans.slice(-5).map(s => s.location);
    
    const locationChanges = new Set(recentLocations).size;
    
    if (locationChanges > 3) {
      return {
        detected: true,
        indicator: {
          type: 'IMPOSSIBLE_TRAVEL',
          message: 'Product has unusual location pattern',
          recentLocationChanges: locationChanges
        }
      };
    }

    return { detected: false };
  }

  /**
   * Mark scan as fraudulent
   */
  async markScanAsFraud(scanId, reason) {
    try {
      const scan = await ScanLog.findByIdAndUpdate(
        scanId,
        { isFraud: true },
        { new: true }
      );

      return scan;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get fraud statistics for a product
   */
  async getFraudStats(productId) {
    try {
      const scans = await ScanLog.find({ productId });
      const fraudScans = scans.filter(s => s.isFraud);

      return {
        productId,
        totalScans: scans.length,
        fraudScans: fraudScans.length,
        fraudPercentage: scans.length > 0 ? (fraudScans.length / scans.length) * 100 : 0,
        locations: [...new Set(scans.map(s => s.location))],
        fraudIndicators: fraudScans.map(s => ({
          timestamp: s.timestamp,
          location: s.location
        }))
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get fraud alert for product
   */
  async getProductFraudAlert(productId) {
    try {
      const fraudStats = await this.getFraudStats(productId);
      
      if (fraudStats.fraudPercentage > 20) {
        return {
          alertLevel: 'HIGH',
          message: 'High fraud indicators detected',
          stats: fraudStats
        };
      } else if (fraudStats.fraudPercentage > 10) {
        return {
          alertLevel: 'MEDIUM',
          message: 'Moderate fraud indicators detected',
          stats: fraudStats
        };
      }

      return {
        alertLevel: 'LOW',
        message: 'No significant fraud indicators',
        stats: fraudStats
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new FraudService();
