// Vercel serverless function wrapper
const serverless = require('serverless-http');
const { app, connectDB } = require('../backend/app');

// Ensure DB connection before handling requests
module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('DB connection error in serverless wrapper:', err);
    return res.status(500).json({ success: false, message: 'Database connection error' });
  }

  return serverless(app)(req, res);
};
