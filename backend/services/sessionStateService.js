const { getRedisClient, isRedisConnected } = require("../config/redis");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");

const LIVE_SESSION_TTL = 3600; // 1 hour (auto-expire abandoned sessions)

/**
 * In-memory fallback for live session state in test/degraded environments
 */
const memoryLiveSessions = new Map();

class SessionStateService {
  constructor() {
    this.prefix = "prep:session:live:";
  }

  /**
   * Builds sanitized key for Redis
   */
  _formatKey(sessionId) {
    if (!sessionId || typeof sessionId !== "string") {
      throw new AppError("Invalid sessionId: must be a valid identifier", 400);
    }
    const cleanId = sessionId.trim().replace(/[^a-zA-Z0-9_-]/g, "");
    return `${this.prefix}${cleanId}`;
  }

  /**
   * Initializes real-time session state in Redis
   */
  async initSessionState(sessionId, userId, metadata = {}) {
    const key = this._formatKey(sessionId);
    const now = Date.now();

    const initialState = {
      sessionId: String(sessionId),
      userId: String(userId),
      role: metadata.role || "Software Engineer",
      experience: metadata.experience || "Mid",
      currentQuestionIndex: 0,
      currentPhase: "intro", // intro | technical | behavioral | closing
      agentState: "interviewer", // interviewer | evaluator | moderator
      elapsedSeconds: 0,
      questionHistory: [],
      interruptionCount: 0,
      status: "active", // active | paused | completed
      createdAt: now,
      lastActiveAt: now,
    };

    const serialized = JSON.stringify(initialState);

    if (isRedisConnected()) {
      try {
        const client = getRedisClient();
        await client.set(key, serialized, "EX", LIVE_SESSION_TTL);
      } catch (err) {
        logger.warn({ key, err: err.message }, "Failed to write live session state to Redis");
      }
    }

    memoryLiveSessions.set(key, { ...initialState, expiresAt: now + LIVE_SESSION_TTL * 1000 });
    return initialState;
  }

  /**
   * Retrieves active session state with IDOR protection
   */
  async getSessionState(sessionId, requestingUserId) {
    const key = this._formatKey(sessionId);
    let state = null;

    if (isRedisConnected()) {
      try {
        const client = getRedisClient();
        const raw = await client.get(key);
        if (raw) {
          state = JSON.parse(raw);
        }
      } catch (err) {
        logger.warn({ key, err: err.message }, "Failed to read live session state from Redis");
      }
    }

    if (!state) {
      const memoryItem = memoryLiveSessions.get(key);
      if (memoryItem && (!memoryItem.expiresAt || Date.now() < memoryItem.expiresAt)) {
        state = { ...memoryItem };
        delete state.expiresAt;
      }
    }

    if (!state) {
      return null;
    }

    // IDOR Protection: Ensure user owns this live session
    if (requestingUserId && String(state.userId) !== String(requestingUserId)) {
      throw new AppError("Access denied: You do not have permission to view or mutate this session state", 403);
    }

    return state;
  }

  /**
   * Updates real-time session state and extends TTL
   */
  async updateSessionState(sessionId, requestingUserId, updates = {}) {
    const existing = await this.getSessionState(sessionId, requestingUserId);
    if (!existing) {
      throw new AppError("Live session state not found or has expired", 404);
    }

    const key = this._formatKey(sessionId);
    const now = Date.now();

    // Whitelist allowed fields to prevent arbitrary state pollution
    const allowedFields = [
      "currentQuestionIndex",
      "currentPhase",
      "agentState",
      "elapsedSeconds",
      "questionHistory",
      "interruptionCount",
      "status",
    ];

    const updatedState = { ...existing, lastActiveAt: now };

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updatedState[field] = updates[field];
      }
    }

    const serialized = JSON.stringify(updatedState);

    if (isRedisConnected()) {
      try {
        const client = getRedisClient();
        await client.set(key, serialized, "EX", LIVE_SESSION_TTL);
      } catch (err) {
        logger.warn({ key, err: err.message }, "Failed to update live session state in Redis");
      }
    }

    memoryLiveSessions.set(key, { ...updatedState, expiresAt: now + LIVE_SESSION_TTL * 1000 });
    return updatedState;
  }

  /**
   * Atomically records an interruption event
   */
  async recordInterruption(sessionId, requestingUserId) {
    const state = await this.getSessionState(sessionId, requestingUserId);
    if (!state) return null;

    const currentCount = (state.interruptionCount || 0) + 1;
    return this.updateSessionState(sessionId, requestingUserId, {
      interruptionCount: currentCount,
    });
  }

  /**
   * Terminates or removes live session state
   */
  async endSessionState(sessionId, requestingUserId) {
    const key = this._formatKey(sessionId);
    if (requestingUserId) {
      await this.getSessionState(sessionId, requestingUserId); // Validates ownership
    }

    if (isRedisConnected()) {
      try {
        const client = getRedisClient();
        await client.del(key);
      } catch (err) {
        logger.warn({ key, err: err.message }, "Failed to delete live session state from Redis");
      }
    }

    memoryLiveSessions.delete(key);
    return { success: true };
  }

  /**
   * Helper to clear memory sessions for test cleanup
   */
  clearMemory() {
    memoryLiveSessions.clear();
  }
}

module.exports = new SessionStateService();
