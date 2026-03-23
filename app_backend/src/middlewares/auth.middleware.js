const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'AUTH_001', message: 'Missing authentication token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: 'AUTH_002', message: 'Invalid or expired token' });
    }

    req.user = { id: user._id, email: user.email, role: user.role, org: user.org, name: user.name };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'AUTH_002', message: 'Invalid or expired token' });
  }
};

// Optional auth — attaches user if token present, continues if not
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user && user.isActive) {
        req.user = { id: user._id, email: user.email, role: user.role, org: user.org, name: user.name };
      }
    }
  } catch (_) { /* ignore invalid token for optional auth */ }
  next();
};

module.exports = { authenticate, optionalAuth };
