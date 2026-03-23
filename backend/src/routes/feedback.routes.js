const express = require('express');
const feedbackController = require('../controllers/feedback.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

// Public routes
router.post('/', feedbackController.addFeedback);
router.get('/:productId', feedbackController.getProductFeedback);
router.get('/:productId/summary', feedbackController.getFeedbackSummary);

// Admin routes
router.delete('/:feedbackId', protect, feedbackController.deleteFeedback);

module.exports = router;
