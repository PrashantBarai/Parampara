# ParamparaChain - Quick Reference Guide

## Project Setup

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env

# 3. Configure Fabric endpoints in .env (see FABRIC_SETUP.md)

# 4. Start server
npm start

# Server runs on http://localhost:5000
```

## Key Endpoints

### Product Management
```
POST   /api/products/create              # Create product (registers on blockchain)
GET    /api/products/:productId          # Get product from MongoDB
GET    /api/products                     # List all products
GET    /api/products/:productId/pricing  # Get pricing details
GET    /api/products/:productId/qr       # Get QR code
```

### Lifecycle & Ownership
```
POST   /api/lifecycle/transfer           # Transfer ownership (blockchain)
GET    /api/lifecycle/:productId         # Get full lifecycle
GET    /api/lifecycle/:productId/current # Get current stage
GET    /api/lifecycle/:productId/margins # Get margin breakdown
```

### Customer Feedback (Blockchain)
```
POST   /api/feedback                     # Submit feedback (blockchain)
GET    /api/feedback/:productId          # Get product feedback
GET    /api/feedback/:productId/summary  # Get feedback statistics
```

### Blockchain Operations
```
GET    /api/blockchain/organizations                    # List all orgs
GET    /api/blockchain/organizations/:org/functions    # Get org functions
GET    /api/blockchain/product/:productId              # Get from blockchain
GET    /api/blockchain/product/:productId/history      # Get history
POST   /api/blockchain/initialize                      # Init network (dev)
```

### Authentication
```
POST   /api/auth/register                # Register user
POST   /api/auth/login                   # Login user
POST   /api/auth/logout                  # Logout user
```

## Organizations & Roles

| Organization | MSP ID | Functions | Sequence |
|---|---|---|---|
| NGOOrg | NGOOrgMSP | registerProduct | 1st |
| ManufacturerOrg | ManufacturerOrgMSP | read-only | 2nd |
| WarehouseOrg | WarehouseOrgMSP | lifecycle, margins, transfer | 3rd |
| DistributorOrg | DistributorOrgMSP | lifecycle, margins, transfer | 4th |
| RetailerOrg | RetailerOrgMSP | lifecycle, margins, transfer | 5th |
| CustomerOrg | CustomerOrgMSP | feedback only | 6th |

## Chaincode Functions

### Write Operations (submitTransaction)
```javascript
registerProduct(productId, name, ngo, basePrice, imageCID)
  └─ NGOOrg only

addLifecycle(productId, stage, org, imageCID)
  └─ Warehouse, Distributor, Retailer only

addMargin(productId, org, margin)
  └─ Warehouse, Distributor, Retailer only

transferOwnership(productId, newOwner)
  └─ Warehouse, Distributor, Retailer only

addFeedback(productId, customerHash, rating, comment)
  └─ CustomerOrg only
```

### Read Operations (evaluateTransaction)
```javascript
getProduct(productId)
  └─ All organizations

getHistory(productId)
  └─ All organizations
```

## API Examples

### Register Product
```bash
curl -X POST http://localhost:5000/api/products/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Organic Cotton Fabric",
    "description": "Premium quality",
    "origin": "India",
    "manufacturerName": "XYZ Mills",
    "basePrice": "100",
    "imageHash": "abc123def456",
    "imageCID": "QmXyzAbcDef..."
  }'
```

**Response:**
```json
{
  "success": true,
  "product": {
    "productId": "PARAM_abc123...",
    "name": "Organic Cotton Fabric",
    "basePrice": 100,
    "blockchainStatus": "registered"
  }
}
```

### Transfer Ownership
```bash
curl -X POST http://localhost:5000/api/lifecycle/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "PARAM_abc123",
    "toUserId": "warehouse123",
    "marginAdded": 25,
    "imageCID": "QmNew...",
    "org": "WarehouseOrg"
  }'
```

### Submit Feedback
```bash
curl -X POST http://localhost:5000/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "PARAM_abc123",
    "customerEmail": "customer@example.com",
    "rating": 5,
    "comment": "Excellent quality!"
  }'
```

### Get Product from Blockchain
```bash
curl "http://localhost:5000/api/blockchain/product/PARAM_abc123?org=NGOOrg"
```

**Response:**
```json
{
  "success": true,
  "product": {
    "productId": "PARAM_abc123",
    "name": "Organic Cotton Fabric",
    "basePrice": 100,
    "currentOwner": "WarehouseOrg",
    "status": "warehoused",
    "history": [...],
    "margins": [...],
    "feedback": [...]
  }
}
```

## Environment Variables

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/paramparachain

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=development

# Fabric Network
FABRIC_CHANNEL=supplychain-channel
FABRIC_CHAINCODE=supplychain
FABRIC_CHAINCODE_VERSION=1.0.0

# Fabric Peers & CAs
NGO_PEERS=peer0.ngo.example.com
NGO_CA=ca.ngo.example.com
WAREHOUSE_PEERS=peer0.warehouse.example.com
WAREHOUSE_CA=ca.warehouse.example.com
# ... etc for other orgs

# Wallet
WALLET_PATH=./fabric-network/wallet
FABRIC_CONNECTION_PROFILE=./fabric-network/connection.json
ADMIN_USER=admin
ENROLLMENT_SECRET=adminpw
```

## Supply Chain Sequence

```
NGO (Product Registration)
  ↓ registerProduct()
  
Manufacturer (Read-only validation)
  ↓ 
  
Warehouse (Custody)
  ↓ addLifecycle(warehouse), addMargin(), transferOwnership()
  
Distributor (Distribution)
  ↓ addLifecycle(distributed), addMargin(), transferOwnership()
  
Retailer (Final Distribution)
  ↓ addLifecycle(retailed), addMargin(), transferOwnership()
  
Customer (Feedback)
  ↓ addFeedback() [via CustomerOrg - NO ownership changes]
```

## Error Handling

### Blockchain Unavailable
```json
{
  "success": true,
  "product": {...},
  "blockchainStatus": "pending",
  "blockchainError": "Connection timeout"
}
```
- API continues working
- Data saved to MongoDB
- Will retry when blockchain available

### Access Denied
```json
{
  "success": false,
  "message": "WarehouseOrg does not have permission to register products"
}
```
- Enforce access control
- Return 403 Forbidden
- Log attempt for audit

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
# Or use different port: PORT=5001 npm start
```

### MongoDB Connection Error
```bash
# Ensure MongoDB is running
mongod --version
# Default URI: mongodb://localhost:27017/paramparachain
```

### Fabric Network Not Accessible
```bash
# Check if Fabric containers are running
docker ps | grep fabric

# Verify connection profile paths
ls -la fabric-network/
```

### Wallet Issues
```bash
# Check wallet directory exists and is writable
ls -la fabric-network/wallet/

# Ensure admin is enrolled
test -f fabric-network/wallet/admin.id.json && echo "Admin enrolled"
```

## Performance Tips

1. **Use GET endpoints for reads** - No blockchain consensus needed
2. **Batch transfers** - Group multiple transfers when possible
3. **Cache frequently accessed data** - Reduce blockchain queries
4. **Monitor transaction latency** - Alert if >5 seconds
5. **Implement connection pooling** - Reuse database connections

## Security Best Practices

1. **Never commit .env** - Keep credentials private
2. **Use HTTPS in production** - Enable TLS
3. **Rotate credentials** - Change admin password regularly
4. **Validate all inputs** - Prevent injection attacks
5. **Monitor logs** - Track unauthorized access attempts
6. **Backup wallet** - Secure storage for private keys
7. **Audit blockchain transactions** - Review all changes

## Documentation Index

- **README.md** - Project overview and setup
- **SYSTEM_ARCHITECTURE.md** - Complete architecture design
- **FABRIC_SETUP.md** - Hyperledger Fabric network setup
- **INTEGRATION_GUIDE.md** - Blockchain integration details
- **API_DOCUMENTATION.md** - Complete REST API reference
- **UPDATES_SUMMARY.md** - Summary of changes made

## Key Files

| File | Purpose |
|---|---|
| `src/services/blockchain.service.js` | High-level blockchain operations |
| `src/services/fabric.service.js` | Low-level Fabric SDK wrapper |
| `src/config/fabric.js` | Fabric network configuration |
| `chaincode/supplychain.js` | Hyperledger Fabric chaincode |
| `src/routes/blockchain.routes.js` | Blockchain API endpoints |
| `src/controllers/feedback.controller.js` | Feedback handling |

## Common Tasks

### Create Product
```bash
1. Call: POST /api/products/create
2. Provides: Product registration on blockchain
3. Returns: Product ID, QR code, blockchain status
```

### Transfer Ownership
```bash
1. Call: POST /api/lifecycle/transfer
2. Provides: Ownership transfer on blockchain
3. Records: Lifecycle stage, margin, new owner
4. Enforces: Supply chain sequence validation
```

### Get Product History
```bash
1. Call: GET /api/blockchain/product/:productId/history?org=NGOOrg
2. Provides: Complete audit trail from blockchain
3. Includes: All lifecycle stages, margins, ownership changes
```

### Submit Feedback
```bash
1. Call: POST /api/feedback
2. Provides: Customer feedback on blockchain
3. Encrypts: Customer email before blockchain
4. Constraint: CustomerOrg CANNOT modify pricing/transfers
```

---

**For detailed information, refer to full documentation in backend directory.**
