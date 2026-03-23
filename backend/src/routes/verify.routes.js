const express = require('express');
const {
  verifyImage,
  batchVerifyImages,
  compareHashes,
  validateCID,
  getVerificationHistory
} = require('../controllers/verify.controller');

const router = express.Router();

router.post('/image', verifyImage);
router.post('/images', batchVerifyImages);
router.post('/compare-hashes', compareHashes);
router.post('/cid', validateCID);
router.get('/:productId/history', getVerificationHistory);

module.exports = router;
