const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Import routes
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const lifecycleRoutes = require('./routes/lifecycle.routes');
const scanRoutes = require('./routes/scan.routes');
const orderRoutes = require('./routes/order.routes');
const verifyRoutes = require('./routes/verify.routes');
const feedbackRoutes = require('./routes/feedback.routes');
const blockchainRoutes = require('./routes/blockchain.routes');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ParamparaChain Backend API is running'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/lifecycle', lifecycleRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/blockchain', blockchainRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

module.exports = app;
