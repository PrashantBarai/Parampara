const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productId: {
    type: String,
    unique: true,
    required: [true, 'Please provide a product ID']
  },
  name: {
    type: String,
    required: [true, 'Please provide a product name']
  },
  description: {
    type: String,
    required: [true, 'Please provide a product description']
  },
  origin: {
    village: {
      type: String,
      required: [true, 'Please provide village']
    },
    state: {
      type: String,
      required: [true, 'Please provide state']
    },
    country: {
      type: String,
      required: [true, 'Please provide country']
    }
  },
  manufacturerName: {
    type: String,
    required: [true, 'Please provide manufacturer name']
  },
  ngoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide NGO ID']
  },
  basePrice: {
    type: Number,
    required: [true, 'Please provide base price'],
    immutable: true
  },
  currentPrice: {
    type: Number,
    required: [true, 'Please provide current price']
  },
  imageCID: {
    type: String,
    default: null
  },
  imageHash: {
    type: String,
    required: [true, 'Please provide image hash']
  },
  metadataHash: {
    type: String,
    required: [true, 'Please provide metadata hash']
  },
  currentOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide current owner']
  },
  status: {
    type: String,
    enum: ['CREATED', 'IN_TRANSIT', 'DELIVERED', 'SOLD'],
    default: 'CREATED'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', productSchema);
