const mongoose = require("mongoose");
const logger = require("../utils/logger");

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      logger.error("MONGO_URI environment variable is missing.");
      throw new Error("MONGO_URI is not defined");
    }

    mongoose.connection.on("connected", () => {
      logger.info("MongoDB connection established successfully");
    });

    mongoose.connection.on("error", (err) => {
      logger.error({ err: err.message }, "MongoDB connection error occurred");
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB connection disconnected");
    });

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
  } catch (err) {
    logger.error({ err: err.message, stack: err.stack }, "Failed to connect to MongoDB");
    // Don't crash immediately in test environments, but fail in production if DB is required
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
};

module.exports = connectDB;