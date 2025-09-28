const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Client is required']
  },
  dealer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Dealer is required']
  },
  basket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Basket',
    required: [true, 'Basket is required']
  },
  items: [{
    basketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Basket',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    image: String
  }],
  pricing: {
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    tax: {
      type: Number,
      default: 0,
      min: 0
    },
    serviceFee: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'MAD',
      enum: ['MAD', 'EUR', 'USD']
    }
  },
  status: {
    type: String,
    enum: [
      'pending',
      'confirmed',
      'preparing',
      'ready_for_pickup',
      'picked_up',
      'completed',
      'cancelled',
      'refunded'
    ],
    default: 'pending'
  },
  collectionInfo: {
    scheduledDate: {
      type: Date,
      required: true
    },
    scheduledTime: {
      type: String,
      required: true
    },
    actualPickupTime: {
      type: Date,
      default: null
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
    instructions: String
  },
  payment: {
    method: {
      type: String,
      enum: ['cash', 'card', 'mobile_payment', 'bank_transfer'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    paidAt: Date,
    refundedAt: Date
  },
  communication: {
    clientNotes: String,
    dealerNotes: String,
    messages: [{
      sender: {
        type: String,
        enum: ['client', 'dealer', 'system'],
        required: true
      },
      message: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  },
  rating: {
    clientRating: {
      value: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      ratedAt: Date
    },
    dealerRating: {
      value: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      ratedAt: Date
    }
  },
  cancellation: {
    reason: String,
    cancelledBy: {
      type: String,
      enum: ['client', 'dealer', 'system']
    },
    cancelledAt: Date,
    refundAmount: Number
  },
  metadata: {
    source: {
      type: String,
      default: 'mobile_app',
      enum: ['mobile_app', 'web_app', 'api']
    },
    userAgent: String,
    ipAddress: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ client: 1 });
orderSchema.index({ dealer: 1 });
orderSchema.index({ basket: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'collectionInfo.scheduledDate': 1 });
orderSchema.index({ createdAt: -1 });

// Virtual for order duration
orderSchema.virtual('duration').get(function() {
  if (this.status === 'completed' && this.collectionInfo.actualPickupTime) {
    return this.collectionInfo.actualPickupTime - this.createdAt;
  }
  return null;
});

// Virtual for is overdue
orderSchema.virtual('isOverdue').get(function() {
  if (this.status === 'ready_for_pickup' || this.status === 'preparing') {
    const scheduledDateTime = new Date(`${this.collectionInfo.scheduledDate.toISOString().split('T')[0]}T${this.collectionInfo.scheduledTime}`);
    return new Date() > scheduledDateTime;
  }
  return false;
});

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const count = await this.constructor.countDocuments();
    this.orderNumber = `OB${Date.now().toString().slice(-8)}${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

// Static method to find orders by status
orderSchema.statics.findByStatus = function(status, userId, userType) {
  const query = { status };
  
  if (userType === 'client') {
    query.client = userId;
  } else if (userType === 'dealer') {
    query.dealer = userId;
  }
  
  return this.find(query)
    .populate('client', 'profile.firstName profile.lastName profile.phone')
    .populate('dealer', 'profile.businessName profile.phone')
    .populate('basket', 'name price images')
    .sort({ createdAt: -1 });
};

// Static method to find orders by date range
orderSchema.statics.findByDateRange = function(startDate, endDate, userId, userType) {
  const query = {
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  if (userType === 'client') {
    query.client = userId;
  } else if (userType === 'dealer') {
    query.dealer = userId;
  }
  
  return this.find(query)
    .populate('client', 'profile.firstName profile.lastName')
    .populate('dealer', 'profile.businessName')
    .populate('basket', 'name price')
    .sort({ createdAt: -1 });
};

// Instance method to add message
orderSchema.methods.addMessage = function(sender, message) {
  this.communication.messages.push({
    sender,
    message,
    timestamp: new Date()
  });
  return this.save();
};

// Instance method to update status
orderSchema.methods.updateStatus = function(newStatus, notes = '') {
  this.status = newStatus;
  
  if (notes) {
    if (this.communication.dealerNotes) {
      this.communication.dealerNotes += `\n${new Date().toISOString()}: ${notes}`;
    } else {
      this.communication.dealerNotes = `${new Date().toISOString()}: ${notes}`;
    }
  }
  
  return this.save();
};

// Instance method to rate order
orderSchema.methods.rateOrder = function(rating, comment, userType) {
  if (userType === 'client') {
    this.rating.clientRating = {
      value: rating,
      comment,
      ratedAt: new Date()
    };
  } else if (userType === 'dealer') {
    this.rating.dealerRating = {
      value: rating,
      comment,
      ratedAt: new Date()
    };
  }
  
  return this.save();
};

module.exports = mongoose.model('Order', orderSchema);

