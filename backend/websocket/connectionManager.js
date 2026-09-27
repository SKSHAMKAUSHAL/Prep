const logger = require("../utils/logger");

const MAX_CONNECTIONS_PER_USER = 3;

class ConnectionManager {
  constructor() {
    this.userSockets = new Map(); // userId -> Set<WebSocket>
    this.sessionSockets = new Map(); // sessionId -> Set<WebSocket>
    this.socketMeta = new Map(); // ws -> { userId, sessionId, connectionId, connectedAt }
    this.sessionGazeMetrics = new Map(); // sessionId -> Array<TelemetrySample>
  }

  /**
   * Register a new WebSocket connection
   */
  addConnection(userId, sessionId, ws, connectionId) {
    // Check max connections limit per user to prevent connection exhaustion attacks
    const existing = this.userSockets.get(userId) || new Set();
    if (existing.size >= MAX_CONNECTIONS_PER_USER) {
      logger.warn({ userId, count: existing.size }, "Max WebSocket connections exceeded for user");
      ws.close(1008, "Max concurrent connections reached");
      return false;
    }

    existing.add(ws);
    this.userSockets.set(userId, existing);

    if (sessionId) {
      const sessionSet = this.sessionSockets.get(sessionId) || new Set();
      sessionSet.add(ws);
      this.sessionSockets.set(sessionId, sessionSet);
    }

    this.socketMeta.set(ws, {
      userId,
      sessionId,
      connectionId,
      connectedAt: Date.now(),
    });

    logger.info(
      { userId, sessionId, connectionId, activeConnections: this.socketMeta.size },
      "WebSocket client connected and registered"
    );

    return true;
  }

  /**
   * Remove a connection on close or error
   */
  removeConnection(ws) {
    const meta = this.socketMeta.get(ws);
    if (!meta) return;

    const { userId, sessionId, connectionId } = meta;

    if (userId && this.userSockets.has(userId)) {
      const userSet = this.userSockets.get(userId);
      userSet.delete(ws);
      if (userSet.size === 0) {
        this.userSockets.delete(userId);
      }
    }

    if (sessionId && this.sessionSockets.has(sessionId)) {
      const sessionSet = this.sessionSockets.get(sessionId);
      sessionSet.delete(ws);
      if (sessionSet.size === 0) {
        this.sessionSockets.delete(sessionId);
      }
    }

    this.socketMeta.delete(ws);

    logger.info(
      { userId, sessionId, connectionId, activeConnections: this.socketMeta.size },
      "WebSocket client disconnected and deregistered"
    );
  }

  /**
   * Send JSON message to a specific user across all their open sockets
   */
  sendToUser(userId, message) {
    const sockets = this.userSockets.get(userId);
    if (!sockets) return false;

    const payload = typeof message === "string" ? message : JSON.stringify(message);

    for (const ws of sockets) {
      if (ws.readyState === ws.OPEN) {
        ws.send(payload);
      }
    }
    return true;
  }

  /**
   * Broadcast message to all participants in a session
   */
  broadcastToSession(sessionId, message, excludeWs = null) {
    const sockets = this.sessionSockets.get(sessionId);
    if (!sockets) return false;

    const payload = typeof message === "string" ? message : JSON.stringify(message);

    for (const ws of sockets) {
      if (ws !== excludeWs && ws.readyState === ws.OPEN) {
        ws.send(payload);
      }
    }
    return true;
  }

  /**
   * Records lightweight browser-native gaze & attention telemetry from MediaPipe Face Mesh
   */
  recordGazeTelemetry(userId, sessionId, telemetry) {
    if (!sessionId) return;

    let history = this.sessionGazeMetrics.get(sessionId);
    if (!history) {
      history = [];
      this.sessionGazeMetrics.set(sessionId, history);
    }

    history.push({
      userId,
      gazeDirection: telemetry.gazeDirection || "center",
      eyeContactScore: typeof telemetry.eyeContactScore === "number" ? telemetry.eyeContactScore : 1.0,
      isLookingAway: Boolean(telemetry.isLookingAway),
      pitch: telemetry.pitch || 0,
      yaw: telemetry.yaw || 0,
      timestamp: telemetry.timestamp || Date.now(),
    });

    // Circular buffer: retain last 120 samples (~2 minutes at 1Hz) to preserve memory
    if (history.length > 120) {
      history.shift();
    }
  }

  /**
   * Computes aggregated behavioral attention metrics for Evaluator & Moderator
   */
  getGazeAnalytics(sessionId) {
    const history = this.sessionGazeMetrics.get(sessionId);
    if (!history || history.length === 0) {
      return {
        sampleCount: 0,
        averageEyeContact: 1.0,
        centerRatio: 1.0,
        distractionEventCount: 0,
        engagementLevel: "Optimal",
      };
    }

    const totalScore = history.reduce((acc, h) => acc + h.eyeContactScore, 0);
    const avgScore = totalScore / history.length;
    const centerCount = history.filter((h) => h.gazeDirection === "center").length;
    const centerRatio = centerCount / history.length;
    const distractionCount = history.filter((h) => h.isLookingAway).length;

    let engagement = "Optimal";
    if (avgScore < 0.6 || distractionCount > 15) {
      engagement = "Distracted";
    } else if (avgScore < 0.8) {
      engagement = "Moderate";
    }

    return {
      sampleCount: history.length,
      averageEyeContact: Number(avgScore.toFixed(3)),
      centerRatio: Number(centerRatio.toFixed(3)),
      distractionEventCount: distractionCount,
      engagementLevel: engagement,
      latest: history[history.length - 1],
    };
  }

  /**
   * Observability metrics
   */
  getStats() {
    return {
      totalConnections: this.socketMeta.size,
      activeUsers: this.userSockets.size,
      activeSessions: this.sessionSockets.size,
      trackedGazeSessions: this.sessionGazeMetrics.size,
    };
  }

  /**
   * Cleanly close all connections during server shutdown
   */
  closeAll() {
    for (const [ws] of this.socketMeta) {
      try {
        ws.close(1001, "Server shutting down");
      } catch (err) {
        // ignore
      }
    }
    this.userSockets.clear();
    this.sessionSockets.clear();
    this.socketMeta.clear();
    this.sessionGazeMetrics.clear();
  }
}

module.exports = new ConnectionManager();
