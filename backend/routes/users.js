const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const Order = require('../models/Order');
const Basket = require('../models/Basket');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', async (req, res) => {
  try {
    res.json({
      success: true,
      data: { user: req.user }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('phone').optional().notEmpty().withMessage('Phone cannot be empty'),
  body('businessName').optional().notEmpty().withMessage('Business name cannot be empty'),
  body('businessType').optional().notEmpty().withMessage('Business type cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const updateData = {};
    const { firstName, lastName, phone, ...otherData } = req.body;

    // Update basic profile fields
    if (firstName) updateData['profile.firstName'] = firstName;
    if (lastName) updateData['profile.lastName'] = lastName;
    if (phone) updateData['profile.phone'] = phone;

    // Update other profile fields
    Object.keys(otherData).forEach(key => {
      if (otherData[key] !== undefined) {
        updateData[`profile.${key}`] = otherData[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

// @route   GET /api/users/orders
// @desc    Get user orders
// @access  Private
router.get('/orders', [
  query('status').optional().isIn([
    'pending',
    'confirmed',
    'preparing',
    'ready_for_pickup',
    'picked_up',
    'completed',
    'cancelled',
    'refunded'
  ]).withMessage('Invalid status'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.user.userType === 'client') {
      query.client = req.user._id;
    } else {
      query.dealer = req.user._id;
    }
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('client', 'profile.firstName profile.lastName profile.phone')
      .populate('dealer', 'profile.businessName profile.phone')
      .populate('basket', 'name price images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    let stats = {};

    if (req.user.userType === 'dealer') {
      // Dealer statistics
      const totalBaskets = await Basket.countDocuments({ dealer: req.user._id });
      const activeBaskets = await Basket.countDocuments({ 
        dealer: req.user._id, 
        status: 'active',
        'availability.isAvailable': true,
        'availability.remainingQuantity': { $gt: 0 }
      });
      const totalOrders = await Order.countDocuments({ dealer: req.user._id });
      const completedOrders = await Order.countDocuments({ 
        dealer: req.user._id, 
        status: 'completed' 
      });
      const totalRevenue = await Order.aggregate([
        { $match: { dealer: req.user._id, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } }
      ]);

      stats = {
        totalBaskets,
        activeBaskets,
        totalOrders,
        completedOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        completionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0
      };
    } else {
      // Client statistics
      const totalOrders = await Order.countDocuments({ client: req.user._id });
      const completedOrders = await Order.countDocuments({ 
        client: req.user._id, 
        status: 'completed' 
      });
      const totalSpent = await Order.aggregate([
        { $match: { client: req.user._id, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } }
      ]);
      const savedMoney = await Order.aggregate([
        { $match: { client: req.user._id, status: 'completed' } },
        { $group: { _id: null, total: { $sum: { $subtract: ['$basket.originalPrice', '$basket.price'] } } } }
      ]);

      stats = {
        totalOrders,
        completedOrders,
        totalSpent: totalSpent[0]?.total || 0,
        savedMoney: savedMoney[0]?.total || 0,
        completionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0
      };
    }

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

// @route   GET /api/users/nearby-dealers
// @desc    Get nearby dealers
// @access  Private
router.get('/nearby-dealers', [
  query('lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  query('lng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  query('radius').optional().isInt({ min: 1, max: 50000 }).withMessage('Radius must be between 1 and 50000 meters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { lat, lng, radius = 10000 } = req.query;
    const coordinates = {
      latitude: parseFloat(lat),
      longitude: parseFloat(lng)
    };

    const dealers = await User.findNearbyDealers(coordinates, parseInt(radius));

    res.json({
      success: true,
      data: { dealers }
    });
  } catch (error) {
    console.error('Get nearby dealers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby dealers'
    });
  }
});

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', async (req, res) => {
  try {
    // Check if user has active orders
    const activeOrders = await Order.countDocuments({
      $or: [
        { client: req.user._id, status: { $in: ['pending', 'confirmed', 'preparing', 'ready_for_pickup'] } },
        { dealer: req.user._id, status: { $in: ['pending', 'confirmed', 'preparing', 'ready_for_pickup'] } }
      ]
    });

    if (activeOrders > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete account with active orders'
      });
    }

    // Deactivate account instead of deleting
    await User.findByIdAndUpdate(req.user._id, { isActive: false });

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account'
    });
  }
});

module.exports = router;

