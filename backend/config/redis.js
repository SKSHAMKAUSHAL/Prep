const Redis = require("ioredis");
const logger = require("../utils/logger");

let redisClient = null;
let isConnected = false;
let connectionAttempted = false;

/**
 * Build Redis connection options
 */
const getRedisOptions = () => {
  const redisUrl = process.env.REDIS_URL;

  const baseOptions = {
    maxRetriesPerRequest: 3,
    connectTimeout: Number(process.env.REDIS_CONNECT_TIMEOUT_MS) || 5000,
    enableOfflineQueue: false, // Prevent unbounded memory buildup if Redis is down
    lazyConnect: true,
    retryStrategy(times) {
      if (process.env.NODE_ENV === "test" && times > 1) {
        return null; // Stop retrying quickly during automated tests
      }
      const maxRetryDelay = 3000;
      const delay = Math.min(times * 200, maxRetryDelay);
      logger.info({ attempt: times, nextRetryMs: delay }, "Retrying Redis connection...");
      return delay;
    },
  };

  return { redisUrl, baseOptions };
};

/**
 * Initializes and returns the singleton Redis client
 */
const initRedis = () => {
  if (redisClient) {
    return redisClient;
  }

  const { redisUrl, baseOptions } = getRedisOptions();

  try {
    if (redisUrl) {
      redisClient = new Redis(redisUrl, baseOptions);
    } else {
      redisClient = new Redis({
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        ...baseOptions,
      });
    }

    redisClient.on("connect", () => {
      logger.info("Connecting to Redis...");
    });

    redisClient.on("ready", () => {
      isConnected = true;
      logger.info("Redis client connected and ready to accept commands");
    });

    redisClient.on("error", (err) => {
      isConnected = false;
      logger.warn({ err: err.message }, "Redis connection error");
    });

    redisClient.on("close", () => {
      isConnected = false;
      logger.warn("Redis connection closed");
    });

    redisClient.on("reconnecting", (delay) => {
      logger.info({ delay }, "Redis client reconnecting...");
    });

    redisClient.on("end", () => {
      isConnected = false;
      logger.warn("Redis client ended connection");
    });

    return redisClient;
  } catch (err) {
    logger.error({ err: err.message }, "Failed to instantiate Redis client");
    return null;
  }
};

/**
 * Connect to Redis if not connected
 */
const connectRedis = async () => {
  if (connectionAttempted && isConnected) return redisClient;
  connectionAttempted = true;

  const client = initRedis();
  if (!client) return null;

  try {
    if (client.status === "wait") {
      await client.connect();
    }
    return client;
  } catch (err) {
    logger.warn({ err: err.message }, "Initial Redis connection attempt failed; operating in degraded mode");
    return null;
  }
};

/**
 * Return current Redis client instance
 */
const getRedisClient = () => {
  if (!redisClient) {
    initRedis();
  }
  return redisClient;
};

/**
 * Check if Redis is currently connected and ready
 */
const isRedisConnected = () => {
  return Boolean(redisClient && redisClient.status === "ready");
};

/**
 * Ping Redis and calculate latency for health probes
 */
const checkRedisHealth = async () => {
  if (!redisClient || redisClient.status !== "ready") {
    return {
      status: "disconnected",
      latencyMs: null,
      message: "Redis client not ready",
    };
  }

  const start = Date.now();
  try {
    const pong = await redisClient.ping();
    const latencyMs = Date.now() - start;
    return {
      status: pong === "PONG" ? "healthy" : "degraded",
      latencyMs,
      message: pong === "PONG" ? "Redis is responding" : "Unexpected response from Redis",
    };
  } catch (err) {
    return {
      status: "disconnected",
      latencyMs: null,
      message: err.message,
    };
  }
};

/**
 * Gracefully close Redis connection
 */
const closeRedis = async () => {
  if (!redisClient) return;
  try {
    if (redisClient.status === "ready" || redisClient.status === "connecting") {
      await redisClient.quit();
      logger.info("Redis connection closed cleanly");
    } else {
      redisClient.disconnect();
    }
  } catch (err) {
    logger.warn({ err: err.message }, "Error during Redis disconnect, forcing closure");
    redisClient.disconnect();
  } finally {
    isConnected = false;
    redisClient = null;
    connectionAttempted = false;
  }
};

/**
 * Connection options required specifically by BullMQ
 * BullMQ requires maxRetriesPerRequest: null and custom retry strategy.
 */
const getBullMQConnectionOptions = () => {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      const parsed = new URL(redisUrl);
      return {
        host: parsed.hostname || "127.0.0.1",
        port: Number(parsed.port) || 6379,
        password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
        username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
        maxRetriesPerRequest: null,
        connectTimeout: Number(process.env.REDIS_CONNECT_TIMEOUT_MS) || 5000,
        enableOfflineQueue: true,
      };
    } catch (e) {
      // Fallback
    }
  }

  return {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    connectTimeout: Number(process.env.REDIS_CONNECT_TIMEOUT_MS) || 5000,
    enableOfflineQueue: true,
  };
};

module.exports = {
  initRedis,
  connectRedis,
  getRedisClient,
  isRedisConnected,
  checkRedisHealth,
  closeRedis,
  getBullMQConnectionOptions,
};
