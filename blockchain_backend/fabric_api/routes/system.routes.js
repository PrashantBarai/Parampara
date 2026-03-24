const router = require('express').Router();
const fabric = require('../gateway');

// System-level generic invoke used by legacy app_backend bridging
router.post('/invoke', async (req, res) => {
  try {
    const { identity, org } = req.user;
    const { fcn, args } = req.body;
    const result = await fabric.invoke(identity, org, fcn, ...(args || []));
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/query', async (req, res) => {
  try {
    const { identity, org } = req.user;
    const { fcn, args } = req.body;
    const result = await fabric.query(identity, org, fcn, ...(args || []));
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
