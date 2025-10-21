/**
 * Simple DB initialization script.
 * Usage:
 * 1. Set MONGODB_URI in environment or create backend/.env from env.example
 * 2. Run: node backend/scripts/init-db.js
 *
 * This script connects, ensures collections exist and syncs indexes for models.
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('MONGODB_URI not set. Copy backend/env.example -> backend/.env and set MONGODB_URI');
  process.exit(1);
}

async function init() {
  try {
    console.log('Connecting to', uri);
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    // Load models so their schemas/indexes are registered
    const User = require('../models/User');
    let Basket, Order;
    try { Basket = require('../models/Basket'); } catch (e) { /* optional */ }
    try { Order = require('../models/Order'); } catch (e) { /* optional */ }

    // Ensure collections and indexes
    const models = [];
    if (mongoose.models && mongoose.models.User) models.push(mongoose.models.User);
    if (mongoose.models && mongoose.models.Basket) models.push(mongoose.models.Basket);
    if (mongoose.models && mongoose.models.Order) models.push(mongoose.models.Order);

    for (const m of models) {
      try {
        console.log(`Creating collection for model: ${m.modelName}`);
        await m.createCollection();
      } catch (err) {
        // collection may already exist
      }
      try {
        console.log(`Syncing indexes for model: ${m.modelName}`);
        await m.syncIndexes();
      } catch (err) {
        console.warn(`Failed to sync indexes for ${m.modelName}:`, err.message || err);
      }
    }

    console.log('DB initialization complete.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Initialization failed:', err);
    try { await mongoose.disconnect(); } catch (e) {}
    process.exit(1);
  }
}

init();
