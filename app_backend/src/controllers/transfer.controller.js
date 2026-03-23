const transferService = require('../services/transfer.service');

exports.transfer = async (req, res) => {
  try {
    const result = await transferService.transferOwnership(req.user, req.body.productId, req.body.toOrg);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, error: error.error, message: error.message });
  }
};
