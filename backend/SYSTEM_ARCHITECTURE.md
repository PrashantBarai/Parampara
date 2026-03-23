# ParamparaChain System Architecture

## Overview

ParamparaChain is a production-grade blockchain-enabled supply chain platform with 3 distinct layers:

1. **Application Layer** - Express.js REST API with business logic
2. **Blockchain Layer** - Hyperledger Fabric for trust-critical operations
3. **Storage Layer** - MongoDB for application data, IPFS for images

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   Client Applications                        │
│            (Web, Mobile, Partner Systems)                    │
└────────────┬────────────────────────────────────────────────┘
             │
        ┌────▼────────────────────────────────────┐
        │   EXPRESS API LAYER (Node.js)           │
        │  ┌─────────────────────────────────────┐│
        │  │ Controllers & Routes                ││
        │  │ - Products, Lifecycle, Orders       ││
        │  │ - Scan Logs, Feedback              ││
        │  └─────────────────────────────────────┘│
        │  ┌─────────────────────────────────────┐│
        │  │ Services & Business Logic           ││
        │  │ - Product Service                  ││
        │  │ - Lifecycle Service                ││
        │  │ - Blockchain Service ◄─────┐       ││
        │  │ - Pricing Service          │       ││
        │  │ - Fraud Detection          │       ││
        │  │ - Image Verification       │       ││
        │  └─────────────────────────────────────┘│
        │  ┌─────────────────────────────────────┐│
        │  │ Middleware & Utilities              ││
        │  │ - JWT Auth                         ││
        │  │ - Role-Based Access Control        ││
        │  │ - Hash Utilities                   ││
        │  │ - QR Code Generation               ││
        │  └─────────────────────────────────────┘│
        └────┬────────────────────────────────────┘
             │
    ┌────────┼────────────────────────────┐
    │        │                            │
    ▼        ▼                            ▼
┌──────┐ ┌──────────────────────┐   ┌────────────┐
│  DB  │ │ BLOCKCHAIN LAYER     │   │   IPFS     │
│      │ │ Hyperledger Fabric   │   │  Storage   │
│      │ │                      │   │  (Images)  │
└──────┘ │ ┌──────────────────┐ │   └────────────┘
         │ │ Channel:         │ │
 MongoDB │ │ supplychain-chan │ │
         │ │                  │ │
         │ │ Chaincode:       │ │
         │ │ supplychain.js   │ │
         │ └──────────────────┘ │
         │                      │
         │ Organizations:       │
         │ • NGOOrg             │
         │ • ManufacturerOrg    │
         │ • WarehouseOrg       │
         │ • DistributorOrg     │
         │ • RetailerOrg        │
         │ • CustomerOrg        │
         └──────────────────────┘
```

## Layer Responsibilities

### 1. Application Layer (Express Backend)

**Responsibilities:**
- Handle HTTP requests and API logic
- Authenticate users via JWT
- Validate and sanitize inputs
- Business logic orchestration
- Database operations
- Integration with blockchain layer

**Key Components:**
- Controllers - Handle request/response
- Services - Implement business logic
- Routes - Define API endpoints
- Middleware - Authentication, authorization
- Models - Database schemas (MongoDB)

**Data Flow:**
```
Request → Controller → Service → MongoDB/Blockchain → Response
```

### 2. Blockchain Layer (Hyperledger Fabric)

**Responsibilities:**
- Store immutable product identity and base price
- Track ownership transfers
- Record lifecycle checkpoints
- Enforce supply chain sequence
- Store customer feedback
- Provide transparency and auditability

**Network Structure:**

```
Organizations (MSPs):
├── NGOOrg (MSP: NGOOrgMSP)
│   └── Can: registerProduct
│
├── ManufacturerOrg (MSP: ManufacturerOrgMSP)
│   └── Can: getProduct, getHistory (read-only)
│
├── WarehouseOrg (MSP: WarehouseOrgMSP)
│   └── Can: addLifecycle, addMargin, transferOwnership
│
├── DistributorOrg (MSP: DistributorOrgMSP)
│   └── Can: addLifecycle, addMargin, transferOwnership
│
├── RetailerOrg (MSP: RetailerOrgMSP)
│   └── Can: addLifecycle, addMargin, transferOwnership
│
└── CustomerOrg (MSP: CustomerOrgMSP)
    └── Can: addFeedback, getProduct, getHistory (NO transfers, NO pricing changes)
```

**Channel:** `supplychain-channel`
**Chaincode:** `supplychain` (v1.0.0)

**Chaincode Functions:**

| Function | NGO | Mfg | WHM | DST | RET | CST |
|----------|-----|-----|-----|-----|-----|-----|
| registerProduct | ✓ | - | - | - | - | - |
| addLifecycle | - | - | ✓ | ✓ | ✓ | - |
| addMargin | - | - | ✓ | ✓ | ✓ | - |
| transferOwnership | - | - | ✓ | ✓ | ✓ | - |
| getProduct | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| getHistory | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| addFeedback | - | - | - | - | - | ✓ |

### 3. Storage Layer

**MongoDB:**
- User accounts and credentials
- Product metadata and images hashes
- Lifecycle records and scan logs
- Order information
- Fraud detection data
- Feedback records

**IPFS (via Pinata):**
- Product images
- Quality certifications
- Batch documentation

**Blockchain:**
- Product identity (immutable)
- Base price (immutable)
- Ownership transfers
- Lifecycle checkpoints
- Customer feedback hashes

## Supply Chain Flow

### Enforced Sequence
```
NGOOrg
   ↓
ManufacturerOrg (validates product, no ownership transfer)
   ↓
WarehouseOrg (storage & custody)
   ↓
DistributorOrg (distribution)
   ↓
RetailerOrg (retail)
   ↓
CustomerOrg (feedback submission)
```

Each transition:
1. Previous owner calls `transferOwnership` on blockchain
2. New owner records `addLifecycle` checkpoint
3. Margins are added at each stage via `addMargin`
4. All changes are immutable and auditable

## Pricing Model

**Base Price** (immutable, set at registration):
```
basePrice = NGO's cost + NGO's margin
```

**Margin-Based Additions** (not percentages):
```
warehousePrice = basePrice + warehouse_margin
distributorPrice = warehousePrice + distributor_margin
retailPrice = distributorPrice + retailer_margin
```

Each organization stores margin in blockchain via `addMargin`:
```
blockchain: addMargin(productId, org, 25)  // Fixed margin, not percentage
```

## Authentication & Authorization

**JWT Token Structure:**
```json
{
  "userId": "user123",
  "role": "warehouse_manager",
  "org": "WarehouseOrg",
  "mspId": "WarehouseOrgMSP",
  "iat": 1234567890,
  "exp": 1234654290
}
```

**Access Control:**
1. **API Level** - JWT verification on all protected routes
2. **Business Logic Level** - Role checks in services
3. **Blockchain Level** - MSP-based access control in chaincode

## Data Consistency

### MongoDB ↔ Blockchain Sync

**On Product Creation:**
```
1. Create product in MongoDB
2. Register on blockchain (registerProduct)
3. If blockchain fails: mark as blockchainStatus = 'pending'
4. Retry mechanism for failed transactions
```

**On Ownership Transfer:**
```
1. Update owner in MongoDB (Lifecycle)
2. Call transferOwnership on blockchain
3. Record new stage via addLifecycle
4. Both operations must succeed or rollback
```

**On Feedback Submission:**
```
1. Hash customer email
2. Save feedback to MongoDB
3. Submit to blockchain via CustomerOrg
4. Blockchain maintains immutable feedback record
```

## Security Considerations

1. **API Security**
   - JWT authentication on all endpoints
   - HTTPS/TLS for all communications
   - CORS configured for allowed origins
   - Input validation and sanitization

2. **Blockchain Security**
   - MSP-based identity enforcement
   - Chaincode access control per function
   - Digital signatures on all transactions
   - Audit trail maintained by blockchain

3. **Data Privacy**
   - Customer email hashed before blockchain
   - Sensitive data stored in MongoDB only
   - Base price immutable on blockchain
   - Transaction signatures for non-repudiation

## Failure Handling

**Blockchain Unavailable:**
- API continues to work
- MongoDB records stored with blockchainStatus = 'pending'
- Automatic retry mechanism
- Retry logs maintained for audit

**Orphaned Records:**
- Products in MongoDB without blockchain record
- Regular reconciliation job
- Manual intervention capability

## Monitoring & Logging

**API Logging:**
- All requests logged with timestamp
- Authentication attempts tracked
- Error logs with stack traces

**Blockchain Monitoring:**
- Chaincode execution logs
- Transaction status monitoring
- Event listener logs
- Network health checks

## Deployment Architecture

```
┌─────────────┐
│   Clients   │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────────────┐
│  Load Balancer      │
└──────┬──────────────┘
       │
  ┌────┴────────┬─────────┬─────────┐
  │             │         │         │
  ▼             ▼         ▼         ▼
┌──────┐    ┌──────┐  ┌──────┐  ┌──────┐
│ App1 │    │ App2 │  │ App3 │  │ App4 │
└──┬───┘    └──┬───┘  └──┬───┘  └──┬───┘
   │           │         │         │
   └───────┬───┴────┬────┴────┬────┘
           │        │         │
       ┌───▼────┐   │    ┌────▼────┐
       │ MongoDB│   │    │ Fabric   │
       │ Cluster│   │    │ Network  │
       └────────┘   │    └──────────┘
                    │
                ┌───▼────┐
                │  IPFS   │
                │ Pinata  │
                └─────────┘
```

## Version Information

- **Node.js**: 14+
- **Express**: 4.18+
- **MongoDB**: 4.4+
- **Hyperledger Fabric**: 2.5.0+
- **Fabric SDK Node**: 2.2.19+

## References

- [Hyperledger Fabric Documentation](https://hyperledger-fabric.readthedocs.io/)
- [Express.js Guide](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
