/**
 * Database Connection Configuration
 * Module: ENSTA WAMD - TD-TP 3
 * 
 * Connects Mongoose to MongoDB (local Community Server or MongoDB Atlas).
 * If a local MongoDB daemon is not running during development or automated tests,
 * an in-memory MongoDB instance is dynamically started as a zero-config fallback.
 */

const mongoose = require('mongoose');

let mongoMemoryServer = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dztech_ecommerce';

  try {
    // Attempt standard connection to specified MONGODB_URI
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000 // Fast fail if local daemon is not running
    });
    console.log(`[MongoDB] Connected successfully to: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    // In dev or test environments, if external connection failed, use MongoMemoryServer
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[MongoDB] Could not connect to external MongoDB at ${uri} (${err.message}).`);
      console.log('[MongoDB] Starting embedded in-memory MongoDB instance for development/testing...');

      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongoMemoryServer = await MongoMemoryServer.create();
        const memoryUri = mongoMemoryServer.getUri();

        const conn = await mongoose.connect(memoryUri);
        console.log(`[MongoDB] Embedded in-memory database ready at: ${memoryUri}`);
        return conn;
      } catch (memErr) {
        console.error('[MongoDB] Failed to start in-memory MongoDB instance:', memErr.message);
        throw memErr;
      }
    }

    console.error(`[MongoDB] Fatal connection error: ${err.message}`);
    throw err;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
      mongoMemoryServer = null;
    }
    console.log('[MongoDB] Database connection closed.');
  } catch (err) {
    console.error('[MongoDB] Error during disconnect:', err.message);
  }
};

module.exports = {
  connectDB,
  disconnectDB
};
