const router = require('express').Router();
const fabric = require('../gateway');

// POST /api/products — RegisterProduct
router.post('/', async (req, res) => {
  try {
    const { identity, org } = req.user;
    const { productId, name, description, artisanId, basePrice } = req.body;

    const result = await fabric.invoke(
      identity, org,
      'RegisterProduct',
      productId, name, description || '', artisanId,
      basePrice.toString()
    );

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products — GetAllProducts
router.get('/', async (req, res) => {
  try {
    const { identity, org } = req.user;
    const result = await fabric.query(identity, org, 'GetAllProducts');
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/:id — GetProduct
router.get('/:id', async (req, res) => {
  try {
    const { identity, org } = req.user;
    const result = await fabric.query(identity, org, 'GetProduct', req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/:id/history — GetHistory
router.get('/:id/history', async (req, res) => {
  try {
    const { identity, org } = req.user;
    const result = await fabric.query(identity, org, 'GetHistory', req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/:id/verify — VerifyProduct
router.get('/:id/verify', async (req, res) => {
  try {
    const { identity, org } = req.user;
    const result = await fabric.query(identity, org, 'VerifyProduct', req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/products/:id/lifecycle — AddLifecycle
router.post('/:id/lifecycle', async (req, res) => {
  try {
    const { identity, org } = req.user;
    const { stage, location } = req.body;

    const result = await fabric.invoke(
      identity, org,
      'AddLifecycle',
      req.params.id, stage, location || ''
    );

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/products/:id/margin — AddMargin
router.post('/:id/margin', async (req, res) => {
  try {
    const { identity, org } = req.user;
    const { marginValue } = req.body;

    const result = await fabric.invoke(
      identity, org,
      'AddMargin',
      req.params.id, marginValue.toString()
    );

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/products/:id/transfer — TransferOwnership
router.post('/:id/transfer', async (req, res) => {
  try {
    const { identity, org } = req.user;
    const { toOrg } = req.body;

    const result = await fabric.invoke(
      identity, org,
      'TransferOwnership',
      req.params.id, toOrg
    );

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/products/:id/feedback — AddFeedback
router.post('/:id/feedback', async (req, res) => {
  try {
    const { identity, org } = req.user;
    const { rating, comment } = req.body;

    const result = await fabric.invoke(
      identity, org,
      'AddFeedback',
      req.params.id, rating.toString(), comment || ''
    );

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/products/:id/return — InitiateReturn
router.post('/:id/return', async (req, res) => {
  try {
    const { identity, org } = req.user;
    const { reason } = req.body;

    const result = await fabric.invoke(
      identity, org,
      'InitiateReturn',
      req.params.id, reason || ''
    );

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
