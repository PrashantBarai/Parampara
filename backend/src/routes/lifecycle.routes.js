const express = require('express');
const {
  transferOwnership,
  getProductLifecycle,
  getCurrentStage,
  getLifecycleByStage,
  getMarginBreakdown
} = require('../controllers/lifecycle.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/transfer', protect, transferOwnership);
router.get('/:productId', getProductLifecycle);
router.get('/:productId/current', getCurrentStage);
router.get('/:productId/stage/:stage', getLifecycleByStage);
router.get('/:productId/margins', getMarginBreakdown);

module.exports = router;
