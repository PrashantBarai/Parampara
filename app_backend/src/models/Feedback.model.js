const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  productId: { type: String, required: true, index: true },
  customerHash: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, maxlength: 1000 },
  imageCID: { type: String },
  blockchainTxId: { type: String },
  timestamp: { type: Date, default: Date.now },
});

FeedbackSchema.index({ customerHash: 1 });

FeedbackSchema.statics.getAverageRating = async function (productId) {
  const result = await this.aggregate([
    { $match: { productId } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  return result.length ? { average: result[0].avg, count: result[0].count } : { average: 0, count: 0 };
};

module.exports = mongoose.model('Feedback', FeedbackSchema);
