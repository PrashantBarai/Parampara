const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'AUTH_001', message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'AUTH_003',
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${req.user.role}`,
      });
    }

    next();
  };
};

module.exports = { authorize };
