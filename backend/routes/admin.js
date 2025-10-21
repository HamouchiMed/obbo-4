const express = require('express');
const { query, validationResult } = require('express-validator');
const User = require('../models/User');
const Order = require('../models/Order');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/merchants - list dealers with pagination and search
router.get('/merchants', requireAdmin, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { page = 1, limit = 20, q } = req.query;
    const skip = (page - 1) * limit;

    const filter = { userType: 'dealer' };
    if (q) {
      filter.$or = [
        { 'profile.businessName': { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } }
      ];
    }

    const merchants = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({ success: true, data: { merchants, pagination: { current: parseInt(page), pages: Math.ceil(total / limit), total } } });
  } catch (error) {
    console.error('Admin list merchants error:', error);
    res.status(500).json({ success: false, message: 'Failed to list merchants' });
  }
});

// PUT /api/admin/merchants/:id/verify - set profile.isVerified = true
router.put('/merchants/:id/verify', requireAdmin, async (req, res) => {
  try {
    const merchant = await User.findById(req.params.id);
    if (!merchant || merchant.userType !== 'dealer') return res.status(404).json({ success: false, message: 'Merchant not found' });

    merchant.profile.isVerified = true;
    await merchant.save();

    res.json({ success: true, message: 'Merchant verified', data: { merchant } });
  } catch (error) {
    console.error('Verify merchant error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify merchant' });
  }
});

// PUT /api/admin/merchants/:id/deactivate - deactivate merchant account
router.put('/merchants/:id/deactivate', requireAdmin, async (req, res) => {
  try {
    const merchant = await User.findById(req.params.id);
    if (!merchant || merchant.userType !== 'dealer') return res.status(404).json({ success: false, message: 'Merchant not found' });

    merchant.isActive = false;
    await merchant.save();

    res.json({ success: true, message: 'Merchant deactivated', data: { merchant } });
  } catch (error) {
    console.error('Deactivate merchant error:', error);
    res.status(500).json({ success: false, message: 'Failed to deactivate merchant' });
  }
});

// GET /api/admin/orders - list orders platform-wide
router.get('/orders', requireAdmin, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const orders = await Order.find({})
      .populate('client', 'profile.firstName profile.lastName')
      .populate('dealer', 'profile.businessName')
      .populate('basket', 'name price')
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await Order.countDocuments({});

    res.json({ success: true, data: { orders, pagination: { current: parseInt(page), pages: Math.ceil(total / limit), total } } });
  } catch (error) {
    console.error('Admin list orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to list orders' });
  }
});

module.exports = router;
