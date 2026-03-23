const path = require('path');

module.exports = {
  gatewayDir: path.resolve(__dirname, '../../../blockchain_backend/_gateways'),
  walletDir: path.resolve(__dirname, '../../../blockchain_backend/_wallets'),
  channelName: process.env.FABRIC_CHANNEL_NAME || 'supplychain-channel',
  chaincodeName: process.env.FABRIC_CHAINCODE_NAME || 'supplychain',

  // Org → gateway file mapping
  orgGatewayMap: {
    NGOOrg: 'ngoorggateway.json',
    ValidatorOrg: 'validatororggateway.json',
    ManufacturerOrg: 'manufacturerorggateway.json',
    WarehouseOrg: 'warehouseorggateway.json',
    DistributorOrg: 'distributororggateway.json',
    RetailerOrg: 'retailerorggateway.json',
    CustomerOrg: 'customerorggateway.json',
  },

  // Org → wallet identity mapping
  orgIdentityMap: {
    NGOOrg: 'ngoorgadmin',
    ValidatorOrg: 'validatororgadmin',
    ManufacturerOrg: 'manufacturerorgadmin',
    WarehouseOrg: 'warehouseorgadmin',
    DistributorOrg: 'distributororgadmin',
    RetailerOrg: 'retailerorgadmin',
    CustomerOrg: 'customerorgadmin',
  },
};
