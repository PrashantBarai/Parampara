const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { ROLE_TO_ORG } = require('../utils/constants');

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, org, location } = req.body;

    // Validate role-org match
    if (ROLE_TO_ORG[role] && ROLE_TO_ORG[role] !== org) {
      return res.status(400).json({ success: false, message: `Role '${role}' must belong to org '${ROLE_TO_ORG[role]}'` });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ success: false, error: 'AUTH_004', message: 'Email already registered' });

    const user = await User.create({ name, email, passwordHash: password, role, org, location });
    const token = jwt.sign({ id: user._id, role: user.role, org: user.org }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

    res.status(201).json({ success: true, data: { user, token } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.isActive) return res.status(401).json({ success: false, error: 'AUTH_002', message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, error: 'AUTH_002', message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role, org: user.org }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    res.json({ success: true, data: { user, token } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
