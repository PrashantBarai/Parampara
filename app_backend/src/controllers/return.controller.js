const returnService = require('../services/return.service');

exports.initiate = async (req, res) => {
  try {
    const result = await returnService.initiateReturn(req.user, req.body.productId, req.body.reason, req.file);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, error: error.error, message: error.message });
  }
};

exports.receive = async (req, res) => {
  try {
    const result = await returnService.receiveReturn(req.user, req.params.returnId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.repair = async (req, res) => {
  try {
    const result = await returnService.repairAndRelease(req.user, req.params.returnId, req.body.notes);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, error: error.error, message: error.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const returns = await returnService.getReturnHistory(req.params.productId);
    res.json({ success: true, data: returns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
