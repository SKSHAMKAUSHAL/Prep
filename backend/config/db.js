const mongoose = require("mongoose");
const logger = require("../utils/logger");

let isConnecting = false;

// Attach event listeners once at module load
mongoose.connection.on("connected", () => {
  logger.info("MongoDB connection established successfully");
});

mongoose.connection.on("error", (err) => {
  logger.error({ err: err.message }, "MongoDB connection error occurred");
});

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB connection disconnected. Scheduling reconnection...");
  if (process.env.NODE_ENV !== "test") {
    setTimeout(() => {
      connectDB().catch((err) => {
        logger.error({ err: err.message }, "Error during MongoDB reconnection attempt");
      });
    }, 5000);
  }
});

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    logger.error("MONGO_URI environment variable is missing.");
    throw new Error("MONGO_URI is not defined");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (isConnecting) {
    return;
  }

  isConnecting = true;

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });
  } catch (err) {
    logger.error({ err: err.message, stack: err.stack }, "Failed to connect to MongoDB");
    // Don't crash immediately in test environments, but fail in production if DB is required
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  } finally {
    isConnecting = false;
  }
};

module.exports = connectDB;