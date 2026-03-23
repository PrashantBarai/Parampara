const axios = require('axios');
const FormData = require('form-data');
const ipfsConfig = require('../config/ipfs.config');
const { hashImage } = require('../utils/hash.util');

class ImageService {
  /**
   * Upload file buffer to IPFS via Pinata
   */
  async uploadToIPFS(fileBuffer, fileName) {
    try {
      const formData = new FormData();
      formData.append('file', fileBuffer, { filename: fileName });

      const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
        maxBodyLength: Infinity,
        headers: {
          ...formData.getHeaders(),
          pinata_api_key: ipfsConfig.apiKey,
          pinata_secret_api_key: ipfsConfig.secretKey,
        },
      });

      const cid = response.data.IpfsHash;
      console.log(`📌 Pinned to IPFS: ${cid}`);
      return cid;
    } catch (error) {
      console.error('❌ IPFS upload failed:', error.message);
      throw { error: 'IMG_001', message: 'Image upload to IPFS failed' };
    }
  }

  /**
   * Hash an image buffer (SHA-256)
   */
  getImageHash(fileBuffer) {
    return hashImage(fileBuffer);
  }

  /**
   * Get IPFS gateway URL for a CID
   */
  getIPFSUrl(cid) {
    return `${ipfsConfig.gateway}${cid}`;
  }

  /**
   * Verify image authenticity by comparing hashes
   */
  verifyImage(uploadedBuffer, originalHash) {
    const uploadedHash = hashImage(uploadedBuffer);
    return {
      match: uploadedHash === originalHash,
      originalHash,
      uploadedHash,
    };
  }
}

module.exports = new ImageService();
