const Joi = require('joi');
const { ROLES, ALL_ORGS } = require('../utils/constants');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((d) => d.message);
      return res.status(400).json({ success: false, error: 'VALIDATION', message: errors });
    }
    next();
  };
};

// Schemas
const schemas = {
  register: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(128).required(),
    role: Joi.string().valid(...ROLES).required(),
    org: Joi.string().valid(...ALL_ORGS).required(),
    location: Joi.string().allow('').optional(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  productCreate: Joi.object({
    name: Joi.string().trim().min(2).max(200).required(),
    description: Joi.string().max(2000).optional(),
    artisanId: Joi.string().required(),
    basePrice: Joi.number().positive().required(),
  }),

  lifecycleAdd: Joi.object({
    productId: Joi.string().required(),
    stage: Joi.string().required(),
    marginValue: Joi.number().min(0).required(),
    location: Joi.string().optional(),
  }),

  transfer: Joi.object({
    productId: Joi.string().required(),
    toOrg: Joi.string().valid(...ALL_ORGS).required(),
  }),

  feedback: Joi.object({
    productId: Joi.string().required(),
    rating: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string().max(1000).optional(),
  }),

  scan: Joi.object({
    productId: Joi.string().required(),
    location: Joi.string().optional(),
    coordinates: Joi.object({ lat: Joi.number(), lng: Joi.number() }).optional(),
  }),

  returnInitiate: Joi.object({
    productId: Joi.string().required(),
    reason: Joi.string().min(5).max(500).required(),
  }),

  artisanRegister: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    craft: Joi.string().trim().min(2).max(200).required(),
    location: Joi.string().required(),
    issuedBy: Joi.string().optional(),
    issuedDate: Joi.date().optional(),
    expiryDate: Joi.date().optional(),
    craftType: Joi.string().optional(),
    region: Joi.string().optional(),
  }),

  artisanVerify: Joi.object({
    isValid: Joi.boolean().required(),
    reason: Joi.string().max(500).optional(),
  }),

  tokenRedeem: Joi.object({
    amount: Joi.number().integer().positive().required(),
  }),
};

module.exports = { validate, schemas };
