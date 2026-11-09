/**
 * HTTP Server Entry Point
 * Module: ENSTA WAMD - TD-TP 3 (DzTech Store)
 * 
 * Loads environment variables, establishes MongoDB connection,
 * and starts the Express HTTP server listener.
 */

require('dotenv').config();
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // 1. Establish database connection
    await connectDB();

    // 2. Start HTTP server
    const server = app.listen(PORT, () => {
      console.log('====================================================');
      console.log(` DzTech Store REST API Server`);
      console.log(` Running on: http://localhost:${PORT}`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(` Health Check: http://localhost:${PORT}/api/health`);
      console.log(` Products API: http://localhost:${PORT}/api/products`);
      console.log('====================================================');
    });

    // 3. Graceful shutdown handlers
    const shutdown = async (signal) => {
      console.log(`\n[Server] Received ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        await disconnectDB();
        console.log('[Server] Process terminated cleanly.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    return server;
  } catch (error) {
    console.error('[Server] Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server if called directly
if (require.main === module) {
  startServer();
}

module.exports = {
  startServer
};
