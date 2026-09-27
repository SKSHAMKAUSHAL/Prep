const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const logger = require("../utils/logger");
const { AppError } = require("./errorHandler");
const cacheService = require("../services/cacheService");
const { TTL } = require("../services/cacheService");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AppError("Authentication required. Please provide a Bearer token.", 401));
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return next(new AppError("Authentication token is missing.", 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user = null;

    if (mongoose.connection.readyState === 1) {
      // Production Cache-Aside: check Redis first before hitting MongoDB
      user = await cacheService.getOrSet(
        `user:profile:${decoded.id}`,
        async () => {
          return User.findById(decoded.id).select("-password").lean();
        },
        TTL.USER_PROFILE
      );
    } else if (process.env.NODE_ENV === "test") {
      // Offline/Test environment fallback when DB is disconnected
      user = { _id: decoded.id, id: decoded.id, role: "user" };
    }

    if (!user) {
      return next(new AppError("User belonging to this token no longer exists.", 401));
    }

    req.user = user;
    next();
  } catch (error) {
    logger.warn({ error: error.message, reqId: req.id }, "Authentication verification failed");
    next(error);
  }
};

// Dual-export protect function directly and as { protect } for backwards compatibility
module.exports = Object.assign(protect, { protect, authMiddleware: protect });
