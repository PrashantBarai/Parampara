require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const lifecycleRoutes = require('./routes/lifecycle.routes');
const transferRoutes = require('./routes/transfer.routes');
const orderRoutes = require('./routes/order.routes');
const scanRoutes = require('./routes/scan.routes');
const verifyRoutes = require('./routes/verify.routes');
const feedbackRoutes = require('./routes/feedback.routes');
const validatorRoutes = require('./routes/validator.routes');
const tokenRoutes = require('./routes/token.routes');
const returnRoutes = require('./routes/return.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: ['http://localhost:3000'], credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Health Check ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'ParamparaChain Backend is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/product', productRoutes);
app.use('/api/lifecycle', lifecycleRoutes);
app.use('/api/transfer', transferRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/validator', validatorRoutes);
app.use('/api/token', tokenRoutes);
app.use('/api/return', returnRoutes);

// ─── 404 Handler ──────────────────────────────────────────
app.use('/{*path}', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ─────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Unhandled Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.error || 'SERVER_ERROR',
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ─── Start Server ─────────────────────────────────────────
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║        ParamparaChain Backend Server                  ║');
    console.log('╠═══════════════════════════════════════════════════════╣');
    console.log(`║  🚀 Server:     http://localhost:${PORT}                ║`);
    console.log('║  📊 Health:     http://localhost:5000/api/health      ║');
    console.log('║  🔗 Fabric:     supplychain-channel                  ║');
    console.log('║  🏢 Orgs:       7 (NGO, Validator, Mfr, Whs,        ║');
    console.log('║                     Dst, Rtl, Cst)                   ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log('');
  });
};

startServer().catch(console.error);

module.exports = app;
