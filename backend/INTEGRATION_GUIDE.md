# ParamparaChain - Blockchain Integration Guide

## Overview

This guide explains how the Express backend integrates with Hyperledger Fabric for the ParamparaChain supply chain platform.

## Integration Points

### 1. Product Registration

**When:** POST `/api/products/create`

**Flow:**
```
1. User creates product via API
   ├─ Validate input (Express)
   ├─ Create in MongoDB
   ├─ Register on blockchain (registerProduct)
   │  └─ Via BlockchainService.registerProductOnChain()
   ├─ Generate QR code
   └─ Return response
```

**Code Example:**
```javascript
// In product.controller.js
const product = await ProductService.createProduct({...}, req.user.id);

// Register on blockchain
try {
  await BlockchainService.registerProductOnChain(
    {
      productId: product.productId,
      name: product.name,
      basePrice: product.basePrice,
      imageCID: product.imageCID
    },
    'NGOOrg'  // Only NGOOrg can register
  );
  product.blockchainStatus = 'registered';
} catch (err) {
  product.blockchainStatus = 'pending';
  product.blockchainError = err.message;
}
```

**Blockchain Call:**
```
Chain: registerProduct(productId, name, ngo, basePrice, imageCID)
MSP: NGOOrgMSP (enforced in chaincode)
Stored: Product identity, base price (immutable), owner
```

### 2. Lifecycle Management

**When:** POST `/api/lifecycle/transfer`

**Flow:**
```
1. Current owner transfers product
   ├─ Validate transfer is allowed (Express)
   ├─ Update ownership in MongoDB
   ├─ Record on blockchain
   │  ├─ addLifecycle (new stage)
   │  └─ transferOwnership (new owner)
   └─ Return response
```

**Code Example:**
```javascript
// In lifecycle.controller.js
const result = await LifecycleService.transferOwnership(
  productId,
  req.user.id,
  toUserId,
  marginAdded,
  { imageCID, imageHash, location }
);

// Record on blockchain
const callingOrg = req.user.org || 'WarehouseOrg';
try {
  await BlockchainService.transferOwnershipOnChain(
    productId,
    toUserId,
    callingOrg
  );
  result.blockchainStatus = 'recorded';
} catch (err) {
  result.blockchainStatus = 'pending';
}
```

**Blockchain Calls:**
```
1. addLifecycle(productId, stage, org, imageCID)
   └─ Records checkpoint (warehouse, distribution, retail)

2. addMargin(productId, org, margin)
   └─ Records margin added by this org

3. transferOwnership(productId, newOwner)
   └─ Changes ownership on blockchain
```

**Sequence Enforcement:**
```
Valid: registered → warehoused → distributed → retailed
Invalid: registered → distributed (skips warehouse)
```

### 3. Customer Feedback

**When:** POST `/api/feedback`

**Flow:**
```
1. Customer submits feedback
   ├─ Hash customer email (privacy)
   ├─ Save to MongoDB
   ├─ Submit to blockchain (CustomerOrg only)
   │  └─ Via BlockchainService.addFeedbackOnChain()
   └─ Return response
```

**Code Example:**
```javascript
// In feedback.controller.js
const customerHash = hashString(customerEmail);

const feedback = await Feedback.create({
  productId,
  customerEmail: customerHash,
  rating,
  comment
});

// Record on blockchain
try {
  await BlockchainService.addFeedbackOnChain(
    productId,
    customerHash,
    rating,
    comment
  );
  feedback.blockchainStatus = 'recorded';
} catch (err) {
  feedback.blockchainStatus = 'pending';
}
```

**Blockchain Call:**
```
Chain: addFeedback(productId, customerHash, rating, comment)
MSP: CustomerOrgMSP (enforced in chaincode)
Constraint: CustomerOrg CANNOT modify pricing or transfer ownership
```

### 4. Product Verification

**When:** GET `/api/blockchain/product/:productId`

**Flow:**
```
1. User queries product from blockchain
   ├─ Verify user org has read access
   ├─ Initialize Fabric gateway
   ├─ Call chaincode getProduct
   └─ Return blockchain data
```

**Code Example:**
```javascript
// In blockchain.routes.js
router.get('/product/:productId', async (req, res) => {
  const { productId } = req.params;
  const { org } = req.query;

  const result = await BlockchainService.getProductFromChain(
    productId,
    org || 'NGOOrg'
  );

  res.json({ success: true, product: result });
});
```

**Data Retrieved:**
- Product identity
- Owner history
- Lifecycle checkpoints
- Pricing and margins
- Feedback records

## Service Architecture

### BlockchainService (High-Level)

```javascript
// Handles business logic for blockchain operations
// Located: src/services/blockchain.service.js

BlockchainService.registerProductOnChain(productData, userOrg)
BlockchainService.addLifecycleOnChain(productId, stage, org, imageCID)
BlockchainService.addMarginOnChain(productId, org, margin)
BlockchainService.transferOwnershipOnChain(productId, newOwner, org)
BlockchainService.getProductFromChain(productId, org)
BlockchainService.getHistoryFromChain(productId, org)
BlockchainService.addFeedbackOnChain(productId, customerHash, rating, comment)
```

### FabricService (Low-Level SDK)

```javascript
// Direct Fabric SDK wrapper
// Located: src/services/fabric.service.js

FabricService.initializeGateway(orgName, userId)
FabricService.submitTransaction(functionName, ...args)
FabricService.evaluateTransaction(functionName, ...args)
FabricService.disconnect()
FabricService.checkAccess(orgName, functionName)
```

## Access Control Matrix

```
Organization      registerProduct  addLifecycle  addMargin  transferOwnership  getProduct  getHistory  addFeedback
NGOOrg           ✓                -             -          -                  ✓           ✓           -
ManufacturerOrg  -                -             -          -                  ✓           ✓           -
WarehouseOrg     -                ✓             ✓          ✓                  ✓           ✓           -
DistributorOrg   -                ✓             ✓          ✓                  ✓           ✓           -
RetailerOrg      -                ✓             ✓          ✓                  ✓           ✓           -
CustomerOrg      -                -             -          -                  ✓           ✓           ✓
```

## Configuration

### Environment Variables (Required)

```env
# Blockchain Network
FABRIC_CHANNEL=supplychain-channel
FABRIC_CHAINCODE=supplychain
FABRIC_CHAINCODE_VERSION=1.0.0

# Organization Peers & CAs
NGO_PEERS=peer0.ngo.example.com
NGO_CA=ca.ngo.example.com
WAREHOUSE_PEERS=peer0.warehouse.example.com
WAREHOUSE_CA=ca.warehouse.example.com
# ... etc for other orgs

# Wallet & Connection
WALLET_PATH=./fabric-network/wallet
FABRIC_CONNECTION_PROFILE=./fabric-network/connection.json
ADMIN_USER=admin
ENROLLMENT_SECRET=adminpw
```

### Fabric Config File

```javascript
// src/config/fabric.js
const fabricConfig = {
  network: {
    channel: 'supplychain-channel',
    chaincode: 'supplychain',
    chaincodeVersion: '1.0.0'
  },
  organizations: {
    NGOOrg: { name: 'NGOOrg', mspId: 'NGOOrgMSP', ... },
    WarehouseOrg: { name: 'WarehouseOrg', mspId: 'WarehouseOrgMSP', ... },
    // ... other orgs
  },
  access: {
    NGOOrg: ['registerProduct'],
    WarehouseOrg: ['addLifecycle', 'addMargin', 'transferOwnership'],
    // ... other org permissions
  }
};
```

## Error Handling

### Graceful Degradation

When blockchain is unavailable:
```javascript
try {
  await BlockchainService.registerProductOnChain(data, 'NGOOrg');
  product.blockchainStatus = 'registered';
} catch (error) {
  // Continue with API functionality
  product.blockchainStatus = 'pending';
  product.blockchainError = error.message;
}
```

### Retry Mechanism

```javascript
// Automatic retry for failed blockchain operations
async function retryBlockchainOperation(
  operation,
  maxRetries = 3,
  delayMs = 1000
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } else {
        throw error;
      }
    }
  }
}
```

## Testing

### Unit Tests

```javascript
// Test blockchain service methods
describe('BlockchainService', () => {
  it('should register product on chain', async () => {
    const result = await BlockchainService.registerProductOnChain({
      productId: 'TEST001',
      name: 'Test Product',
      basePrice: 100,
      imageCID: 'QmTest'
    }, 'NGOOrg');

    expect(result.productId).toBe('TEST001');
    expect(result.currentOwner).toBe('NGOOrg');
  });
});
```

### Integration Tests

```javascript
// Test full flow: API → Service → Blockchain
describe('Product Registration Flow', () => {
  it('should create product in DB and register on chain', async () => {
    const response = await request(app)
      .post('/api/products/create')
      .send({
        name: 'Test Product',
        basePrice: 100,
        imageCID: 'QmTest'
      });

    expect(response.status).toBe(201);
    expect(response.body.product.blockchainStatus).toBe('registered');
  });
});
```

## Monitoring

### Health Check Endpoint

```javascript
// GET /api/health
{
  "success": true,
  "message": "ParamparaChain Backend API is running",
  "blockchain": {
    "connected": true,
    "channel": "supplychain-channel",
    "chaincode": "supplychain"
  }
}
```

### Logging

```javascript
// All blockchain operations logged
console.log('[Fabric] Initializing gateway for NGOOrg...');
console.log('[Fabric] Gateway connected for NGOOrg');
console.log('[Fabric] Submitting registerProduct with args:', [productId, name, ...]);
console.log('[Fabric] Transaction success, response:', result);
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Verify Fabric network is running: `docker ps | grep fabric`
   - Check peer/CA URLs in connection profile
   - Ensure WALLET_PATH is correct

2. **Access Denied**
   - Verify org MSP ID matches in config
   - Check user enrollment in wallet
   - Confirm chaincode access control

3. **Chaincode Not Found**
   - Verify chaincode is installed on peer
   - Check FABRIC_CHAINCODE version matches
   - Confirm channel has chaincode instantiated

## Production Deployment

1. **Use TLS Certificates**
   - Replace demo certs with real ones
   - Update connection profiles with cert paths

2. **Environment-Specific Config**
   - Development, staging, production configs
   - Load from environment variables

3. **Monitoring & Alerting**
   - Monitor blockchain transaction latency
   - Alert on repeated failures
   - Track chaincode call frequency

4. **Backup & Recovery**
   - Backup wallet and connection profiles
   - Disaster recovery procedures
   - Regular ledger snapshots

## References

- [Hyperledger Fabric SDK for Node.js](https://github.com/hyperledger/fabric-sdk-node)
- [Fabric Chaincode Development](https://hyperledger-fabric.readthedocs.io/en/latest/smartcontract/)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
