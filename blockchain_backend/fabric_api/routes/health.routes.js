const router = require('express').Router();

// GET /api/health — Simple health check for the gateway
router.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'ParamparaChain Fabric Gateway',
    port: process.env.PORT || 4000,
    channel: process.env.CHANNEL_NAME || 'supplychain-channel',
    chaincode: process.env.CHAINCODE_NAME || 'supplychain',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
