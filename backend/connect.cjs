/**
 * CommonJS MongoDB connection helper (serverless-friendly)
 * Usage:
 *   const { connect, disconnect, mongoose } = require('./connect.cjs');
 *   await connect();
 *
 * This caches the connection on the global object so repeated imports
 * in a serverless environment reuse the same connection instead of
 * creating new connections on every invocation.
 */
const mongoose = require('mongoose');
const path = require('path');
// Load env from backend/.env when running locally
try {
  require('dotenv').config({ path: path.join(__dirname, '.env') });
} catch (e) {
  // ignore if dotenv isn't available or file missing
}

// Resolve URI: prefer ATLAS_uri (explicit), then MONGODB_URI. Support simple ${VAR} placeholders in .env
let uriRaw = process.env.ATLAS_uri || process.env.MONGODB_URI || '';

// If the value is in the form ${SOME_VAR}, attempt to resolve it from process.env
const placeholderMatch = typeof uriRaw === 'string' ? uriRaw.match(/^\$\{(.+)\}$/) : null;
if (placeholderMatch) {
  const ref = placeholderMatch[1];
  uriRaw = process.env[ref] || uriRaw;
}

const uri = uriRaw || undefined;

if (!uri) {
  // Don't throw immediately; allow caller to handle if they want.
  // But log so it's obvious when running locally without config.
  // console.warn('MONGODB_URI / ATLAS_uri is not set in environment');
}

// Global cached connection across module reloads
const globalAny = global;
if (!globalAny.__obbo_mongoose) {
  globalAny.__obbo_mongoose = { conn: null, promise: null };
}

const cached = globalAny.__obbo_mongoose;

async function connect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    if (!uri) {
      throw new Error('MONGODB_URI or ATLAS_uri must be set in environment');
    }

    cached.promise = mongoose
      .connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then((m) => {
        cached.conn = m;
        return cached.conn;
      })
      .catch((err) => {
        cached.promise = null;
        throw err;
      });
  }

  return cached.promise;
}

async function disconnect() {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
  }
}

module.exports = { connect, disconnect, mongoose };

// If run directly, attempt a connection and log the result
if (require.main === module) {
  (async () => {
    try {
      console.log('Attempting to connect to MongoDB...');
      await connect();
      console.log('✅ Connected to MongoDB');
      // Keep process alive briefly so logs can be read
      await new Promise((r) => setTimeout(r, 500));
      await disconnect();
      console.log('Disconnected.');
      process.exit(0);
    } catch (err) {
      console.error('Connection failed:', err && err.message ? err.message : err);
      process.exit(1);
    }
  })();
}
