const validatorService = require('../services/validator.service');

exports.registerArtisan = async (req, res) => {
  try {
    const result = await validatorService.registerArtisan(req.user, req.body, req.file);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, error: error.error, message: error.message });
  }
};

exports.getPending = async (req, res) => {
  try {
    const artisans = await validatorService.getPendingVerifications();
    res.json({ success: true, data: artisans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verify = async (req, res) => {
  try {
    const { isValid, reason } = req.body;
    const result = await validatorService.verifyArtisan(req.user, req.params.artisanId, isValid, reason);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, error: error.error, message: error.message });
  }
};

exports.flag = async (req, res) => {
  try {
    const result = await validatorService.flagArtisan(req.user, req.params.artisanId, req.body.reason);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, error: error.error, message: error.message });
  }
};

exports.getArtisan = async (req, res) => {
  try {
    const result = await validatorService.getArtisan(req.params.artisanId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, error: error.error, message: error.message });
  }
};
