# Hyperledger Fabric Setup Guide for ParamparaChain

## Overview

This guide provides step-by-step instructions for setting up Hyperledger Fabric for the ParamparaChain supply chain platform.

## Architecture

### Organizations
The network consists of 6 organizations, each with specific roles:

1. **NGOOrg** - Onboards manufacturers and registers products
2. **ManufacturerOrg** - Can only read product information
3. **WarehouseOrg** - Manages product storage, adds lifecycle stages, and margins
4. **DistributorOrg** - Manages product distribution, adds lifecycle stages, and margins
5. **RetailerOrg** - Manages retail operations, adds lifecycle stages, and margins
6. **CustomerOrg** - Submits feedback and views product/history (read-only)

### Channel
- **Channel Name**: `supplychain-channel`
- **Chaincode Name**: `supplychain`
- **Chaincode Version**: `1.0.0`

## Prerequisites

1. **Hyperledger Fabric v2.5.0+**
   - Download from: https://github.com/hyperledger/fabric/releases

2. **Docker & Docker Compose**
   - Docker 20.10+
   - Docker Compose 2.0+

3. **Node.js & npm**
   - Node.js 14+
   - npm 6+

4. **Hyperledger Fabric Tools**
   ```bash
   curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.5.0 1.5.5
   export PATH=$PATH:$(pwd)/fabric-samples/bin
   ```

## Network Setup

### Step 1: Generate Network Artifacts

```bash
# Navigate to your Fabric test network
cd fabric-samples/test-network

# Generate crypto materials for all organizations
./network.sh up createChannel -ca -c supplychain-channel
```

### Step 2: Install & Instantiate Chaincode

```bash
# Copy our chaincode to the appropriate location
cp /path/to/paramparachain/backend/chaincode/supplychain.js fabric-samples/chaincode/

# Install chaincode on all peers
./network.sh deployCC -ccn supplychain -ccv 1.0.0 -ccl javascript -ccs 1 -c supplychain-channel

# Start the chaincode container
docker ps | grep supplychain  # Verify container is running
```

### Step 3: Configure Connection Profiles

Create connection profiles for each organization in `fabric-network/` directory:

**fabric-network/connection-ngo.json**
```json
{
  "name": "supplychain-network",
  "version": "1.0.0",
  "client": {
    "organization": "NGOOrg",
    "connection": {
      "timeout": {
        "peer": { "endorser": "300" },
        "orderer": "300"
      }
    }
  },
  "organizations": {
    "NGOOrg": {
      "mspid": "NGOOrgMSP",
      "peers": ["peer0.ngo.example.com"],
      "certificateAuthorities": ["ca.ngo.example.com"]
    }
  },
  "peers": {
    "peer0.ngo.example.com": {
      "url": "grpc://localhost:7051",
      "tlsCACerts": {
        "pem": "<cert_content_here>"
      }
    }
  },
  "certificateAuthorities": {
    "ca.ngo.example.com": {
      "url": "http://localhost:7054",
      "caName": "ca-ngo",
      "tlsCACerts": { "pem": "<cert_content_here>" },
      "httpOptions": { "verify": false }
    }
  },
  "channels": {
    "supplychain-channel": {
      "orderers": ["orderer.example.com"],
      "peers": {
        "peer0.ngo.example.com": {
          "endorsingPeer": true,
          "chaincodeQuery": true,
          "ledgerQuery": true,
          "eventSource": true
        }
      }
    }
  }
}
```

Repeat for other organizations (ManufacturerOrg, WarehouseOrg, etc.)

### Step 4: Enroll Users

```bash
# Enroll admin for NGOOrg
fabric-ca-client enroll -u http://admin:adminpw@localhost:7054 --caname ca-ngo

# Repeat for other organizations with their respective CAs
```

## Environment Configuration

Create `.env` file in the backend root directory:

```env
# Hyperledger Fabric Configuration
FABRIC_CHANNEL=supplychain-channel
FABRIC_CHAINCODE=supplychain
FABRIC_CHAINCODE_VERSION=1.0.0

# Fabric Network Endpoints
NGO_PEERS=peer0.ngo.example.com
NGO_CA=ca.ngo.example.com
MANUFACTURER_PEERS=peer0.manufacturer.example.com
MANUFACTURER_CA=ca.manufacturer.example.com
WAREHOUSE_PEERS=peer0.warehouse.example.com
WAREHOUSE_CA=ca.warehouse.example.com
DISTRIBUTOR_PEERS=peer0.distributor.example.com
DISTRIBUTOR_CA=ca.distributor.example.com
RETAILER_PEERS=peer0.retailer.example.com
RETAILER_CA=ca.retailer.example.com
CUSTOMER_PEERS=peer0.customer.example.com
CUSTOMER_CA=ca.customer.example.com
ORDERER=orderer.example.com

# Wallet Configuration
WALLET_PATH=./fabric-network/wallet
FABRIC_CONNECTION_PROFILE=./fabric-network/connection.json
ADMIN_USER=admin
ENROLLMENT_SECRET=adminpw
ADMIN_PASSWORD=adminpw
```

## Chaincode Functions

### Product Registration (NGOOrg only)
```javascript
await contract.submitTransaction('registerProduct', productId, name, ngo, basePrice, imageCID);
```

### Add Lifecycle Checkpoint (Warehouse, Distributor, Retailer)
```javascript
await contract.submitTransaction('addLifecycle', productId, stage, org, imageCID);
```

### Add Margin (Warehouse, Distributor, Retailer)
```javascript
await contract.submitTransaction('addMargin', productId, org, margin);
```

### Transfer Ownership (Warehouse, Distributor, Retailer)
```javascript
await contract.submitTransaction('transferOwnership', productId, newOwner);
```

### Get Product (All organizations)
```javascript
const product = await contract.evaluateTransaction('getProduct', productId);
```

### Get History (All organizations)
```javascript
const history = await contract.evaluateTransaction('getHistory', productId);
```

### Add Feedback (CustomerOrg only)
```javascript
await contract.submitTransaction('addFeedback', productId, customerHash, rating, comment);
```

## Running the Backend with Fabric

```bash
# Install dependencies
cd backend
npm install

# Start the Express server
npm start

# The server will connect to Fabric on initialization
# Watch console for [Fabric] logs
```

## Testing the Integration

### Initialize Network (Development)
```bash
curl -X POST http://localhost:5000/api/blockchain/initialize
```

### Register a Product
```bash
curl -X POST http://localhost:5000/api/products/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Organic Cotton",
    "description": "Premium quality cotton",
    "origin": "India",
    "manufacturerName": "XYZ Mills",
    "basePrice": "100",
    "imageHash": "abc123...",
    "imageCID": "QmXyz..."
  }'
```

### Get Organizations
```bash
curl http://localhost:5000/api/blockchain/organizations
```

### Get Product from Blockchain
```bash
curl "http://localhost:5000/api/blockchain/product/PROD001?org=NGOOrg"
```

### Add Feedback
```bash
curl -X POST http://localhost:5000/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "PROD001",
    "customerEmail": "customer@example.com",
    "rating": 5,
    "comment": "Excellent product quality!"
  }'
```

## Troubleshooting

### Chaincode Connection Fails
- Verify Fabric network is running: `docker ps | grep fabric`
- Check connection profile paths are correct
- Ensure CA services are accessible

### Enrollment Issues
- Verify CA URL is correct in connection profile
- Check ENROLLMENT_SECRET matches CA configuration
- Ensure wallet directory exists and is writable

### Access Control Errors
- Verify organization MSP ID matches environment config
- Check user identity has correct MSP affiliation
- Ensure chaincode access control is properly implemented

## Production Considerations

1. **Security**
   - Use TLS for all peer and orderer connections
   - Implement key management best practices
   - Rotate admin credentials regularly

2. **High Availability**
   - Run multiple peers per organization
   - Deploy orderers in cluster
   - Use load balancing for API endpoints

3. **Monitoring**
   - Monitor blockchain transaction logs
   - Set up alerts for failed transactions
   - Track performance metrics

4. **Backup & Recovery**
   - Regularly backup ledger state
   - Maintain disaster recovery procedures
   - Test recovery mechanisms

## References

- [Hyperledger Fabric Documentation](https://hyperledger-fabric.readthedocs.io/)
- [Fabric SDK for Node.js](https://github.com/hyperledger/fabric-sdk-node)
- [Chaincode Best Practices](https://hyperledger-fabric.readthedocs.io/en/latest/developapps/smartcontract.html)
