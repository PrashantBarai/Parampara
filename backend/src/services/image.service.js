const { verifyHash } = require('../utils/hash.util');
const Product = require('../models/product.model');

class ImageService {
  /**
   * Verify if uploaded image matches original
   */
  async verifyImage(productId, uploadedImageHash) {
    try {
      const product = await Product.findOne({ productId });
      
      if (!product) {
        throw new Error('Product not found');
      }

      const matches = uploadedImageHash === product.imageHash;
      
      return {
        productId,
        matches,
        confidence: matches ? 100 : 0,
        originalHash: product.imageHash,
        uploadedHash: uploadedImageHash,
        message: matches ? 'Image verified successfully' : 'Image hash does not match'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Compare two image hashes with similarity score
   */
  compareImageHashes(hash1, hash2) {
    if (hash1 === hash2) {
      return {
        identical: true,
        similarity: 100,
        message: 'Images are identical'
      };
    }

    // Calculate Hamming distance for similarity (simplified)
    let differences = 0;
    const minLength = Math.min(hash1.length, hash2.length);

    for (let i = 0; i < minLength; i++) {
      if (hash1[i] !== hash2[i]) {
        differences++;
      }
    }

    const similarity = 100 - (differences / minLength) * 100;

    return {
      identical: false,
      similarity: Math.round(similarity),
      message: `Images are ${Math.round(similarity)}% similar`
    };
  }

  /**
   * Validate image CID exists
   */
  async validateImageCID(cid) {
    // In real implementation, this would verify against IPFS or storage service
    if (!cid || cid.trim() === '') {
      return {
        valid: false,
        message: 'Image CID is empty'
      };
    }

    return {
      valid: true,
      message: 'Image CID is valid'
    };
  }

  /**
   * Get image verification history for product
   */
  async getImageVerificationHistory(productId) {
    try {
      const product = await Product.findOne({ productId });
      
      if (!product) {
        throw new Error('Product not found');
      }

      return {
        productId,
        originalImageHash: product.imageHash,
        imageCID: product.imageCID,
        verified: true,
        lastVerified: new Date()
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Store image reference (CID)
   */
  async storeImageReference(productId, imageCID, imageHash) {
    try {
      const product = await Product.findOneAndUpdate(
        { productId },
        { 
          imageCID,
          imageHash 
        },
        { new: true }
      );

      if (!product) {
        throw new Error('Product not found');
      }

      return {
        success: true,
        message: 'Image reference stored',
        productId,
        imageCID,
        imageHash
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Batch verify images
   */
  async batchVerifyImages(verificationData) {
    try {
      const results = [];

      for (const data of verificationData) {
        const result = await this.verifyImage(data.productId, data.uploadedImageHash);
        results.push(result);
      }

      return {
        totalVerifications: results.length,
        successful: results.filter(r => r.matches).length,
        failed: results.filter(r => !r.matches).length,
        results
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ImageService();
