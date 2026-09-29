const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { getRedisClient, isRedisConnected } = require("../config/redis");
const logger = require("../utils/logger");

/**
 * Standard error response formatter for rate limits
 */
const rateLimitHandler = (message) => (req, res) => {
  const retryAfter = res.getHeader("Retry-After") || 60;
  res.status(429).json({
    success: false,
    status: "fail",
    message: message || "Too many requests. Please slow down and try again later.",
    retryAfterSeconds: Number(retryAfter),
    reqId: req.id,
  });
};

/**
 * Production-grade resilient store that uses RedisStore when Redis is active,
 * and gracefully falls back to MemoryStore when Redis is offline/in test mode.
 */
class ResilientRateLimitStore {
  constructor(prefix) {
    this.prefix = prefix;
    this.memoryStore = new rateLimit.MemoryStore();
    this.redisStore = null;
    this.options = null;
  }

  init(options) {
    this.options = options;
    this.memoryStore.init(options);
  }

  _getRedisStore() {
    if (isRedisConnected()) {
      if (!this.redisStore) {
        try {
          const client = getRedisClient();
          this.redisStore = new RedisStore({
            sendCommand: (...args) => client.call(...args),
            prefix: `prep:rl:${this.prefix}:`,
          });
          if (this.options) {
            this.redisStore.init(this.options);
          }
        } catch (err) {
          logger.warn({ err: err.message }, "Failed to initialize Redis rate limit store; using in-memory store");
          this.redisStore = null;
        }
      }
      return this.redisStore;
    }
    return null;
  }

  async increment(key) {
    const rStore = this._getRedisStore();
    if (rStore) {
      try {
        return await rStore.increment(key);
      } catch (err) {
        logger.warn({ err: err.message }, "Redis rate-limit increment failed; using memory fallback");
      }
    }
    return this.memoryStore.increment(key);
  }

  async decrement(key) {
    const rStore = this._getRedisStore();
    if (rStore) {
      try {
        return await rStore.decrement(key);
      } catch (err) {
        logger.warn({ err: err.message }, "Redis rate-limit decrement failed; using memory fallback");
      }
    }
    return this.memoryStore.decrement(key);
  }

  async resetKey(key) {
    const rStore = this._getRedisStore();
    if (rStore) {
      try {
        await rStore.resetKey(key);
      } catch (err) {
        // fallback
      }
    }
    return this.memoryStore.resetKey(key);
  }

  async resetAll() {
    const rStore = this._getRedisStore();
    if (rStore) {
      try {
        await rStore.resetAll();
      } catch (err) {
        // fallback
      }
    }
    return this.memoryStore.resetAll();
  }
}

/**
 * General API rate limiter (protects against general denial-of-service / scanning)
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 minutes
  standardHeaders: true, // Return standard `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req) => req.method === "OPTIONS",
  store: new ResilientRateLimitStore("api"),
  handler: rateLimitHandler("Too many requests from this IP. Please try again after 15 minutes."),
});

/**
 * Strict rate limiter for Authentication endpoints (prevents brute-force)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
  store: new ResilientRateLimitStore("auth"),
  handler: rateLimitHandler("Too many authentication attempts. Please try again after 15 minutes."),
});

/**
 * Rate limiter for AI generation / LLM endpoints (protects LLM rate limits and costs)
 */
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  store: new ResilientRateLimitStore("ai"),
  handler: rateLimitHandler("AI generation rate limit exceeded. Please wait a moment before trying again."),
});

/**
 * Rate limiter for Session management
 */
const sessionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  store: new ResilientRateLimitStore("session"),
  handler: rateLimitHandler("Too many session operations. Please slow down."),
});

/**
 * General purpose rate limiter for read / status queries
 */
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  store: new ResilientRateLimitStore("general"),
  handler: rateLimitHandler("Too many requests. Please slow down."),
});

/**
 * Strict rate limiter for CPU-intensive sandbox execution
 */
const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // 15 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  store: new ResilientRateLimitStore("strict"),
  handler: rateLimitHandler("Strict execution rate limit reached. Please wait before running again."),
});

module.exports = {
  apiLimiter,
  authLimiter,
  aiLimiter,
  sessionLimiter,
  generalLimiter,
  strictLimiter,
  ResilientRateLimitStore,
};

