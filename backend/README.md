# ParamparaChain Backend

A production-grade blockchain-enabled supply chain marketplace platform backend built with Node.js, Express.js, MongoDB, and Hyperledger Fabric.

## Features

✅ **Hyperledger Fabric Integration** - Blockchain layer for trust-critical operations
✅ **Multi-Organization Network** - NGOOrg, ManufacturerOrg, WarehouseOrg, DistributorOrg, RetailerOrg, CustomerOrg
✅ **NGO-led Product Onboarding** - NGOs register products on blockchain with immutable base prices
✅ **Enforced Supply Chain Sequence** - NGO → Manufacturer → Warehouse → Distributor → Retailer → Customer
✅ **Product Lifecycle Tracking** - Full traceability with blockchain checkpoints
✅ **QR-based Traceability** - Generate and scan QR codes for products
✅ **Dynamic Transparent Pricing** - Margin-based pricing (NOT fixed percentages) stored on blockchain
✅ **Blockchain Ownership Transfer** - Secure product transfers via Hyperledger Fabric
✅ **Customer Feedback on Blockchain** - CustomerOrg submits feedback via blockchain
✅ **Fraud Detection** - Advanced fraud detection via scan logs and location patterns
✅ **Image-based Verification** - Hash-based image verification for authenticity
✅ **Marketplace System** - Complete order management and purchase system
✅ **Role-based Access Control** - Organization-aligned RBAC with blockchain enforcement
✅ **JWT Authentication** - Secure token-based authentication

## Project Structure

```
backend/
├── src/
│   ├── controllers/          # Business logic controllers
│   │   ├── auth.controller.js
│   │   ├── product.controller.js (integrated with Fabric)
│   │   ├── lifecycle.controller.js (integrated with Fabric)
│   │   ├── scan.controller.js
│   │   ├── order.controller.js
│   │   ├── verify.controller.js
│   │   └── feedback.controller.js (blockchain-based)
│   │
│   ├── routes/              # API route definitions
│   │   ├── auth.routes.js
│   │   ├── product.routes.js
│   │   ├── lifecycle.routes.js
│   │   ├── scan.routes.js
│   │   ├── order.routes.js
│   │   ├── verify.routes.js
│   │   ├── feedback.routes.js
│   │   └── blockchain.routes.js
│   │
│   ├── models/              # MongoDB schemas
│   │   ├── user.model.js
│   │   ├── product.model.js
│   │   ├── lifecycle.model.js
│   │   ├── order.model.js
│   │   ├── scan.model.js
│   │   └── feedback.model.js
│   │
│   ├── services/            # Business services
│   │   ├── product.service.js
│   │   ├── lifecycle.service.js
│   │   ├── pricing.service.js
│   │   ├── fraud.service.js
│   │   ├── image.service.js
│   │   ├── fabric.service.js (Fabric SDK wrapper)
│   │   └── blockchain.service.js (Business logic)
│   │
│   ├── middlewares/         # Express middlewares
│   │   ├── auth.middleware.js
│   │   └── role.middleware.js
│   │
│   ├── utils/               # Utility functions
│   │   ├── hash.util.js
│   │   └── qr.util.js
│   │
│   ├── config/              # Configuration files
│   │   ├── db.js
│   │   └── fabric.js (Hyperledger Fabric config)
│   │
│   └── app.js               # Express app setup
│
├── chaincode/
│   └── supplychain.js       # Hyperledger Fabric chaincode
│
├── fabric-network/
│   ├── connection.json      # Connection profile
│   └── wallet/              # User identities
│
├── server.js                # Server entry point
├── package.json             # Dependencies
├── .env.example             # Environment variables example
├── API_DOCUMENTATION.md     # Complete API documentation
├── FABRIC_SETUP.md          # Hyperledger Fabric setup guide
└── README.md                # This file
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Steps

1. **Clone/Setup**
```bash
cd backend
```

2. **Install Dependencies**
```bash
npm install
```

3. **Configure Environment**
Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

Edit `.env`:
```
MONGODB_URI=mongodb://localhost:27017/paramparachain
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
```

4. **Start MongoDB**
```bash
mongod
```

5. **Start Development Server**
```bash
npm run dev
```

Server will start on `http://localhost:5000`

6. **Verify Server**
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "ParamparaChain Backend API is running"
}
```

## API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Products
- `POST /api/products/create` - Create product (NGO only)
- `GET /api/products` - Get all products
- `GET /api/products/:productId` - Get product details
- `PUT /api/products/:productId/status` - Update product status
- `GET /api/products/:productId/pricing` - Get pricing details
- `GET /api/products/:productId/qr` - Get QR code

### Lifecycle
- `POST /api/lifecycle/transfer` - Transfer ownership
- `GET /api/lifecycle/:productId` - Get full lifecycle
- `GET /api/lifecycle/:productId/current` - Get current stage
- `GET /api/lifecycle/:productId/margins` - Get margin breakdown

### Scanning & Fraud Detection
- `POST /api/scan` - Log product scan
- `POST /api/scan/fraud-check` - Check for fraud
- `GET /api/scan/:productId/logs` - Get scan logs
- `GET /api/scan/:productId/fraud-stats` - Get fraud statistics
- `GET /api/scan/:productId/alert` - Get fraud alert

### Orders
- `POST /api/orders/create` - Create order
- `GET /api/orders/:orderId` - Get order details
- `GET /api/orders/user/my-orders` - Get user's orders
- `PUT /api/orders/:orderId/status` - Update order status
- `GET /api/orders` - Get all orders (admin)

### Verification
- `POST /api/verify/image` - Verify image hash
- `POST /api/verify/images` - Batch verify images
- `POST /api/verify/compare-hashes` - Compare image hashes
- `POST /api/verify/cid` - Validate image CID
- `GET /api/verify/:productId/history` - Get verification history

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete details.

## User Roles

1. **NGO** - Product creation and initial onboarding
2. **DISTRIBUTOR** - Receive products, add margins, transfer to retailers
3. **RETAILER** - Receive products, add margins, sell to buyers
4. **ADMIN** - Full system access and monitoring
5. **BUYER** - Purchase products from retailers

## Core Features Explained

### Product Lifecycle
Products move through stages:
1. **NGO** - Creates product with base price
2. **DISTRIBUTOR** - Receives product, adds margin
3. **RETAILER** - Receives product, adds margin
4. **BUYER** - Purchases final product

Each transfer creates a lifecycle entry with:
- Stage actor and role
- Price at that stage
- Margin added
- Location and timestamp
- Image hash for verification

### Pricing Model
```
Final Price = Base Price + Distributor Margin + Retailer Margin
```

Key rules:
- Base price is immutable (set by NGO)
- Cannot sell below base price
- Margins are additive, not percentage-based
- Full transparency in price breakdown

### Fraud Detection
Detects fraud through:
- **Multiple Locations**: Product scanned in too many locations
- **Excessive Frequency**: Multiple scans in short time periods
- **Impossible Travel**: Location changes that are physically impossible
- **Scan Pattern Analysis**: Unusual scanning patterns

Fraud score thresholds:
- 0-50: Low risk
- 50-70: Medium risk
- 70+: High risk (alert issued)

### Image Verification
- Products have image hashes (SHA256)
- Images stored on IPFS (via CID)
- Verification checks uploaded image against original hash
- Similarity scoring for comparison

## Services Architecture

### ProductService
Manages product creation, retrieval, and status updates.

### LifecycleService
Handles ownership transfers, lifecycle tracking, and margin calculations.

### PricingService
Manages dynamic pricing, margin calculations, and price validation.

### FraudService
Detects fraudulent activities through scan analysis.

### ImageService
Verifies product images and manages image metadata.

## Security Features

- ✅ Password hashing with bcryptjs
- ✅ JWT token-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Input validation on all endpoints
- ✅ CORS protection
- ✅ Helmet.js for HTTP headers security
- ✅ Immutable base prices prevent tampering

## Database Schema

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: Enum['NGO', 'DISTRIBUTOR', 'RETAILER', 'ADMIN', 'BUYER'],
  organizationName: String,
  location: String,
  createdAt: Date
}
```

### Product
```javascript
{
  productId: String (unique, SHA256),
  name: String,
  origin: { village, state, country },
  manufacturerName: String,
  ngoId: ObjectId,
  basePrice: Number (immutable),
  currentPrice: Number,
  imageHash: String,
  metadataHash: String,
  currentOwner: ObjectId,
  status: Enum['CREATED', 'IN_TRANSIT', 'DELIVERED', 'SOLD']
}
```

### Lifecycle
```javascript
{
  productId: String,
  stage: String,
  actorId: ObjectId,
  priceAtStage: Number,
  marginAdded: Number,
  location: String,
  timestamp: Date
}
```

### Order
```javascript
{
  productId: String,
  buyerId: ObjectId,
  sellerId: ObjectId,
  finalPrice: Number,
  priceBreakdown: { basePrice, distributorMargin, retailerMargin },
  status: Enum[...]
}
```

## Testing

### Quick Test
```bash
# Health check
curl http://localhost:5000/api/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test NGO",
    "email": "test@example.com",
    "password": "password123",
    "role": "NGO"
  }'
```

See API_DOCUMENTATION.md for complete testing examples.

## Production Checklist

- [ ] Change JWT_SECRET to a strong random string
- [ ] Set NODE_ENV=production
- [ ] Use MongoDB Atlas or managed database
- [ ] Enable HTTPS/TLS
- [ ] Set up proper logging
- [ ] Configure rate limiting
- [ ] Set up monitoring and alerts
- [ ] Enable database backups
- [ ] Use environment variables for all secrets
- [ ] Run security audit

## Dependencies

- **express** - Web framework
- **mongoose** - MongoDB ODM
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing
- **qrcode** - QR code generation
- **cors** - CORS handling
- **helmet** - Security headers
- **dotenv** - Environment variables
- **express-validator** - Input validation

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/paramparachain |
| JWT_SECRET | JWT signing secret | (required) |
| JWT_EXPIRE | JWT expiration time | 7d |
| PORT | Server port | 5000 |
| NODE_ENV | Environment | development |

## Error Handling

All errors return consistent JSON response:
```json
{
  "success": false,
  "message": "Error description"
}
```

HTTP Status Codes:
- 200 - Success
- 201 - Created
- 400 - Bad Request
- 401 - Unauthorized
- 403 - Forbidden
- 404 - Not Found
- 500 - Server Error

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Check MONGODB_URI in .env file
- Verify MongoDB is accessible on specified host/port

### JWT Token Issues
- Ensure JWT_SECRET is set in .env
- Token should be prefixed with "Bearer " in Authorization header

### Port Already in Use
- Change PORT in .env file
- Or kill process on current port

## Contributing

1. Create feature branch
2. Follow existing code structure
3. Add proper error handling
4. Test endpoints before pushing
5. Update documentation

## License

ISC

## Support

For issues, questions, or suggestions, please open an issue or contact the development team.

---

**ParamparaChain** - Blockchain-powered transparent supply chain marketplace
