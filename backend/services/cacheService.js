const { getRedisClient, isRedisConnected } = require("../config/redis");
const logger = require("../utils/logger");

/**
 * Standard Time-To-Live (TTL) strategies in seconds
 */
const TTL = {
  USER_PROFILE: 300, // 5 minutes
  SESSION_LIST: 120, // 2 minutes
  SESSION_DETAIL: 180, // 3 minutes
  QUESTION_LIST: 600, // 10 minutes
  CONFIG: 3600, // 1 hour
};

/**
 * In-memory fallback cache store for degraded/test mode when Redis is offline
 */
class MemoryCacheStore {
  constructor() {
    this.store = new Map();
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  set(key, value, ttlSeconds) {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value, expiresAt });
  }

  del(key) {
    this.store.delete(key);
  }

  invalidatePattern(pattern) {
    const regexPattern = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    for (const key of this.store.keys()) {
      if (regexPattern.test(key)) {
        this.store.delete(key);
      }
    }
  }

  clear() {
    this.store.clear();
  }
}

const memoryStore = new MemoryCacheStore();

class CacheService {
  constructor() {
    this.prefix = "prep:cache:";
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };
  }

  /**
   * Sanitizes key to prevent key injection attacks
   */
  _formatKey(key) {
    if (typeof key !== "string" || !key.trim()) {
      throw new Error("Invalid cache key: must be a non-empty string");
    }
    // Allow alphanumeric characters, hyphens, colons, underscores, and dots
    const sanitized = key.trim().replace(/[^a-zA-Z0-9:_\-\.]/g, "_");
    return `${this.prefix}${sanitized}`;
  }

  /**
   * Safely serialize values for cache storage
   */
  _serialize(value) {
    try {
      return JSON.stringify(value);
    } catch (err) {
      logger.warn({ err: err.message }, "Failed to serialize value for cache");
      return null;
    }
  }

  /**
   * Safely deserialize cached JSON
   */
  _deserialize(raw) {
    try {
      return JSON.parse(raw);
    } catch (err) {
      logger.warn({ err: err.message }, "Failed to parse cached value from JSON");
      return null;
    }
  }

  /**
   * Get value from cache
   */
  async get(key) {
    const fullKey = this._formatKey(key);

    if (isRedisConnected()) {
      try {
        const client = getRedisClient();
        const raw = await client.get(fullKey);
        if (raw !== null) {
          this.stats.hits++;
          return this._deserialize(raw);
        }
      } catch (err) {
        logger.warn({ key: fullKey, err: err.message }, "Redis get error, checking fallback store");
      }
    }

    // Fallback to memory store if Redis is unavailable or on cache miss
    const fallbackValue = memoryStore.get(fullKey);
    if (fallbackValue !== null) {
      this.stats.hits++;
      return fallbackValue;
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Set value in cache with TTL
   */
  async set(key, value, ttlSeconds = TTL.SESSION_DETAIL) {
    if (value === undefined || value === null) {
      return;
    }

    const fullKey = this._formatKey(key);
    const serialized = this._serialize(value);
    if (!serialized) return;

    this.stats.sets++;

    if (isRedisConnected()) {
      try {
        const client = getRedisClient();
        if (ttlSeconds > 0) {
          await client.set(fullKey, serialized, "EX", ttlSeconds);
        } else {
          await client.set(fullKey, serialized);
        }
      } catch (err) {
        logger.warn({ key: fullKey, err: err.message }, "Redis set error, writing to memory store fallback");
      }
    }

    // Always mirror to memory store in degraded / testing mode
    memoryStore.set(fullKey, value, ttlSeconds);
  }

  /**
   * Invalidate / delete a single key from cache
   */
  async del(key) {
    const fullKey = this._formatKey(key);
    this.stats.deletes++;

    if (isRedisConnected()) {
      try {
        const client = getRedisClient();
        await client.del(fullKey);
      } catch (err) {
        logger.warn({ key: fullKey, err: err.message }, "Redis del error");
      }
    }

    memoryStore.del(fullKey);
  }

  /**
   * Non-blocking pattern invalidation using SCAN (batch size 100)
   * Avoids the severe blocking performance penalty of KEYS *
   */
  async invalidatePattern(pattern) {
    const searchPattern = `${this.prefix}${pattern}`;
    this.stats.deletes++;

    if (isRedisConnected()) {
      try {
        const client = getRedisClient();
        let cursor = "0";

        do {
          const [nextCursor, keys] = await client.scan(cursor, "MATCH", searchPattern, "COUNT", 100);
          cursor = nextCursor;

          if (keys && keys.length > 0) {
            await client.del(...keys);
          }
        } while (cursor !== "0");
      } catch (err) {
        logger.warn({ pattern: searchPattern, err: err.message }, "Redis SCAN pattern invalidation error");
      }
    }

    memoryStore.invalidatePattern(searchPattern);
  }

  /**
   * Core Cache-Aside helper:
   * Returns cached value if present, otherwise invokes fetchFn, caches result, and returns it.
   */
  async getOrSet(key, fetchFn, ttlSeconds = TTL.SESSION_DETAIL) {
    try {
      const cached = await this.get(key);
      if (cached !== null) {
        return cached;
      }
    } catch (err) {
      logger.warn({ key, err: err.message }, "Cache read failure, proceeding to source of truth");
    }

    // Fetch from primary data source (MongoDB)
    const freshData = await fetchFn();

    // Cache the fresh data asynchronously if valid
    if (freshData !== null && freshData !== undefined) {
      this.set(key, freshData, ttlSeconds).catch((err) => {
        logger.warn({ key, err: err.message }, "Asynchronous cache set failed");
      });
    }

    return freshData;
  }

  /**
   * Returns cache metrics for monitoring and health reporting
   */
  getMetrics() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    return {
      ...this.stats,
      totalRequests,
      hitRate: `${hitRate.toFixed(2)}%`,
      isRedisConnected: isRedisConnected(),
    };
  }

  /**
   * Clear in-memory fallback store (useful for tests)
   */
  clearMemoryStore() {
    memoryStore.clear();
  }
}

module.exports = new CacheService();
module.exports.TTL = TTL;
