const Feedback = require('../models/feedback.model');
const BlockchainService = require('../services/blockchain.service');
const { hashString } = require('../utils/hash.util');

/**
 * @route   POST /api/feedback
 * @desc    Add customer feedback (CustomerOrg - records on blockchain)
 * @access  Public
 */
exports.addFeedback = async (req, res) => {
  try {
    const { productId, customerEmail, rating, comment } = req.body;

    // Validate required fields
    if (!productId || !customerEmail || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid productId, customerEmail, and rating (1-5)'
      });
    }

    // Hash customer email for privacy
    const customerHash = hashString(customerEmail);

    // Save feedback to MongoDB
    const feedback = await Feedback.create({
      productId,
      customerEmail: customerHash,
      rating,
      comment,
      verified: false
    });

    // Record feedback on blockchain (via CustomerOrg)
    try {
      await BlockchainService.addFeedbackOnChain(
        productId,
        customerHash,
        rating,
        comment || ''
      );
      feedback.blockchainStatus = 'recorded';
    } catch (blockchainError) {
      console.error('Blockchain feedback recording failed:', blockchainError.message);
      feedback.blockchainStatus = 'pending';
      feedback.blockchainError = blockchainError.message;
    }

    await feedback.save();

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback: {
        _id: feedback._id,
        productId,
        rating,
        createdAt: feedback.createdAt,
        blockchainStatus: feedback.blockchainStatus
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   GET /api/feedback/:productId
 * @desc    Get all feedback for a product
 * @access  Public
 */
exports.getProductFeedback = async (req, res) => {
  try {
    const { productId } = req.params;

    const feedbackList = await Feedback.find({ productId })
      .select('rating comment createdAt')
      .sort({ createdAt: -1 });

    // Calculate average rating
    const averageRating = feedbackList.length > 0
      ? (feedbackList.reduce((sum, f) => sum + f.rating, 0) / feedbackList.length).toFixed(2)
      : 0;

    res.status(200).json({
      success: true,
      productId,
      totalFeedback: feedbackList.length,
      averageRating: parseFloat(averageRating),
      feedback: feedbackList
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   GET /api/feedback/:productId/summary
 * @desc    Get feedback summary for a product
 * @access  Public
 */
exports.getFeedbackSummary = async (req, res) => {
  try {
    const { productId } = req.params;

    const feedbackList = await Feedback.find({ productId });

    if (feedbackList.length === 0) {
      return res.status(200).json({
        success: true,
        productId,
        totalFeedback: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      });
    }

    // Calculate statistics
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;

    feedbackList.forEach((f) => {
      ratingDistribution[f.rating]++;
      totalRating += f.rating;
    });

    const averageRating = (totalRating / feedbackList.length).toFixed(2);

    res.status(200).json({
      success: true,
      productId,
      totalFeedback: feedbackList.length,
      averageRating: parseFloat(averageRating),
      ratingDistribution,
      blockchainRecorded: feedbackList.filter(f => f.blockchainStatus === 'recorded').length
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   DELETE /api/feedback/:feedbackId
 * @desc    Delete feedback (admin only)
 * @access  Private
 */
exports.deleteFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can delete feedback'
      });
    }

    const feedback = await Feedback.findByIdAndDelete(feedbackId);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
