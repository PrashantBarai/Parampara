const express = require('express');
const {
  logScan,
  checkFraud,
  getScanLogs,
  getFraudStats,
  getFraudAlert,
  markScanAsFraud
} = require('../controllers/scan.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/', logScan);
router.post('/fraud-check', checkFraud);
router.get('/:productId/logs', getScanLogs);
router.get('/:productId/fraud-stats', getFraudStats);
router.get('/:productId/alert', getFraudAlert);
router.post('/:scanId/mark-fraud', protect, markScanAsFraud);

module.exports = router;
