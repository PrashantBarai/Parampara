const Order = require('../models/order.model');
const Product = require('../models/product.model');
const User = require('../models/user.model');

/**
 * @route   POST /api/orders/create
 * @desc    Create a new order
 * @access  Private
 */
exports.createOrder = async (req, res) => {
  try {
    const { productId, sellerId } = req.body;
    const buyerId = req.user.id;

    // Validate required fields
    if (!productId || !sellerId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide productId and sellerId'
      });
    }

    // Get product details
    const product = await Product.findOne({ productId });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if product is already sold
    if (product.status === 'SOLD') {
      return res.status(400).json({
        success: false,
        message: 'Product is already sold'
      });
    }

    // Verify seller is current owner
    if (product.currentOwner.toString() !== sellerId) {
      return res.status(400).json({
        success: false,
        message: 'Seller is not the current owner of this product'
      });
    }

    // Get lifecycle to calculate price breakdown
    const Lifecycle = require('../models/lifecycle.model');
    const lifecycleEntries = await Lifecycle.find({ productId })
      .sort({ timestamp: 1 });

    // Calculate margins
    let distributorMargin = 0;
    let retailerMargin = 0;

    for (const entry of lifecycleEntries) {
      if (entry.role === 'DISTRIBUTOR') {
        distributorMargin += entry.marginAdded;
      } else if (entry.role === 'RETAILER') {
        retailerMargin += entry.marginAdded;
      }
    }

    // Create order
    const order = await Order.create({
      productId,
      buyerId,
      sellerId,
      finalPrice: product.currentPrice,
      priceBreakdown: {
        basePrice: product.basePrice,
        distributorMargin,
        retailerMargin
      },
      status: 'PENDING'
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   GET /api/orders/:orderId
 * @desc    Get order by ID
 * @access  Private
 */
exports.getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('buyerId', 'name email role organizationName')
      .populate('sellerId', 'name email role organizationName');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization
    if (order.buyerId._id.toString() !== req.user.id && order.sellerId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   GET /api/orders/user/my-orders
 * @desc    Get current user's orders
 * @access  Private
 */
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.find({
      $or: [
        { buyerId: userId },
        { sellerId: userId }
      ]
    })
    .populate('buyerId', 'name email role organizationName')
    .populate('sellerId', 'name email role organizationName')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   PUT /api/orders/:orderId/status
 * @desc    Update order status
 * @access  Private
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status provided'
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization - only seller can update status
    if (order.sellerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }

    order.status = status;

    // If order is completed, mark product as sold
    if (status === 'COMPLETED') {
      await Product.findOneAndUpdate(
        { productId: order.productId },
        { status: 'SOLD' }
      );
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order status updated',
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   GET /api/orders
 * @desc    Get all orders (Admin only)
 * @access  Private
 */
exports.getAllOrders = async (req, res) => {
  try {
    const filters = {};

    if (req.query.status) filters.status = req.query.status;
    if (req.query.buyerId) filters.buyerId = req.query.buyerId;
    if (req.query.sellerId) filters.sellerId = req.query.sellerId;

    const orders = await Order.find(filters)
      .populate('buyerId', 'name email role organizationName')
      .populate('sellerId', 'name email role organizationName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
