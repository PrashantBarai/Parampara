const orderService = require('../services/order.service');

exports.create = async (req, res) => {
  try {
    const result = await orderService.createOrder(req.user, req.body.productId);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, error: error.error, message: error.message });
  }
};
