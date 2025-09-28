const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  userType: {
    type: String,
    enum: ['client', 'dealer'],
    required: [true, 'User type is required']
  },
  profile: {
    // Common fields
    firstName: {
      type: String,
      trim: true
    },
    lastName: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    avatar: {
      type: String,
      default: null
    },
    
    // Dealer specific fields
    businessName: {
      type: String,
      trim: true
    },
    businessType: {
      type: String,
      trim: true
    },
    address: {
      street: String,
      city: String,
      postalCode: String,
      country: {
        type: String,
        default: 'Morocco'
      },
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    businessDescription: {
      type: String,
      maxlength: [500, 'Business description cannot exceed 500 characters']
    },
    businessLogo: {
      type: String,
      default: null
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      }
    },
    language: {
      type: String,
      default: 'fr',
      enum: ['fr', 'en', 'ar']
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ userType: 1 });
userSchema.index({ 'profile.businessName': 1 });
userSchema.index({ 'profile.address.coordinates': '2dsphere' });

// Virtual for full name
userSchema.virtual('profile.fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`.trim();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Static method to find nearby dealers
userSchema.statics.findNearbyDealers = function(coordinates, maxDistance = 10000) {
  return this.find({
    userType: 'dealer',
    isActive: true,
    'profile.address.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [coordinates.longitude, coordinates.latitude]
        },
        $maxDistance: maxDistance
      }
    }
  });
};

module.exports = mongoose.model('User', userSchema);

