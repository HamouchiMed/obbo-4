const express = require('express');
const { query, validationResult } = require('express-validator');
const Basket = require('../models/Basket');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/offers
// @desc    Get nearby offers/baskets
// @access  Public
router.get('/', [
  query('lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  query('lng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  query('radius').optional().isInt({ min: 1, max: 50000 }).withMessage('Radius must be between 1 and 50000 meters'),
  query('category').optional().isIn([
    'Fruits & Légumes',
    'Boulangerie',
    'Viande & Poisson',
    'Produits Laitiers',
    'Épicerie',
    'Surgelés',
    'Boissons',
    'Autres'
  ]).withMessage('Invalid category'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be positive'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be positive'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], optionalAuth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      lat,
      lng,
      radius = 10000,
      category,
      minPrice,
      maxPrice,
      limit = 20,
      sortBy = 'distance'
    } = req.query;

    const coordinates = {
      latitude: parseFloat(lat),
      longitude: parseFloat(lng)
    };

    // Build filters
    const filters = {};
    if (category) filters.category = category;
    if (minPrice || maxPrice) {
      filters.price = {};
      if (minPrice) filters.price.$gte = parseFloat(minPrice);
      if (maxPrice) filters.price.$lte = parseFloat(maxPrice);
    }

    // Find nearby baskets
    const baskets = await Basket.findNearby(coordinates, parseInt(radius), filters)
      .limit(parseInt(limit));

    // Calculate distances and sort
    const basketsWithDistance = baskets.map(basket => {
      const distance = calculateDistance(
        coordinates.latitude,
        coordinates.longitude,
        basket.collectionInfo.address.coordinates.latitude,
        basket.collectionInfo.address.coordinates.longitude
      );
      
      return {
        ...basket.toObject(),
        distance: Math.round(distance * 100) / 100 // Round to 2 decimal places
      };
    });

    // Sort by specified criteria
    let sortedBaskets = basketsWithDistance;
    switch (sortBy) {
      case 'distance':
        sortedBaskets.sort((a, b) => a.distance - b.distance);
        break;
      case 'price':
        sortedBaskets.sort((a, b) => a.price - b.price);
        break;
      case 'rating':
        sortedBaskets.sort((a, b) => b.ratings.average - a.ratings.average);
        break;
      case 'newest':
        sortedBaskets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default:
        sortedBaskets.sort((a, b) => a.distance - b.distance);
    }

    res.json({
      success: true,
      data: {
        offers: sortedBaskets,
        count: sortedBaskets.length,
        location: coordinates,
        radius: parseInt(radius)
      }
    });
  } catch (error) {
    console.error('Get offers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch offers'
    });
  }
});

// @route   GET /api/offers/categories
// @desc    Get available categories
// @access  Public
router.get('/categories', (req, res) => {
  const categories = [
    'Fruits & Légumes',
    'Boulangerie',
    'Viande & Poisson',
    'Produits Laitiers',
    'Épicerie',
    'Surgelés',
    'Boissons',
    'Autres'
  ];

  res.json({
    success: true,
    data: { categories }
  });
});

// @route   GET /api/offers/featured
// @desc    Get featured offers
// @access  Public
router.get('/featured', optionalAuth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const featuredBaskets = await Basket.find({
      isFeatured: true,
      status: 'active',
      'availability.isAvailable': true,
      'availability.remainingQuantity': { $gt: 0 },
      expiresAt: { $gt: new Date() }
    })
    .populate('dealer', 'profile.businessName profile.businessType profile.businessLogo')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

    res.json({
      success: true,
      data: { offers: featuredBaskets }
    });
  } catch (error) {
    console.error('Get featured offers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured offers'
    });
  }
});

// @route   GET /api/offers/search
// @desc    Search offers
// @access  Public
router.get('/search', [
  query('q').notEmpty().withMessage('Search query is required'),
  query('lat').optional().isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  query('lng').optional().isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  query('radius').optional().isInt({ min: 1, max: 50000 }).withMessage('Radius must be between 1 and 50000 meters')
], optionalAuth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { q, lat, lng, radius = 10000, limit = 20 } = req.query;

    // Build search query
    const searchQuery = {
      status: 'active',
      'availability.isAvailable': true,
      'availability.remainingQuantity': { $gt: 0 },
      expiresAt: { $gt: new Date() },
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } },
        { category: { $regex: q, $options: 'i' } }
      ]
    };

    // Add location filter if coordinates provided
    if (lat && lng) {
      const coordinates = {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng)
      };

      searchQuery['collectionInfo.address.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [coordinates.longitude, coordinates.latitude]
          },
          $maxDistance: parseInt(radius)
        }
      };
    }

    const baskets = await Basket.find(searchQuery)
      .populate('dealer', 'profile.businessName profile.businessType profile.businessLogo')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Calculate distances if coordinates provided
    let results = baskets;
    if (lat && lng) {
      const coordinates = {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng)
      };

      results = baskets.map(basket => {
        const distance = calculateDistance(
          coordinates.latitude,
          coordinates.longitude,
          basket.collectionInfo.address.coordinates.latitude,
          basket.collectionInfo.address.coordinates.longitude
        );
        
        return {
          ...basket.toObject(),
          distance: Math.round(distance * 100) / 100
        };
      });

      // Sort by distance
      results.sort((a, b) => a.distance - b.distance);
    }

    res.json({
      success: true,
      data: {
        offers: results,
        count: results.length,
        query: q
      }
    });
  } catch (error) {
    console.error('Search offers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search offers'
    });
  }
});

// @route   GET /api/offers/:id
// @desc    Get single offer details
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const basket = await Basket.findById(req.params.id)
      .populate('dealer', 'profile.businessName profile.businessType profile.businessLogo profile.address');

    if (!basket) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    // Check if offer is available
    if (basket.status !== 'active' || !basket.availability.isAvailable || basket.availability.remainingQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Offer is not available'
      });
    }

    // Increment views
    await basket.incrementViews();

    res.json({
      success: true,
      data: { offer: basket }
    });
  } catch (error) {
    console.error('Get offer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch offer'
    });
  }
});

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

module.exports = router;

