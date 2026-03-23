const router = require('express').Router();
const fabric = require('../gateway');

const PT_RATE = parseInt(process.env.PT_VALUE_INR || '10');

// GET /api/tokens/balance — GetTokenBalance
router.get('/balance', async (req, res) => {
  try {
    const { identity, org, email } = req.user;
    const result = await fabric.query(identity, org, 'GetTokenBalance', email);

    res.json({
      success: true,
      data: {
        ...result,
        valueInINR: (result.balance || 0) * PT_RATE,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/tokens/redeem — RedeemTokens
router.post('/redeem', async (req, res) => {
  try {
    const { identity, org, email } = req.user;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const result = await fabric.invoke(
      identity, org,
      'RedeemTokens',
      email, amount.toString()
    );

    res.json({
      success: true,
      data: {
        ...result,
        redeemedINR: amount * PT_RATE,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
