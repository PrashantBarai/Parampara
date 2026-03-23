const productService = require('../services/product.service');
const { generateQRCode } = require('../utils/qr.util');

exports.create = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const result = await productService.createProduct(req.user, req.body, req.file, token);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, error: error.error, message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const result = await productService.getProduct(req.params.productId, token);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, error: error.error, message: error.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const { status, org, artisanId, page = 1, limit = 20 } = req.query;
    const result = await productService.getAllProducts({ status, org, artisanId }, parseInt(page), parseInt(limit));
    res.json({ success: true, data: result.products, pagination: result.pagination });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const history = await productService.getProductHistory(req.params.productId);
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.getQR = async (req, res) => {
  try {
    const qr = await generateQRCode(req.params.productId);
    res.json({ success: true, data: qr });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
