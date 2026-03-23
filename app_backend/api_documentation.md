# ParamparaChain — Full API & System Documentation

> **Sovereign Traceability & Fair Value Distribution for Indigenous Products**
> Blockchain-enabled supply chain platform built on Hyperledger Fabric + Express.js + MongoDB + IPFS

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Data Flow Architecture](#2-data-flow-architecture)
3. [Folder Structure](#3-folder-structure)
4. [MongoDB Models](#4-mongodb-models)
5. [Chaincode Functions](#5-chaincode-functions)
6. [API Endpoints](#6-api-endpoints)
7. [Services](#7-services)
8. [Middleware](#8-middleware)
9. [Pricing Engine](#9-pricing-engine)
10. [Fraud & Black Market Detection](#10-fraud--black-market-detection)
11. [Token System (Parampara Token)](#11-token-system-parampara-token)
12. [Artisan Verification System](#12-artisan-verification-system)
13. [Return & Resale System](#13-return--resale-system)
14. [IPFS Integration](#14-ipfs-integration)
15. [Error Codes](#15-error-codes)

---

## 1. System Overview

### 1.1 Architecture Layers

```
┌────────────────────────────────────────────────────────────────┐
│        FRONTEND (Next.js + TS + shadcn + TailwindCSS)          │
│                    Port: 3000 (Turbopack)                      │
└───────────────────────────┬────────────────────────────────────┘
                            │ REST API
┌───────────────────────────▼────────────────────────────────────┐
│             APPLICATION LAYER (Express.js) Port: 5000          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │   Auth   │ │  Routes  │ │ Services │ │Middleware│         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
└────────┬──────────────┬──────────────┬─────────────────────────┘
         │              │              │
┌────────▼───────┐ ┌────▼───────┐ ┌────▼──────┐
│   BLOCKCHAIN   │ │  MONGODB   │ │   IPFS    │
│   (Fabric)     │ │            │ │  (Pinata) │
│  LEDGER FIRST  │ │  SYNC COPY │ │  Images   │
└────────────────┘ └────────────┘ └───────────┘
```

### 1.2 Organizations & Roles (7 Orgs)

| Org | Role | Capabilities |
|-----|------|-------------|
| **NGOOrg** | Owner | Register products, set base price, onboard artisans/manufacturers |
| **ValidatorOrg** | Government Verifier | Verify GI certificates, validate artisans, earn PT tokens |
| **ManufacturerOrg** | Producer | View products, lifecycle visibility |
| **WarehouseOrg** | Supply Chain | addLifecycle, addMargin, transferOwnership, receive returns |
| **DistributorOrg** | Supply Chain | addLifecycle, addMargin, transferOwnership |
| **RetailerOrg** | Supply Chain | addLifecycle, addMargin, transferOwnership |
| **CustomerOrg** | Consumer | addFeedback, getProduct, getHistory, initiateReturn |

### 1.3 Supply Chain Sequence

```
Forward Flow:
NGOOrg → ManufacturerOrg → WarehouseOrg → DistributorOrg → RetailerOrg → CustomerOrg

Return Flow (max 3 per product):
CustomerOrg → WarehouseOrg (direct, only if product can be improved)
  └→ Then re-enters: WarehouseOrg → DistributorOrg → RetailerOrg → CustomerOrg
  └→ After 3rd return: product is PERMANENTLY RETIRED

Validation Flow:
NGOOrg registers artisan → ValidatorOrg verifies GI certificate → Artisan is VERIFIED
  └→ Correct validation → ValidatorOrg earns PT tokens
  └→ Wrong validation (detected later) → ValidatorOrg penalised (PT deducted)
```

### 1.4 Data Commitment Strategy

> **⚠️ CRITICAL: Ledger-First Architecture**

```
1. Client Request → Express Backend (port 5000)
2. Backend validates → calls Fabric SDK → submits transaction to LEDGER
3. Transaction committed to blockchain (source of truth)
4. Backend receives txId → stores SYNC COPY in MongoDB
5. MongoDB acts as read-optimized cache, NOT source of truth
```

---

## 2. Data Flow Architecture

### 2.1 Product Registration Flow

```
NGO uploads product + artisan GI cert + image
        │
        ├── Image → Pinata (IPFS) → get imageCID
        ├── GI Cert → Pinata (IPFS) → get certCID
        ├── Hash image → SHA-256 → imageHash
        │
        ▼
Fabric: RegisterProduct(productId, name, ngo, basePrice, imageCID, imageHash, artisanId)
        │
        ▼
MongoDB: Product.create({ ...allFields, blockchainTxId: txId })
        │
        ▼
Generate QR Code → Return product + QR
```

### 2.2 Artisan Verification Flow

```
NGO onboards artisan → uploads GI Certificate
        │
        ▼
Artisan record created (status: PENDING_VERIFICATION)
        │
        ▼
ValidatorOrg reviews GI certificate
        │
  ┌─────┴─────┐
  ▼           ▼
APPROVED    REJECTED
  │           │
  ▼           ▼
Validator   Artisan cannot
earns +1 PT  register products
  │
  ▼
Later, if artisan found fraudulent:
  → Validator penalised (-2 PT)
  → Artisan flagged
  → All products by artisan flagged
```

### 2.3 Return Flow

```
Customer initiates return
        │
        ▼
Check: returnCount < 3 for this productId
        │
  ┌─────┴──────────────┐
  │ returnCount >= 3   │ returnCount < 3
  │                    │
  ▼                    ▼
REJECTED           Fabric: TransferOwnership(productId, "CustomerOrg", "WarehouseOrg")
(Product RETIRED)      │
                       ▼
                   Product.status = "RETURNED"
                   Product.returnCount += 1
                       │
                       ▼
                   WarehouseOrg inspects & repairs
                       │
                       ▼
                   Re-enters supply chain:
                   Warehouse → Distributor → Retailer → Customer
```

### 2.4 Black Market Prevention — Traceability-Based

```
QR Scan is ALWAYS PUBLIC — anyone can scan and see:
  → Full product journey (origin, artisan, every transfer)
  → Price breakdown (base + all margins)
  → Current owner identity (hashed)
  → Authenticity verification

The PREVENTION is through ACCOUNTABILITY, not blocking:

Product SOLD to CustomerOrg
        │
        ▼
┌─ Last buyer's identity permanently on-chain ───────┐
│  ownerCustomerHash = SHA-256(customerId)           │
│  Stored immutably on Fabric ledger                 │
│                                                    │
│  Scenario: Customer sells product in black market  │
│  (physically, without using the official system)   │
│                                                    │
│  What happens:                                     │
│    → Black market buyer has NO identity on product │
│    → Product still shows original buyer on-chain   │
│    → If product is caught (raid, audit, complaint):│
│      → Trace last registered buyer from ledger     │
│      → That person is accountable for illegal sale │
│                                                    │
│  Deterrent:                                        │
│    → Buyers KNOW their identity is permanently     │
│      linked — discourages black market resale      │
│    → Black market buyer gets NO warranty,          │
│      NO proof of ownership, NO return rights       │
│    → Product re-entering supply chain without      │
│      official RETURN → flagged as BLACK_MARKET     │
└────────────────────────────────────────────────────┘
```

---

## 3. Folder Structure

```
Parampara/
├── app_backend/                          # Express.js (Port: 5000)
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                     # MongoDB connection
│   │   │   ├── fabric.config.js          # Fabric connection config
│   │   │   └── ipfs.config.js            # Pinata/IPFS config
│   │   │
│   │   ├── models/
│   │   │   ├── User.model.js
│   │   │   ├── Organisation.model.js
│   │   │   ├── Product.model.js
│   │   │   ├── Artisan.model.js          # NEW: artisan registry
│   │   │   ├── GICertificate.model.js    # NEW: GI certificate records
│   │   │   ├── Lifecycle.model.js
│   │   │   ├── Margin.model.js
│   │   │   ├── Order.model.js
│   │   │   ├── ScanLog.model.js
│   │   │   ├── Feedback.model.js
│   │   │   ├── Token.model.js            # NEW: PT token ledger
│   │   │   └── Return.model.js           # NEW: return records
│   │   │
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── product.controller.js
│   │   │   ├── lifecycle.controller.js
│   │   │   ├── transfer.controller.js
│   │   │   ├── order.controller.js
│   │   │   ├── scan.controller.js
│   │   │   ├── verify.controller.js
│   │   │   ├── feedback.controller.js
│   │   │   ├── validator.controller.js   # NEW
│   │   │   ├── token.controller.js       # NEW
│   │   │   └── return.controller.js      # NEW
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── product.routes.js
│   │   │   ├── lifecycle.routes.js
│   │   │   ├── transfer.routes.js
│   │   │   ├── order.routes.js
│   │   │   ├── scan.routes.js
│   │   │   ├── verify.routes.js
│   │   │   ├── feedback.routes.js
│   │   │   ├── validator.routes.js       # NEW
│   │   │   ├── token.routes.js           # NEW
│   │   │   └── return.routes.js          # NEW
│   │   │
│   │   ├── services/
│   │   │   ├── blockchain.service.js
│   │   │   ├── product.service.js
│   │   │   ├── lifecycle.service.js
│   │   │   ├── pricing.service.js
│   │   │   ├── transfer.service.js
│   │   │   ├── fraud.service.js
│   │   │   ├── image.service.js
│   │   │   ├── order.service.js
│   │   │   ├── validator.service.js      # NEW: GI cert verification
│   │   │   ├── token.service.js          # NEW: PT token engine
│   │   │   └── return.service.js         # NEW: return handling
│   │   │
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js
│   │   │   ├── role.middleware.js
│   │   │   └── validate.middleware.js
│   │   │
│   │   ├── utils/
│   │   │   ├── hash.util.js
│   │   │   ├── qr.util.js
│   │   │   └── constants.js
│   │   │
│   │   └── app.js                        # Express entry (port 5000)
│   │
│   ├── package.json
│   ├── .env
│   └── api_documentation.md
│
├── blockchain_backend/                    # Hyperledger Fabric
│   ├── MICROFAB.txt                      # 7 orgs (+ ValidatorOrg)
│   ├── deploy_chaincode.sh
│   ├── contracts/supplychain/            # Go chaincode
│   ├── _gateways/
│   ├── _wallets/
│   ├── _msp/
│   ├── bin/
│   └── config/
│
└── frontend/                             # Next.js + TS + shadcn + TailwindCSS (port 3000, Turbopack)
```

---

## 4. MongoDB Models

### 4.1 User

```javascript
const UserSchema = new Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: {
    type: String, required: true,
    enum: ['ngo', 'validator', 'manufacturer', 'warehouse', 'distributor', 'retailer', 'customer']
  },
  org: {
    type: String, required: true,
    enum: ['NGOOrg', 'ValidatorOrg', 'ManufacturerOrg', 'WarehouseOrg',
           'DistributorOrg', 'RetailerOrg', 'CustomerOrg']
  },
  location:  { type: String },
  isActive:  { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});
UserSchema.index({ email: 1 });
UserSchema.index({ org: 1, role: 1 });
UserSchema.methods.toJSON()          → strips passwordHash
UserSchema.methods.comparePassword() → bcrypt compare
UserSchema.statics.findByOrg(org)    → find all users in org
```

### 4.2 Organisation

```javascript
const OrganisationSchema = new Schema({
  name:  { type: String, required: true, unique: true },
  type: {
    type: String, required: true,
    enum: ['NGO', 'VALIDATOR', 'SUPPLY_CHAIN', 'CUSTOMER']
  },
  mspId:     { type: String, required: true },
  peerUrl:   { type: String },
  isActive:  { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});
```

### 4.3 Artisan (NEW)

```javascript
const ArtisanSchema = new Schema({
  artisanId:      { type: String, required: true, unique: true },
  name:           { type: String, required: true },
  craft:          { type: String, required: true },    // "Banarasi Silk Weaving"
  location:       { type: String, required: true },    // "Varanasi, UP"
  registeredBy:   { type: Schema.Types.ObjectId, ref: 'User', required: true }, // NGO user

  // GI Certificate
  giCertificateCID:  { type: String },                 // IPFS CID
  giCertificateHash: { type: String },                 // SHA-256

  // Verification
  verificationStatus: {
    type: String,
    enum: ['PENDING_VERIFICATION', 'VERIFIED', 'REJECTED', 'FLAGGED_FRAUDULENT'],
    default: 'PENDING_VERIFICATION'
  },
  verifiedBy:       { type: Schema.Types.ObjectId, ref: 'User' }, // Validator user
  verifiedAt:       { type: Date },
  rejectionReason:  { type: String },

  // Fraud tracking
  flaggedAt:        { type: Date },
  flagReason:       { type: String },

  blockchainTxId:   { type: String },
  createdAt:        { type: Date, default: Date.now }
});
ArtisanSchema.index({ verificationStatus: 1 });
ArtisanSchema.index({ registeredBy: 1 });
ArtisanSchema.statics.getPendingVerifications()     → all PENDING artisans
ArtisanSchema.statics.getByNgo(ngoUserId)           → artisans registered by NGO
ArtisanSchema.statics.flagAsFraudulent(artisanId)   → mark fraudulent + cascade
```

### 4.4 GICertificate (NEW)

```javascript
const GICertificateSchema = new Schema({
  certificateId:  { type: String, required: true, unique: true },
  artisanId:      { type: String, required: true, index: true },
  certificateCID: { type: String, required: true },   // IPFS CID
  certificateHash:{ type: String, required: true },   // SHA-256
  issuedBy:       { type: String },                   // Gov body name
  issuedDate:     { type: Date },
  expiryDate:     { type: Date },
  craftType:      { type: String },
  region:         { type: String },

  // Validation
  validationStatus: {
    type: String,
    enum: ['PENDING', 'VALID', 'INVALID', 'EXPIRED'],
    default: 'PENDING'
  },
  validatedBy:    { type: Schema.Types.ObjectId, ref: 'User' },
  validatedAt:    { type: Date },

  blockchainTxId: { type: String },
  createdAt:      { type: Date, default: Date.now }
});
```

### 4.5 Product

```javascript
const ProductSchema = new Schema({
  productId:      { type: String, required: true, unique: true, index: true },
  name:           { type: String, required: true },
  description:    { type: String },
  artisanId:      { type: String, required: true },   // Links to verified artisan
  ngoId:          { type: Schema.Types.ObjectId, ref: 'User', required: true },

  basePrice:      { type: Number, required: true, min: 0 },  // IMMUTABLE
  currentPrice:   { type: Number, required: true, min: 0 },

  imageCID:       { type: String },
  imageHash:      { type: String },

  currentOwner:       { type: Schema.Types.ObjectId, ref: 'User' },
  currentOwnerOrg:    { type: String },
  ownerCustomerHash:  { type: String },   // SHA-256 of customer identity (after SOLD)

  status: {
    type: String,
    enum: ['REGISTERED', 'IN_WAREHOUSE', 'IN_DISTRIBUTION', 'IN_RETAIL',
           'SOLD', 'DELIVERED', 'RETURNED', 'RETIRED'],
    default: 'REGISTERED'
  },

  // Return tracking
  returnCount:    { type: Number, default: 0, max: 3 },
  isRetired:      { type: Boolean, default: false },  // true after 3 returns

  qrCodeData:     { type: String },

  lifecycle:      [{ type: Schema.Types.ObjectId, ref: 'Lifecycle' }],
  margins:        [{ type: Schema.Types.ObjectId, ref: 'Margin' }],

  blockchainTxId: { type: String },
  createdAt:      { type: Date, default: Date.now }
});
ProductSchema.index({ productId: 1 });
ProductSchema.index({ currentOwnerOrg: 1, status: 1 });
ProductSchema.index({ artisanId: 1 });
ProductSchema.pre('save') → prevent basePrice mutation after creation
ProductSchema.pre('save') → if returnCount >= 3, set isRetired = true, status = RETIRED
```

### 4.6 Lifecycle

```javascript
const LifecycleSchema = new Schema({
  productId:    { type: String, required: true, index: true },
  stage: {
    type: String, required: true,
    enum: ['CREATED', 'WAREHOUSED', 'DISTRIBUTED', 'RETAILED', 'SOLD',
           'DELIVERED', 'RETURNED', 'RE_WAREHOUSED', 'RE_DISTRIBUTED', 'RE_RETAILED']
  },
  org:          { type: String, required: true },
  userId:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
  imageCID:     { type: String },
  imageHash:    { type: String },
  marginAdded:  { type: Number, default: 0 },
  priceAtStage: { type: Number, required: true },
  location:     { type: String },
  coordinates:  { lat: Number, lng: Number },
  isReturn:     { type: Boolean, default: false },    // true for return lifecycle entries
  blockchainTxId: { type: String },
  timestamp:    { type: Date, default: Date.now }
});
LifecycleSchema.index({ productId: 1, timestamp: 1 });
```

### 4.7 Margin

```javascript
const MarginSchema = new Schema({
  productId:  { type: String, required: true, index: true },
  org:        { type: String, required: true },
  value:      { type: Number, required: true, min: 0 },
  percentage: { type: Number },                       // auto-computed from value/basePrice
  timestamp:  { type: Date, default: Date.now }
});
MarginSchema.pre('save') → auto-compute percentage
```

### 4.8 Order

```javascript
const OrderSchema = new Schema({
  orderId:    { type: String, required: true, unique: true },
  productId:  { type: String, required: true, index: true },
  buyerId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sellerId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  finalPrice: { type: Number, required: true },
  priceBreakdown: {
    basePrice:         { type: Number },
    warehouseMargin:   { type: Number, default: 0 },
    distributorMargin: { type: Number, default: 0 },
    retailerMargin:    { type: Number, default: 0 },
    totalMargins:      { type: Number }
  },
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'DELIVERED', 'RETURNED', 'CANCELLED'],
    default: 'PENDING'
  },
  blockchainTxId: { type: String },
  createdAt:      { type: Date, default: Date.now }
});
```

### 4.9 ScanLog

```javascript
const ScanLogSchema = new Schema({
  productId:   { type: String, required: true, index: true },
  scannedBy:   { type: Schema.Types.ObjectId, ref: 'User' },
  anonymousId: { type: String },
  location:    { type: String },
  coordinates: { lat: Number, lng: Number },
  userAgent:   { type: String },
  timestamp:   { type: Date, default: Date.now },
  isFraud:     { type: Boolean, default: false },
  fraudReason: { type: String },
  // Black market detection
  ownerMismatch: { type: Boolean, default: false }  // scanner != registered owner
});
ScanLogSchema.index({ productId: 1, timestamp: -1 });
ScanLogSchema.index({ isFraud: 1 });
```

### 4.10 Feedback

```javascript
const FeedbackSchema = new Schema({
  productId:      { type: String, required: true, index: true },
  customerHash:   { type: String, required: true },
  rating:         { type: Number, required: true, min: 1, max: 5 },
  comment:        { type: String, maxlength: 1000 },
  imageCID:       { type: String },
  blockchainTxId: { type: String },
  timestamp:      { type: Date, default: Date.now }
});
```

### 4.11 Token (NEW — Parampara Token)

```javascript
const TokenSchema = new Schema({
  // Wallet
  userId:       { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  org:          { type: String, required: true },  // Only ValidatorOrg earns
  balance:      { type: Number, default: 0, min: 0 },

  // Transaction history
  transactions: [{
    type: {
      type: String,
      enum: ['EARNED', 'PENALTY', 'REDEEMED']
    },
    amount:      { type: Number },
    reason:      { type: String },
    referenceId: { type: String },    // artisanId or validationId
    timestamp:   { type: Date, default: Date.now }
  }],

  totalEarned:    { type: Number, default: 0 },
  totalPenalised: { type: Number, default: 0 },
  totalRedeemed:  { type: Number, default: 0 },

  blockchainTxId: { type: String },
  updatedAt:      { type: Date, default: Date.now }
});

// Constants:
// 1 PT = ₹10
// Correct validation = +1 PT
// Wrong validation detected = -2 PT (penalty)
```

### 4.12 Return (NEW)

```javascript
const ReturnSchema = new Schema({
  returnId:    { type: String, required: true, unique: true },
  productId:   { type: String, required: true, index: true },
  customerId:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reason:      { type: String, required: true },
  imageCID:    { type: String },           // Photo of damaged/defective product
  imageHash:   { type: String },

  returnNumber: { type: Number, required: true },  // 1st, 2nd, or 3rd return
  status: {
    type: String,
    enum: ['INITIATED', 'IN_TRANSIT', 'RECEIVED_BY_WAREHOUSE', 'REPAIRED', 'REJECTED'],
    default: 'INITIATED'
  },

  warehouseNotes: { type: String },        // Repair/improvement notes
  blockchainTxId: { type: String },
  createdAt:      { type: Date, default: Date.now }
});
```

---

## 5. Chaincode Functions

### 5.1 Core Supply Chain Functions

| Function | Access | Args | Description |
|----------|--------|------|-------------|
| `RegisterProduct` | NGOOrg | productId, name, artisanId, basePrice, imageCID, imageHash | Register new product (artisan must be VERIFIED) |
| `AddLifecycle` | Whs, Dst, Rtl | productId, stage, org, imageCID, imageHash, location | Add lifecycle checkpoint |
| `AddMargin` | Whs, Dst, Rtl | productId, org, marginValue | Add price margin |
| `TransferOwnership` | Whs, Dst, Rtl | productId, fromOrg, toOrg | Transfer ownership (validates sequence) |
| `GetProduct` | ALL | productId | Read product from ledger |
| `GetHistory` | ALL | productId | Get full tx history |
| `GetAllProducts` | ALL | — | List all products |
| `VerifyProduct` | ALL | productId, imageHash | Verify authenticity |

### 5.2 Customer Functions

| Function | Access | Args | Description |
|----------|--------|------|-------------|
| `AddFeedback` | CustomerOrg | productId, customerHash, rating, comment, imageCID | Submit feedback |
| `InitiateReturn` | CustomerOrg | productId, customerHash, reason | Start return (checks returnCount < 3) |

### 5.3 Validator Functions

| Function | Access | Args | Description |
|----------|--------|------|-------------|
| `RegisterArtisan` | NGOOrg | artisanId, name, craft, location, giCertCID, giCertHash | Register artisan for verification |
| `ValidateArtisan` | ValidatorOrg | artisanId, validatorId, isValid, reason | Approve/reject artisan |
| `FlagArtisan` | NGOOrg, ValidatorOrg | artisanId, reason | Flag artisan as fraudulent |

### 5.4 Token Functions

| Function | Access | Args | Description |
|----------|--------|------|-------------|
| `MintTokens` | System | validatorId, amount, reason | Award PT for correct validation |
| `PenaliseValidator` | System | validatorId, amount, reason | Deduct PT for wrong validation |
| `GetTokenBalance` | ValidatorOrg | validatorId | Check PT balance |
| `RedeemTokens` | ValidatorOrg | validatorId, amount | Convert PT to ₹ |

### 5.5 Access Control Matrix

```
Function            │ NGO │ Val │ Mfr │ Whs │ Dst │ Rtl │ Cst │
────────────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
RegisterProduct     │  ✅  │  ❌  │  ❌  │  ❌  │  ❌  │  ❌  │  ❌  │
RegisterArtisan     │  ✅  │  ❌  │  ❌  │  ❌  │  ❌  │  ❌  │  ❌  │
ValidateArtisan     │  ❌  │  ✅  │  ❌  │  ❌  │  ❌  │  ❌  │  ❌  │
FlagArtisan         │  ✅  │  ✅  │  ❌  │  ❌  │  ❌  │  ❌  │  ❌  │
AddLifecycle        │  ❌  │  ❌  │  ❌  │  ✅  │  ✅  │  ✅  │  ❌  │
AddMargin           │  ❌  │  ❌  │  ❌  │  ✅  │  ✅  │  ✅  │  ❌  │
TransferOwnership   │  ❌  │  ❌  │  ❌  │  ✅  │  ✅  │  ✅  │  ❌  │
GetProduct          │  ✅  │  ✅  │  ✅  │  ✅  │  ✅  │  ✅  │  ✅  │
GetHistory          │  ✅  │  ✅  │  ✅  │  ✅  │  ✅  │  ✅  │  ✅  │
AddFeedback         │  ❌  │  ❌  │  ❌  │  ❌  │  ❌  │  ❌  │  ✅  │
InitiateReturn      │  ❌  │  ❌  │  ❌  │  ❌  │  ❌  │  ❌  │  ✅  │
MintTokens          │ SYS │ SYS │  ❌  │  ❌  │  ❌  │  ❌  │  ❌  │
GetTokenBalance     │  ❌  │  ✅  │  ❌  │  ❌  │  ❌  │  ❌  │  ❌  │
RedeemTokens        │  ❌  │  ✅  │  ❌  │  ❌  │  ❌  │  ❌  │  ❌  │
```

---

## 6. API Endpoints

### 6.1 Auth

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| POST | `/api/auth/register` | Public | Register user |
| POST | `/api/auth/login` | Public | Login, get JWT |

### 6.2 Product

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| POST | `/api/product/create` | ngo | Create product (artisan must be VERIFIED) |
| GET | `/api/product/:productId` | ALL | Get product details + price breakdown |
| GET | `/api/product` | ALL | List products (filters: status, org, artisan) |
| GET | `/api/product/:productId/history` | ALL | Get blockchain history |
| GET | `/api/product/:productId/qr` | ngo, whs, dst, rtl | Generate QR code |

### 6.3 Lifecycle & Transfer

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| POST | `/api/lifecycle/add-stage` | whs, dst, rtl | Add lifecycle + margin (ledger-first) |
| POST | `/api/transfer` | whs, dst, rtl | Transfer ownership (validates sequence) |

### 6.4 Scan & Verify

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| POST | `/api/scan` | Public | Log QR scan + show full product journey + fraud detection |
| POST | `/api/verify/image` | ALL | Compare image hash with blockchain |

### 6.5 Order & Feedback

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| POST | `/api/order/create` | customer | Purchase product (ledger-first) |
| POST | `/api/feedback` | customer | Submit feedback (ledger-first) |

### 6.6 Return (NEW)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| POST | `/api/return/initiate` | customer | Start return (max 3, ledger-first) |
| PUT | `/api/return/:returnId/receive` | warehouse | Mark return received |
| PUT | `/api/return/:returnId/repair` | warehouse | Mark as repaired, re-enter supply chain |
| GET | `/api/return/product/:productId` | ALL | Get return history for product |

**POST /api/return/initiate** flow:
```
1. Check: product.returnCount < 3
2. If returnCount >= 3 → reject (PRODUCT_RETIRED)
3. Fabric: InitiateReturn(productId, customerHash, reason)
4. Fabric: TransferOwnership(productId, "CustomerOrg", "WarehouseOrg")
5. MongoDB: Product.returnCount += 1, status = "RETURNED"
6. MongoDB: Return.create({ returnNumber: returnCount })
7. If returnCount == 3 → Product.isRetired = true, Product.status = "RETIRED"
```

### 6.7 Validator (NEW)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| POST | `/api/validator/artisan/register` | ngo | Register artisan + upload GI cert |
| GET | `/api/validator/artisan/pending` | validator | List pending verifications |
| POST | `/api/validator/artisan/:artisanId/verify` | validator | Approve/reject artisan |
| POST | `/api/validator/artisan/:artisanId/flag` | ngo, validator | Flag artisan as fraudulent |
| GET | `/api/validator/artisan/:artisanId` | ALL | Get artisan details + verification status |

**POST /api/validator/artisan/:artisanId/verify** flow:
```
1. ValidatorOrg reviews GI certificate (CID on IPFS)
2. Fabric: ValidateArtisan(artisanId, validatorId, isValid, reason)
3. If APPROVED:
   → Artisan.verificationStatus = "VERIFIED"
   → Fabric: MintTokens(validatorId, 1, "Verified artisan {artisanId}")
   → Token.balance += 1 PT (= ₹10)
4. If REJECTED:
   → Artisan.verificationStatus = "REJECTED"
   → No tokens earned
```

**Wrong validation detection:**
```
Trigger: When artisan is later flagged as fraudulent
  → Find validator who approved this artisan
  → Fabric: PenaliseValidator(validatorId, 2, "Wrong validation for {artisanId}")
  → Token.balance -= 2 PT (= -₹20)
  → If balance < 0, set to 0 and flag validator account
```

### 6.8 Token (NEW)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/token/balance` | validator | Get PT balance |
| GET | `/api/token/transactions` | validator | Get token history |
| POST | `/api/token/redeem` | validator | Convert PT to ₹ (1 PT = ₹10) |

---

## 7. Services

### 7.1 blockchain.service.js

```javascript
class BlockchainService {
  async connectGateway(orgName)        → load wallet, connect via gateway JSON
  async submitTransaction(org, fn, ...args) → WRITE to ledger, return txId
  async evaluateTransaction(org, fn, ...args) → READ from ledger
  async getHistory(org, productId)     → get full tx history
}
```

### 7.2 product.service.js

```javascript
class ProductService {
  async createProduct(ngoUser, data, imageFile)
    → CHECK: artisan is VERIFIED
    → upload image → IPFS → hash
    → submit RegisterProduct to Fabric
    → sync to MongoDB + generate QR

  async getProduct(productId)
  async getAllProducts(filters, pagination)
}
```

### 7.3 validator.service.js (NEW)

```javascript
class ValidatorService {
  async registerArtisan(ngoUser, artisanData, giCertFile)
    → upload GI cert → IPFS
    → Fabric: RegisterArtisan(...)
    → MongoDB: Artisan + GICertificate

  async verifyArtisan(validatorUser, artisanId, isValid, reason)
    → Fabric: ValidateArtisan(...)
    → if valid → tokenService.mint(validatorId, 1)
    → sync MongoDB

  async flagArtisan(user, artisanId, reason)
    → Fabric: FlagArtisan(...)
    → find original validator → tokenService.penalise(validatorId, 2)
    → flag all products by this artisan
}
```

### 7.4 token.service.js (NEW)

```javascript
class TokenService {
  PT_VALUE_INR = 10;  // 1 PT = ₹10
  VALIDATION_REWARD = 1;   // +1 PT per correct validation
  WRONG_VALIDATION_PENALTY = 2;  // -2 PT per wrong validation

  async mint(validatorUserId, amount, reason) → ledger-first, then MongoDB
  async penalise(validatorUserId, amount, reason) → ledger-first, then MongoDB
  async getBalance(validatorUserId) → return { balance, valueInINR }
  async redeem(validatorUserId, amount) → convert PT to ₹
  async getTransactions(validatorUserId) → history
}
```

### 7.5 return.service.js (NEW)

```javascript
class ReturnService {
  MAX_RETURNS = 3;

  async initiateReturn(customerUser, productId, reason, imageFile)
    → check returnCount < 3
    → upload damage photo → IPFS
    → Fabric: InitiateReturn(...) + TransferOwnership(→WarehouseOrg)
    → MongoDB: Return.create + Product.returnCount++ + lifecycle entry
    → if returnCount == 3 → product RETIRED

  async receiveReturn(warehouseUser, returnId) → mark received
  async repairAndRelease(warehouseUser, returnId, notes) → re-enter supply chain
}
```

### 7.6 fraud.service.js (handles black market tracing)

```javascript
class FraudService {
  async analyzeScan(productId, scannerUserId, scanData)
    → checkFrequencyAnomaly (>5 scans/hour)
    → checkLocationAnomaly (2+ cities in <1 hour)
    → checkOwnershipChain
    → detectBlackMarketReentry (product in supply chain without RETURN)
    // NOTE: Scan ALWAYS returns full product details regardless of fraud flags
    // Fraud flags are logged internally for authorities/auditing

  async detectBlackMarketReentry(productId)
    → if product.status == "SOLD" && product re-enters supply chain without RETURN
    → flag as BLACK_MARKET, log last registered buyer for tracing
    → return { isBlackMarket: true, lastRegisteredBuyer: ownerCustomerHash }
}
```

### 7.7 pricing.service.js / lifecycle.service.js / transfer.service.js / image.service.js / order.service.js

Same as before — see original sections. All follow **ledger-first** pattern.

---

## 8. Middleware

```javascript
// auth.middleware.js
authenticate(req, res, next) → verify JWT, attach req.user

// role.middleware.js
authorize(...roles) → check req.user.role ∈ roles → 403 if not

// validate.middleware.js
validateProductCreate    → name, basePrice, artisanId required
validateLifecycleAdd     → productId, stage, marginValue required
validateTransfer         → productId, toOrg required
validateFeedback         → productId, rating (1-5) required
validateReturn           → productId, reason required
validateArtisanRegister  → name, craft, location, giCert file required
validateArtisanVerify    → isValid (boolean), reason required
```

---

## 9. Pricing Engine

| Rule | Description |
|------|-------------|
| **Immutable Base** | basePrice set by NGO, NEVER changes |
| **Additive Margins** | Each stage adds absolute value (NOT fixed %) |
| **Price Cap** | finalPrice ≤ 2 × basePrice |
| **No Below-Base** | Cannot sell below basePrice |
| **Transparent** | Full price breakdown shown to customer |

```
Example:
  Base (Artisan via NGO):    ₹5,000
  + WarehouseOrg:            ₹500     → ₹5,500
  + DistributorOrg:          ₹1,200   → ₹6,700
  + RetailerOrg:             ₹800     → ₹7,500   ✅ (1.5x < 2x cap)
```

---

## 10. Fraud & Black Market Detection

| Strategy | Logic | Threshold |
|----------|-------|-----------|
| Frequency Anomaly | Too many scans | >5 scans in 1 hour |
| Location Anomaly | Distant scans | 2+ cities in <1 hour |
| Chain Anomaly | Broken ownership | Missing lifecycle stages |
| Black Market | Scanner ≠ owner | After SOLD status, different scanner hash |
| Duplicate Registry | Same image hash | Image CID/hash collision |

### Black Market Prevention (Traceability-Based)

```
KEY PRINCIPLE: QR scans are ALWAYS public — show full product journey.
Prevention is through ACCOUNTABILITY:

1. Last buyer's identity (hash) permanently on blockchain
2. If product caught in black market → trace last registered buyer
3. That person is held accountable for unauthorized resale
4. Black market buyer gets NO warranty, NO return rights, NO ownership proof
5. Product re-entering supply chain without RETURN process → flagged BLACK_MARKET
6. Deterrent: buyers know their identity is permanently linked
```

---

## 11. Token System (Parampara Token)

```
Token: PT (Parampara Token)
Value: 1 PT = ₹10

WHO EARNS:    ValidatorOrg only
HOW:          +1 PT per correct artisan validation

PENALTY:      -2 PT when approved artisan is later flagged fraudulent
TRIGGER:      FlagArtisan event → lookup validator → auto-deduct

REDEEM:       ValidatorOrg can convert PT → ₹ at 1:10 rate

ON-CHAIN:     Token balances + transactions stored on ledger (Fabric)
SYNC:         MongoDB mirrors for fast queries
```

### When is a validation "wrong"?

```
1. Another ValidatorOrg member or NGO flags the artisan
2. Products from this artisan fail image verification (hash mismatch)
3. Customer feedback reveals counterfeiting (multiple low ratings + fraud scans)
4. GI certificate found to be forged (manual audit)

→ Any of these trigger FlagArtisan → validator penalised -2 PT
```

---

## 12. Artisan Verification System

```
Flow:
  1. NGO registers artisan with GI certificate (govt-issued)
  2. GI cert uploaded to IPFS, hash stored on ledger
  3. Artisan status = PENDING_VERIFICATION
  4. ValidatorOrg (govt body) reviews GI certificate
  5. If valid → VERIFIED → validator earns +1 PT
  6. If invalid → REJECTED → no tokens
  7. Only VERIFIED artisans can have products registered

Later:
  8. If artisan flagged fraudulent → validator penalised -2 PT
  9. All products by flagged artisan are flagged
```

---

## 13. Return & Resale System

```
Rules:
  1. Customer can return product directly to WarehouseOrg
  2. Only if product can be improved/repaired
  3. Maximum 3 returns per productId
  4. After 3rd return → product is PERMANENTLY RETIRED
  5. Returned product re-enters: Warehouse → Distributor → Retailer → Customer
  6. Each re-entry creates new lifecycle entries with isReturn=true

Return Lifecycle Stages:
  RETURNED → RE_WAREHOUSED → RE_DISTRIBUTED → RE_RETAILED → SOLD
```

---

## 14. IPFS Integration

```
Image File → Express Backend → Pinata SDK → IPFS → CID
GI Cert    → Express Backend → Pinata SDK → IPFS → CID

Config (.env):
  PINATA_API_KEY=<key>
  PINATA_SECRET_KEY=<secret>
  PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs/
```

---

## 15. Error Codes

| Code | Status | Description |
|------|--------|-------------|
| AUTH_001 | 401 | Missing token |
| AUTH_002 | 401 | Invalid/expired token |
| AUTH_003 | 403 | Insufficient permissions |
| PROD_001 | 404 | Product not found |
| PROD_002 | 400 | Invalid product data |
| PROD_003 | 409 | Product already exists |
| PROD_004 | 400 | Artisan not VERIFIED |
| LIFE_001 | 400 | Invalid stage sequence |
| LIFE_002 | 403 | Not current owner |
| LIFE_003 | 422 | Price exceeds 2x cap |
| XFER_001 | 400 | Invalid transfer sequence |
| XFER_002 | 403 | Not current owner |
| RET_001 | 400 | Max returns reached (3) |
| RET_002 | 400 | Product is RETIRED |
| RET_003 | 403 | Not the customer who purchased |
| SCAN_001 | 404 | Product not found |
| SCAN_002 | 200 | Fraud detected |
| SCAN_003 | 200 | Black market warning (scanner ≠ owner) |
| FEED_001 | 403 | Only customers can submit |
| FEED_002 | 400 | No order exists |
| VAL_001 | 400 | Artisan already verified |
| VAL_002 | 404 | Artisan not found |
| VAL_003 | 403 | Only ValidatorOrg can verify |
| TKN_001 | 400 | Insufficient PT balance |
| TKN_002 | 403 | Only ValidatorOrg can redeem |
| FAB_001 | 500 | Fabric connection error |
| FAB_002 | 500 | Transaction failed |

---

## Constants

```javascript
// utils/constants.js
const SUPPLY_CHAIN_SEQUENCE = [
  'NGOOrg', 'ManufacturerOrg', 'WarehouseOrg',
  'DistributorOrg', 'RetailerOrg', 'CustomerOrg'
];

const RETURN_TARGET_ORG = 'WarehouseOrg';  // Returns always go to warehouse

const STAGE_MAP = {
  'NGOOrg':          'REGISTERED',
  'ManufacturerOrg': 'MANUFACTURED',
  'WarehouseOrg':    'WAREHOUSED',
  'DistributorOrg':  'DISTRIBUTED',
  'RetailerOrg':     'RETAILED',
  'CustomerOrg':     'SOLD'
};

const MARGIN_ALLOWED_ORGS = ['WarehouseOrg', 'DistributorOrg', 'RetailerOrg'];
const TRANSFER_ALLOWED_ORGS = ['WarehouseOrg', 'DistributorOrg', 'RetailerOrg'];
const PRICE_CAP_MULTIPLIER = 2;
const MAX_RETURNS = 3;

// Token
const PT_VALUE_INR = 10;                // 1 PT = ₹10
const VALIDATION_REWARD_PT = 1;         // +1 PT per correct validation
const WRONG_VALIDATION_PENALTY_PT = 2;  // -2 PT per wrong validation
```
