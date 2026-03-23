/**
 * JWT Auth Middleware for Fabric Gateway
 * 
 * The backend (port 5000) issues JWTs when users log in.
 * This middleware validates the same JWT so the fabric_api
 * knows WHO is making the request and WHICH org they belong to.
 * 
 * Expected JWT payload: { id, email, role, org, name }
 */

const jwt = require('jsonwebtoken');

const ORG_TO_IDENTITY = {
    NGOOrg:          'ngoorgadmin',
    ValidatorOrg:    'validatororgadmin',
    ManufacturerOrg: 'manufacturerorgadmin',
    WarehouseOrg:    'warehouseorgadmin',
    DistributorOrg:  'distributororgadmin',
    RetailerOrg:     'retailerorgadmin',
    CustomerOrg:     'customerorgadmin',
};

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info + resolved Fabric identity
    req.user = {
      id:       decoded.id,
      email:    decoded.email,
      role:     decoded.role,
      org:      decoded.org,
      name:     decoded.name,
      // The Fabric wallet identity label for this user's org
      identity: ORG_TO_IDENTITY[decoded.org] || 'ngoorgadmin',
    };

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

module.exports = { authMiddleware, ORG_TO_IDENTITY };
