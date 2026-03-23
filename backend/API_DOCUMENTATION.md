# ParamparaChain Backend API Documentation

## Overview
Complete backend system for a blockchain-based supply chain marketplace platform using Node.js (Express.js) and MongoDB.

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## 1. Authentication Endpoints

### Register User
```
POST /auth/register
```

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "NGO",
  "organizationName": "Hope NGO",
  "location": "New York"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "NGO"
  }
}
```

### Login
```
POST /auth/login
```

**Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** Similar to register response with token

### Get Current User (Protected)
```
GET /auth/me
```

---

## 2. Product Endpoints

### Create Product (NGO Only)
```
POST /products/create
Authorization: Bearer <token>
```

**Body:**
```json
{
  "name": "Organic Coffee",
  "description": "Premium single-origin coffee",
  "origin": {
    "village": "Mountain Valley",
    "state": "Kerala",
    "country": "India"
  },
  "manufacturerName": "Coffee Co",
  "basePrice": 100,
  "imageHash": "abc123def456...",
  "imageCID": "QmXxxx...",
  "location": "Kerala"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product created successfully",
  "product": {
    "_id": "...",
    "productId": "sha256hash...",
    "name": "Organic Coffee",
    "basePrice": 100,
    "currentPrice": 100,
    "status": "CREATED"
  },
  "qrCode": "data:image/png;base64,..."
}
```

### Get Product by ID
```
GET /products/:productId
```

**Response:**
```json
{
  "success": true,
  "product": { ... }
}
```

### Get All Products
```
GET /products?status=CREATED&ngoId=...
```

### Update Product Status
```
PUT /products/:productId/status
Authorization: Bearer <token>
```

**Body:**
```json
{
  "status": "IN_TRANSIT"
}
```

### Get Product Pricing
```
GET /products/:productId/pricing
```

### Get Product QR Code
```
GET /products/:productId/qr
```

---

## 3. Lifecycle Endpoints

### Transfer Ownership
```
POST /lifecycle/transfer
Authorization: Bearer <token>
```

**Body:**
```json
{
  "productId": "...",
  "toUserId": "...",
  "marginAdded": 25,
  "imageCID": "QmXxxx...",
  "imageHash": "hash...",
  "location": "Mumbai",
  "status": "IN_TRANSIT"
}
```

### Get Product Lifecycle
```
GET /lifecycle/:productId
```

**Response:**
```json
{
  "success": true,
  "productId": "...",
  "stages": 3,
  "lifecycle": [
    {
      "_id": "...",
      "productId": "...",
      "stage": "NGO",
      "priceAtStage": 100,
      "marginAdded": 0,
      "timestamp": "2024-01-01T00:00:00Z"
    },
    {
      "stage": "DISTRIBUTOR",
      "priceAtStage": 125,
      "marginAdded": 25,
      "timestamp": "2024-01-02T00:00:00Z"
    }
  ]
}
```

### Get Current Stage
```
GET /lifecycle/:productId/current
```

### Get Lifecycle by Stage
```
GET /lifecycle/:productId/stage/:stage
```

### Get Margin Breakdown
```
GET /lifecycle/:productId/margins
```

---

## 4. Scan Endpoints

### Log Scan
```
POST /scan
```

**Body:**
```json
{
  "productId": "...",
  "location": "Mumbai",
  "userId": "..." (optional)
}
```

### Check Fraud
```
POST /scan/fraud-check
```

**Body:**
```json
{
  "productId": "...",
  "location": "Mumbai"
}
```

**Response:**
```json
{
  "success": true,
  "productId": "...",
  "fraudCheck": {
    "isFraud": false,
    "score": 20,
    "indicators": [
      {
        "type": "MULTIPLE_LOCATIONS",
        "message": "Product scanned in 2 different locations"
      }
    ]
  }
}
```

### Get Scan Logs
```
GET /scan/:productId/logs
```

### Get Fraud Statistics
```
GET /scan/:productId/fraud-stats
```

### Get Fraud Alert
```
GET /scan/:productId/alert
```

### Mark Scan as Fraud (Protected)
```
POST /scan/:scanId/mark-fraud
Authorization: Bearer <token>
```

**Body:**
```json
{
  "reason": "Impossible travel distance"
}
```

---

## 5. Order Endpoints

### Create Order
```
POST /orders/create
Authorization: Bearer <token>
```

**Body:**
```json
{
  "productId": "...",
  "sellerId": "..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "order": {
    "_id": "...",
    "productId": "...",
    "buyerId": "...",
    "sellerId": "...",
    "finalPrice": 150,
    "priceBreakdown": {
      "basePrice": 100,
      "distributorMargin": 25,
      "retailerMargin": 25
    },
    "status": "PENDING"
  }
}
```

### Get Order
```
GET /orders/:orderId
Authorization: Bearer <token>
```

### Get User's Orders
```
GET /orders/user/my-orders
Authorization: Bearer <token>
```

### Update Order Status
```
PUT /orders/:orderId/status
Authorization: Bearer <token>
```

**Body:**
```json
{
  "status": "CONFIRMED"
}
```

Valid statuses: PENDING, CONFIRMED, SHIPPED, DELIVERED, COMPLETED, CANCELLED

### Get All Orders (Admin Only)
```
GET /orders?status=PENDING
Authorization: Bearer <token>
```

---

## 6. Verification Endpoints

### Verify Image
```
POST /verify/image
```

**Body:**
```json
{
  "productId": "...",
  "uploadedImageHash": "..."
}
```

**Response:**
```json
{
  "success": true,
  "productId": "...",
  "matches": true,
  "confidence": 100,
  "message": "Image verified successfully"
}
```

### Batch Verify Images
```
POST /verify/images
```

**Body:**
```json
{
  "verificationData": [
    {
      "productId": "...",
      "uploadedImageHash": "..."
    }
  ]
}
```

### Compare Hashes
```
POST /verify/compare-hashes
```

**Body:**
```json
{
  "hash1": "...",
  "hash2": "..."
}
```

### Validate CID
```
POST /verify/cid
```

**Body:**
```json
{
  "cid": "QmXxxx..."
}
```

### Get Verification History
```
GET /verify/:productId/history
```

---

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 500: Server Error

---

## User Roles

1. **NGO** - Can create products
2. **DISTRIBUTOR** - Can receive products and add margins
3. **RETAILER** - Can receive products and add margins
4. **ADMIN** - Can access all endpoints and view all orders
5. **BUYER** - Can purchase products

---

## Business Rules

1. Base price set by NGO is immutable
2. Products cannot be sold below base price
3. Each actor adds margins instead of fixed percentages
4. Final price = basePrice + all margins
5. Only current owner can transfer product
6. Every transfer creates lifecycle entry
7. Every scan is logged for traceability
8. Fraud detection based on location patterns and scan frequency

---

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
Create `.env` file:
```
MONGODB_URI=mongodb://localhost:27017/paramparachain
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
```

### 3. Start MongoDB
```bash
mongod
```

### 4. Start Server
```bash
npm run dev
```

Server will run on `http://localhost:5000`

---

## Testing with cURL

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "NGO"
  }'
```

### Create Product
```bash
curl -X POST http://localhost:5000/api/products/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Organic Coffee",
    "description": "Premium coffee",
    "origin": {"village": "Valley", "state": "Kerala", "country": "India"},
    "manufacturerName": "Coffee Co",
    "basePrice": 100,
    "imageHash": "hash123"
  }'
```
