const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: [true, 'Please provide product ID']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  rating: {
    type: Number,
    required: [true, 'Please provide a rating'],
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    default: null
  },
  userHash: {
    type: String,
    required: [true, 'Please provide user hash']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Feedback', feedbackSchema);
