// Supply chain forward sequence
const SUPPLY_CHAIN_SEQUENCE = [
  'NGOOrg',
  'ManufacturerOrg',
  'WarehouseOrg',
  'DistributorOrg',
  'RetailerOrg',
  'CustomerOrg',
];

// Valid forward transfers
const VALID_TRANSFERS = {
  NGOOrg: 'ManufacturerOrg',
  ManufacturerOrg: 'WarehouseOrg',
  WarehouseOrg: 'DistributorOrg',
  DistributorOrg: 'RetailerOrg',
  RetailerOrg: 'CustomerOrg',
};

// Return always goes to warehouse
const RETURN_TARGET_ORG = 'WarehouseOrg';

// Stage mapping per org
const STAGE_MAP = {
  NGOOrg: 'CREATED',
  ManufacturerOrg: 'MANUFACTURED',
  WarehouseOrg: 'WAREHOUSED',
  DistributorOrg: 'DISTRIBUTED',
  RetailerOrg: 'RETAILED',
  CustomerOrg: 'SOLD',
};

// Re-entry stages after return
const RE_STAGE_MAP = {
  WarehouseOrg: 'RE_WAREHOUSED',
  DistributorOrg: 'RE_DISTRIBUTED',
  RetailerOrg: 'RE_RETAILED',
};

// Who can add margins
const MARGIN_ALLOWED_ORGS = ['WarehouseOrg', 'DistributorOrg', 'RetailerOrg'];

// Who can transfer ownership
const TRANSFER_ALLOWED_ORGS = ['WarehouseOrg', 'DistributorOrg', 'RetailerOrg'];

// Pricing
const PRICE_CAP_MULTIPLIER = 2; // finalPrice <= 2x basePrice

// Returns
const MAX_RETURNS = 3;

// Token (Parampara Token)
const PT_VALUE_INR = 10;                // 1 PT = ₹10
const VALIDATION_REWARD_PT = 1;         // +1 PT per correct validation
const WRONG_VALIDATION_PENALTY_PT = 2;  // -2 PT per wrong validation

// Roles
const ROLES = ['ngo', 'validator', 'manufacturer', 'warehouse', 'distributor', 'retailer', 'customer'];

// Org types
const ORG_TYPES = ['NGO', 'VALIDATOR', 'SUPPLY_CHAIN', 'CUSTOMER'];

// All orgs
const ALL_ORGS = [
  'NGOOrg', 'ValidatorOrg', 'ManufacturerOrg',
  'WarehouseOrg', 'DistributorOrg', 'RetailerOrg', 'CustomerOrg',
];

// Role to Org mapping
const ROLE_TO_ORG = {
  ngo: 'NGOOrg',
  validator: 'ValidatorOrg',
  manufacturer: 'ManufacturerOrg',
  warehouse: 'WarehouseOrg',
  distributor: 'DistributorOrg',
  retailer: 'RetailerOrg',
  customer: 'CustomerOrg',
};

// Product statuses
const PRODUCT_STATUSES = [
  'REGISTERED', 'IN_WAREHOUSE', 'IN_DISTRIBUTION',
  'IN_RETAIL', 'SOLD', 'DELIVERED', 'RETURNED', 'RETIRED',
];

// Lifecycle stages
const LIFECYCLE_STAGES = [
  'CREATED', 'MANUFACTURED', 'WAREHOUSED', 'DISTRIBUTED', 'RETAILED',
  'SOLD', 'DELIVERED', 'RETURNED', 'RE_WAREHOUSED', 'RE_DISTRIBUTED', 'RE_RETAILED',
];

// Verification statuses
const VERIFICATION_STATUSES = ['PENDING_VERIFICATION', 'VERIFIED', 'REJECTED', 'FLAGGED_FRAUDULENT'];

module.exports = {
  SUPPLY_CHAIN_SEQUENCE,
  VALID_TRANSFERS,
  RETURN_TARGET_ORG,
  STAGE_MAP,
  RE_STAGE_MAP,
  MARGIN_ALLOWED_ORGS,
  TRANSFER_ALLOWED_ORGS,
  PRICE_CAP_MULTIPLIER,
  MAX_RETURNS,
  PT_VALUE_INR,
  VALIDATION_REWARD_PT,
  WRONG_VALIDATION_PENALTY_PT,
  ROLES,
  ORG_TYPES,
  ALL_ORGS,
  ROLE_TO_ORG,
  PRODUCT_STATUSES,
  LIFECYCLE_STAGES,
  VERIFICATION_STATUSES,
};
