const express = require('express');
const {
  createProduct,
  getProduct,
  getAllProducts,
  updateProductStatus,
  getProductPricing,
  getProductQR
} = require('../controllers/product.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const router = express.Router();

router.post('/create', protect, authorize('NGO'), createProduct);
router.get('/:productId', getProduct);
router.get('/', getAllProducts);
router.put('/:productId/status', protect, updateProductStatus);
router.get('/:productId/pricing', getProductPricing);
router.get('/:productId/qr', getProductQR);

module.exports = router;
