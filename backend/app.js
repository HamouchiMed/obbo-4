const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Routes
const authRoutes = require('./routes/auth');
const basketRoutes = require('./routes/baskets');
const userRoutes = require('./routes/users');
const offerRoutes = require('./routes/offers');
const adminRoutes = require('./routes/admin');

// Middleware
const errorHandler = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/baskets', authenticateToken, basketRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/offers', offerRoutes);
// Admin routes (require authentication then admin check inside routes)
app.use('/api/admin', authenticateToken, adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// Error handling + 404
app.use(errorHandler);
app.use('*', (req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Exported helpers
const mongoose = require('mongoose');

/**
 * Connect to MongoDB with basic caching so serverless functions reuse connection across invocations.
 */
const connectDB = async () => {
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/obbo';
  // Use mongoose.connect which returns a promise
  const conn = await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  console.log('✅ Connected to MongoDB');
  return conn;
};

module.exports = { app, connectDB };
