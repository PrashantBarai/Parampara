const fs = require('fs');
const path = require('path');

const fabricConfig = {
  // Hyperledger Fabric Network Configuration
  network: {
    channel: process.env.FABRIC_CHANNEL || 'supplychain-channel',
    chaincode: process.env.FABRIC_CHAINCODE || 'supplychain',
    chaincodeVersion: process.env.FABRIC_CHAINCODE_VERSION || '1.0.0'
  },

  // Organizations and their MSPs
  organizations: {
    NGOOrg: {
      name: 'NGOOrg',
      mspId: 'NGOOrgMSP',
      peers: process.env.NGO_PEERS?.split(',') || ['peer0.ngo.example.com'],
      ca: process.env.NGO_CA || 'ca.ngo.example.com',
      orderer: process.env.ORDERER || 'orderer.example.com'
    },
    ManufacturerOrg: {
      name: 'ManufacturerOrg',
      mspId: 'ManufacturerOrgMSP',
      peers: process.env.MANUFACTURER_PEERS?.split(',') || ['peer0.manufacturer.example.com'],
      ca: process.env.MANUFACTURER_CA || 'ca.manufacturer.example.com'
    },
    WarehouseOrg: {
      name: 'WarehouseOrg',
      mspId: 'WarehouseOrgMSP',
      peers: process.env.WAREHOUSE_PEERS?.split(',') || ['peer0.warehouse.example.com'],
      ca: process.env.WAREHOUSE_CA || 'ca.warehouse.example.com'
    },
    DistributorOrg: {
      name: 'DistributorOrg',
      mspId: 'DistributorOrgMSP',
      peers: process.env.DISTRIBUTOR_PEERS?.split(',') || ['peer0.distributor.example.com'],
      ca: process.env.DISTRIBUTOR_CA || 'ca.distributor.example.com'
    },
    RetailerOrg: {
      name: 'RetailerOrg',
      mspId: 'RetailerOrgMSP',
      peers: process.env.RETAILER_PEERS?.split(',') || ['peer0.retailer.example.com'],
      ca: process.env.RETAILER_CA || 'ca.retailer.example.com'
    },
    CustomerOrg: {
      name: 'CustomerOrg',
      mspId: 'CustomerOrgMSP',
      peers: process.env.CUSTOMER_PEERS?.split(',') || ['peer0.customer.example.com'],
      ca: process.env.CUSTOMER_CA || 'ca.customer.example.com'
    }
  },

  // Chaincode functions accessible by each organization
  access: {
    NGOOrg: ['registerProduct'],
    ManufacturerOrg: ['getProduct', 'getHistory'],
    WarehouseOrg: ['addLifecycle', 'addMargin', 'transferOwnership', 'getProduct', 'getHistory'],
    DistributorOrg: ['addLifecycle', 'addMargin', 'transferOwnership', 'getProduct', 'getHistory'],
    RetailerOrg: ['addLifecycle', 'addMargin', 'transferOwnership', 'getProduct', 'getHistory'],
    CustomerOrg: ['addFeedback', 'getProduct', 'getHistory']
  },

  // Connection profile path (for development - should be set in production)
  connectionProfile: process.env.FABRIC_CONNECTION_PROFILE || path.join(__dirname, '../../fabric-network/connection.json'),

  // Wallet path
  walletPath: process.env.WALLET_PATH || path.join(__dirname, '../../fabric-network/wallet'),

  // User context
  userContext: {
    enrollmentSecret: process.env.ENROLLMENT_SECRET || 'adminpw',
    adminUser: process.env.ADMIN_USER || 'admin',
    adminPassword: process.env.ADMIN_PASSWORD || 'adminpw'
  }
};

// Helper function to get organization config
const getOrgConfig = (orgName) => {
  return fabricConfig.organizations[orgName] || null;
};

// Helper function to check if organization has access to chaincode function
const hasAccessToFunction = (orgName, functionName) => {
  const allowedFunctions = fabricConfig.access[orgName] || [];
  return allowedFunctions.includes(functionName);
};

module.exports = {
  fabricConfig,
  getOrgConfig,
  hasAccessToFunction
};
