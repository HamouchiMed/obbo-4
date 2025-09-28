const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Basket = require('../models/Basket');
const Order = require('../models/Order');
const { requireDealer } = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for image upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// @route   GET /api/baskets
// @desc    Get dealer's baskets
// @access  Private (Dealer)
router.get('/', requireDealer, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category } = req.query;
    const skip = (page - 1) * limit;

    const query = { dealer: req.user._id };
    if (status) query.status = status;
    if (category) query.category = category;

    const baskets = await Basket.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Basket.countDocuments(query);

    res.json({
      success: true,
      data: {
        baskets,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get baskets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch baskets'
    });
  }
});

// @route   GET /api/baskets/:id
// @desc    Get single basket
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const basket = await Basket.findById(req.params.id)
      .populate('dealer', 'profile.businessName profile.businessType profile.businessLogo');

    if (!basket) {
      return res.status(404).json({
        success: false,
        message: 'Basket not found'
      });
    }

    // Check if user can access this basket
    if (req.user.userType === 'dealer' && basket.dealer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Increment views for clients
    if (req.user.userType === 'client') {
      await basket.incrementViews();
    }

    res.json({
      success: true,
      data: { basket }
    });
  } catch (error) {
    console.error('Get basket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch basket'
    });
  }
});

// @route   POST /api/baskets
// @desc    Create new basket
// @access  Private (Dealer)
router.post('/', requireDealer, upload.array('images', 5), [
  body('name').notEmpty().withMessage('Basket name is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('category').isIn([
    'Fruits & Légumes',
    'Boulangerie',
    'Viande & Poisson',
    'Produits Laitiers',
    'Épicerie',
    'Surgelés',
    'Boissons',
    'Autres'
  ]).withMessage('Invalid category'),
  body('collectionInfo.date').isISO8601().withMessage('Collection date is required'),
  body('collectionInfo.time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format'),
  body('availability.totalQuantity').isInt({ min: 1 }).withMessage('Total quantity must be at least 1')
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

    const basketData = req.body;
    basketData.dealer = req.user._id;

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      const imagePromises = req.files.map(file => 
        new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { resource_type: 'image', folder: 'obbo/baskets' },
            (error, result) => {
              if (error) reject(error);
              else resolve({
                url: result.secure_url,
                publicId: result.public_id,
                isPrimary: false
              });
            }
          ).end(file.buffer);
        })
      );

      try {
        const images = await Promise.all(imagePromises);
        images[0].isPrimary = true; // Set first image as primary
        basketData.images = images;
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload images'
        });
      }
    }

    // Set remaining quantity equal to total quantity
    basketData.availability = {
      ...basketData.availability,
      remainingQuantity: basketData.availability.totalQuantity
    };

    // Set expiration date (default 7 days from now)
    if (!basketData.expiresAt) {
      basketData.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const basket = new Basket(basketData);
    await basket.save();

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('basket_created', {
      basket: await basket.populate('dealer', 'profile.businessName profile.businessType')
    });

    res.status(201).json({
      success: true,
      message: 'Basket created successfully',
      data: { basket }
    });
  } catch (error) {
    console.error('Create basket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create basket',
      error: error.message
    });
  }
});

// @route   PUT /api/baskets/:id
// @desc    Update basket
// @access  Private (Dealer)
router.put('/:id', requireDealer, upload.array('images', 5), async (req, res) => {
  try {
    const basket = await Basket.findById(req.params.id);
    
    if (!basket) {
      return res.status(404).json({
        success: false,
        message: 'Basket not found'
      });
    }

    // Check if dealer owns this basket
    if (basket.dealer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const updateData = req.body;

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      const imagePromises = req.files.map(file => 
        new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { resource_type: 'image', folder: 'obbo/baskets' },
            (error, result) => {
              if (error) reject(error);
              else resolve({
                url: result.secure_url,
                publicId: result.public_id,
                isPrimary: false
              });
            }
          ).end(file.buffer);
        })
      );

      try {
        const newImages = await Promise.all(imagePromises);
        updateData.images = [...basket.images, ...newImages];
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload images'
        });
      }
    }

    // Update remaining quantity if total quantity changed
    if (updateData.availability && updateData.availability.totalQuantity) {
      const quantityDiff = updateData.availability.totalQuantity - basket.availability.totalQuantity;
      updateData.availability.remainingQuantity = basket.availability.remainingQuantity + quantityDiff;
    }

    const updatedBasket = await Basket.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('basket_updated', {
      basket: await updatedBasket.populate('dealer', 'profile.businessName profile.businessType')
    });

    res.json({
      success: true,
      message: 'Basket updated successfully',
      data: { basket: updatedBasket }
    });
  } catch (error) {
    console.error('Update basket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update basket',
      error: error.message
    });
  }
});

// @route   DELETE /api/baskets/:id
// @desc    Delete basket
// @access  Private (Dealer)
router.delete('/:id', requireDealer, async (req, res) => {
  try {
    const basket = await Basket.findById(req.params.id);
    
    if (!basket) {
      return res.status(404).json({
        success: false,
        message: 'Basket not found'
      });
    }

    // Check if dealer owns this basket
    if (basket.dealer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if basket has active orders
    const activeOrders = await Order.countDocuments({
      basket: basket._id,
      status: { $in: ['pending', 'confirmed', 'preparing', 'ready_for_pickup'] }
    });

    if (activeOrders > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete basket with active orders'
      });
    }

    // Delete images from Cloudinary
    if (basket.images && basket.images.length > 0) {
      const deletePromises = basket.images.map(image => 
        cloudinary.uploader.destroy(image.publicId)
      );
      await Promise.all(deletePromises);
    }

    await Basket.findByIdAndDelete(req.params.id);

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('basket_deleted', { basketId: req.params.id });

    res.json({
      success: true,
      message: 'Basket deleted successfully'
    });
  } catch (error) {
    console.error('Delete basket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete basket',
      error: error.message
    });
  }
});

// @route   PUT /api/baskets/:id/status
// @desc    Update basket status
// @access  Private (Dealer)
router.put('/:id/status', requireDealer, [
  body('status').isIn(['draft', 'active', 'paused', 'sold_out', 'expired', 'cancelled'])
    .withMessage('Invalid status')
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

    const basket = await Basket.findById(req.params.id);
    
    if (!basket) {
      return res.status(404).json({
        success: false,
        message: 'Basket not found'
      });
    }

    // Check if dealer owns this basket
    if (basket.dealer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    basket.status = req.body.status;
    await basket.save();

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('basket_status_updated', {
      basketId: basket._id,
      status: basket.status
    });

    res.json({
      success: true,
      message: 'Basket status updated successfully',
      data: { basket }
    });
  } catch (error) {
    console.error('Update basket status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update basket status'
    });
  }
});

// @route   GET /api/baskets/:id/orders
// @desc    Get basket orders
// @access  Private (Dealer)
router.get('/:id/orders', requireDealer, async (req, res) => {
  try {
    const basket = await Basket.findById(req.params.id);
    
    if (!basket) {
      return res.status(404).json({
        success: false,
        message: 'Basket not found'
      });
    }

    // Check if dealer owns this basket
    if (basket.dealer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const orders = await Order.find({ basket: basket._id })
      .populate('client', 'profile.firstName profile.lastName profile.phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { orders }
    });
  } catch (error) {
    console.error('Get basket orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch basket orders'
    });
  }
});

module.exports = router;

