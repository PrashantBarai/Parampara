const express = require('express');
const {
  createOrder,
  getOrder,
  getUserOrders,
  updateOrderStatus,
  getAllOrders
} = require('../controllers/order.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const router = express.Router();

router.post('/create', protect, createOrder);
router.get('/:orderId', protect, getOrder);
router.get('/user/my-orders', protect, getUserOrders);
router.put('/:orderId/status', protect, updateOrderStatus);
router.get('/', protect, authorize('ADMIN'), getAllOrders);

module.exports = router;
