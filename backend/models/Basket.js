const mongoose = require('mongoose');

const basketSchema = new mongoose.Schema({
  dealer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Dealer is required']
  },
  name: {
    type: String,
    required: [true, 'Basket name is required'],
    trim: true,
    maxlength: [100, 'Basket name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  discount: {
    type: Number,
    min: [0],
    max: [100],
    default: 0
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Fruits & Légumes',
      'Boulangerie',
      'Viande & Poisson',
      'Produits Laitiers',
      'Épicerie',
      'Surgelés',
      'Boissons',
      'Autres'
    ]
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  collectionInfo: {
    date: {
      type: Date,
      required: [true, 'Collection date is required']
    },
    time: {
      type: String,
      required: [true, 'Collection time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format']
    },
    address: {
      street: String,
      city: String,
      postalCode: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    instructions: {
      type: String,
      maxlength: [300, 'Collection instructions cannot exceed 300 characters']
    }
  },
  availability: {
    totalQuantity: {
      type: Number,
      required: [true, 'Total quantity is required'],
      min: [1, 'Quantity must be at least 1']
    },
    remainingQuantity: {
      type: Number,
      required: [true, 'Remaining quantity is required'],
      min: [0, 'Remaining quantity cannot be negative']
    },
    isAvailable: {
      type: Boolean,
      default: true
    }
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'sold_out', 'expired', 'cancelled'],
    default: 'draft'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  nutritionalInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number,
    sugar: Number
  },
  allergens: [{
    type: String,
    enum: [
      'gluten',
      'dairy',
      'nuts',
      'eggs',
      'soy',
      'fish',
      'shellfish',
      'sesame',
      'sulfites'
    ]
  }],
  dietaryInfo: {
    isVegetarian: {
      type: Boolean,
      default: false
    },
    isVegan: {
      type: Boolean,
      default: false
    },
    isHalal: {
      type: Boolean,
      default: false
    },
    isKosher: {
      type: Boolean,
      default: false
    },
    isOrganic: {
      type: Boolean,
      default: false
    }
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  views: {
    type: Number,
    default: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiration date is required']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
basketSchema.index({ dealer: 1 });
basketSchema.index({ status: 1 });
basketSchema.index({ category: 1 });
basketSchema.index({ 'collectionInfo.date': 1 });
basketSchema.index({ 'collectionInfo.address.coordinates': '2dsphere' });
basketSchema.index({ createdAt: -1 });
basketSchema.index({ price: 1 });
basketSchema.index({ 'ratings.average': -1 });
basketSchema.index({ tags: 1 });

// Virtual for discount percentage
basketSchema.virtual('discountPercentage').get(function() {
  if (this.originalPrice && this.originalPrice > 0) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

// Virtual for is expired
basketSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiresAt;
});

// Virtual for is available for collection
basketSchema.virtual('isAvailableForCollection').get(function() {
  const now = new Date();
  const collectionDateTime = new Date(`${this.collectionInfo.date.toISOString().split('T')[0]}T${this.collectionInfo.time}`);
  return this.status === 'active' && 
         this.availability.isAvailable && 
         this.availability.remainingQuantity > 0 &&
         now < collectionDateTime &&
         !this.isExpired;
});

// Pre-save middleware
basketSchema.pre('save', function(next) {
  // Ensure remaining quantity doesn't exceed total quantity
  if (this.availability.remainingQuantity > this.availability.totalQuantity) {
    this.availability.remainingQuantity = this.availability.totalQuantity;
  }
  
  // Update availability status
  if (this.availability.remainingQuantity === 0) {
    this.availability.isAvailable = false;
    this.status = 'sold_out';
  }
  
  // Set primary image
  if (this.images.length > 0 && !this.images.some(img => img.isPrimary)) {
    this.images[0].isPrimary = true;
  }
  
  next();
});

// Static method to find nearby baskets
basketSchema.statics.findNearby = function(coordinates, maxDistance = 10000, filters = {}) {
  const query = {
    status: 'active',
    'availability.isAvailable': true,
    'availability.remainingQuantity': { $gt: 0 },
    'collectionInfo.address.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [coordinates.longitude, coordinates.latitude]
        },
        $maxDistance: maxDistance
      }
    },
    expiresAt: { $gt: new Date() },
    ...filters
  };
  
  return this.find(query)
    .populate('dealer', 'profile.businessName profile.businessType profile.businessLogo')
    .sort({ createdAt: -1 });
};

// Static method to find by category
basketSchema.statics.findByCategory = function(category, limit = 20) {
  return this.find({
    category,
    status: 'active',
    'availability.isAvailable': true,
    'availability.remainingQuantity': { $gt: 0 },
    expiresAt: { $gt: new Date() }
  })
  .populate('dealer', 'profile.businessName profile.businessType')
  .sort({ createdAt: -1 })
  .limit(limit);
};

// Instance method to increment views
basketSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Instance method to update rating
basketSchema.methods.updateRating = function(newRating) {
  const totalRating = (this.ratings.average * this.ratings.count) + newRating;
  this.ratings.count += 1;
  this.ratings.average = totalRating / this.ratings.count;
  return this.save();
};

module.exports = mongoose.model('Basket', basketSchema);

