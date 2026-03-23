const lifecycleService = require('../services/lifecycle.service');

exports.addStage = async (req, res) => {
  try {
    const result = await lifecycleService.addStage(req.user, req.body.productId, req.body, req.file);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, error: error.error, message: error.message });
  }
};

exports.getJourney = async (req, res) => {
  try {
    const journey = await lifecycleService.getJourney(req.params.productId);
    res.json({ success: true, data: journey });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
