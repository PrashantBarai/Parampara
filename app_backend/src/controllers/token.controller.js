const tokenService = require('../services/token.service');

exports.getBalance = async (req, res) => {
  try {
    const balance = await tokenService.getBalance(req.user.id);
    res.json({ success: true, data: balance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const txns = await tokenService.getTransactions(req.user.id);
    res.json({ success: true, data: txns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.redeem = async (req, res) => {
  try {
    const result = await tokenService.redeem(req.user.id, req.body.amount);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, error: error.error, message: error.message });
  }
};
