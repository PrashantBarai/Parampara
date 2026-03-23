/**
 * ┌─────────────────────────────────────────────┐
 * │   ParamparaChain — Fabric Gateway Server    │
 * │   Port 4000 (On-Chain REST API)             │
 * │                                             │
 * │   Talks to Microfab (9090) via fabric-SDK   │
 * │   Uses EXISTING _wallets & _gateways        │
 * └─────────────────────────────────────────────┘
 */

require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const logger   = require('./logger');
const { authMiddleware }  = require('./middleware/auth');

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ─────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Public Routes ─────────────────────────────────────────────────────
app.use('/api/health', require('./routes/health.routes'));

// ── Protected Routes (need JWT from your Backend :5000) ───────────────
app.use('/api/products', authMiddleware, require('./routes/product.routes'));
app.use('/api/artisans', authMiddleware, require('./routes/artisan.routes'));
app.use('/api/tokens',   authMiddleware, require('./routes/token.routes'));

// ── Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error({ error: err.message, stack: err.stack });
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

// ── Start Server ──────────────────────────────────────────────────────
app.listen(PORT, () => {
    logger.info(`🔗 standalone Fabric Gateway running on http://localhost:${PORT}`);
    logger.info(`   Using Wallets:  ./blockchain_backend/_wallets/`);
    logger.info(`   Using Gateways: ./blockchain_backend/_gateways/`);
    logger.info(`   Channel:        ${process.env.CHANNEL_NAME || 'supplychain-channel'}`);
});
