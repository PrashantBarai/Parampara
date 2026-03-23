const router = require('express').Router();
const fabric = require('../gateway');

// POST /api/artisans — RegisterArtisan
router.post('/', async (req, res) => {
  try {
    const { identity, org } = req.user;
    const { artisanId, name, craft, location, giCertificateCID } = req.body;

    const result = await fabric.invoke(
      identity, org,
      'RegisterArtisan',
      artisanId, name, craft, location, giCertificateCID || ''
    );

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/artisans — GetAllArtisans
router.get('/', async (req, res) => {
  try {
    const { identity, org } = req.user;
    const result = await fabric.query(identity, org, 'GetAllArtisans');
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/artisans/:id — GetArtisan
router.get('/:id', async (req, res) => {
  try {
    const { identity, org } = req.user;
    const result = await fabric.query(identity, org, 'GetArtisan', req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/artisans/:id/validate — ValidateArtisan
router.post('/:id/validate', async (req, res) => {
  try {
    const { identity, org } = req.user;
    const { isValid } = req.body;

    const result = await fabric.invoke(
      identity, org,
      'ValidateArtisan',
      req.params.id, isValid ? 'true' : 'false'
    );

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/artisans/:id/flag — FlagArtisan
router.post('/:id/flag', async (req, res) => {
  try {
    const { identity, org } = req.user;
    const { reason } = req.body;

    const result = await fabric.invoke(
      identity, org,
      'FlagArtisan',
      req.params.id, reason || ''
    );

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
