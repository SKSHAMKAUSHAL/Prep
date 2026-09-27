const { WebSocketServer } = require("ws");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const connectionManager = require("./connectionManager");
const streamingAIService = require("../services/streamingAIService");
const sessionStateService = require("../services/sessionStateService");
const queueService = require("../queues");
const logger = require("../utils/logger");

let wss = null;
let heartbeatInterval = null;

/**
 * Validates JWT from query string or protocol headers
 */
const authenticateSocket = (req) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    let token = url.searchParams.get("token");

    if (!token && req.headers["sec-websocket-protocol"]) {
      const protocols = req.headers["sec-websocket-protocol"].split(",").map((p) => p.trim());
      token = protocols.find((p) => p.startsWith("token."))?.replace("token.", "") || protocols[0];
    }

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id || decoded._id;
  } catch (err) {
    logger.warn({ error: err.message }, "WebSocket authentication failed");
    return null;
  }
};

/**
 * Initializes the WebSocket server mounted on the provided HTTP server
 */
const initWebSocketServer = (httpServer) => {
  if (wss) return wss;

  wss = new WebSocketServer({
    noServer: true,
    path: "/ws/interview",
    maxPayload: 1024 * 1024, // 1MB maximum payload
  });

  // Handle HTTP upgrade event
  httpServer.on("upgrade", (request, socket, head) => {
    const { pathname } = new URL(request.url, `http://${request.headers.host || "localhost"}`);

    if (pathname === "/ws/interview") {
      const userId = authenticateSocket(request);
      if (!userId) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request, userId);
      });
    }
  });

  // Client connection handler
  wss.on("connection", (ws, req, userId) => {
    const connectionId = crypto.randomUUID();
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const sessionId = url.searchParams.get("sessionId") || null;

    ws.isAlive = true;
    ws.userId = userId;
    ws.sessionId = sessionId;
    ws.connectionId = connectionId;
    ws.activeAbortController = null;

    const registered = connectionManager.addConnection(userId, sessionId, ws, connectionId);
    if (!registered) return;

    // Send connection established confirmation
    ws.send(
      JSON.stringify({
        type: "connection:ready",
        userId,
        sessionId,
        connectionId,
        serverTime: new Date().toISOString(),
      })
    );

    // Heartbeat pong listener
    ws.on("pong", () => {
      ws.isAlive = true;
    });

    // Inbound message router
    ws.on("message", async (rawMessage) => {
      try {
        const message = JSON.parse(rawMessage.toString());
        await handleSocketMessage(ws, message);
      } catch (err) {
        logger.warn({ error: err.message }, "Failed to parse incoming WebSocket message");
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({ type: "error", message: "Invalid JSON message format" }));
        }
      }
    });

    ws.on("close", () => {
      if (ws.activeAbortController) {
        ws.activeAbortController.abort();
      }
      connectionManager.removeConnection(ws);
    });

    ws.on("error", (err) => {
      logger.warn({ error: err.message, connectionId }, "WebSocket client error event");
      connectionManager.removeConnection(ws);
    });
  });

  // Setup heartbeat ping to detect dead sockets every 30 seconds
  heartbeatInterval = setInterval(() => {
    if (!wss) return;
    for (const client of wss.clients) {
      if (client.isAlive === false) {
        logger.info({ connectionId: client.connectionId }, "Terminating unresponsive WebSocket client");
        client.terminate();
        continue;
      }
      client.isAlive = false;
      client.ping();
    }
  }, 30000);

  logger.info("WebSocket Streaming Server initialized on path /ws/interview");
  return wss;
};

/**
 * Routes and handles incoming messages by type
 */
const handleSocketMessage = async (ws, message) => {
  const { type } = message;

  switch (type) {
    case "ping": {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
      }
      break;
    }

    case "interview:start": {
      const { sessionId, role, experience, persona } = message;
      if (sessionId) {
        ws.sessionId = sessionId;
        connectionManager.addConnection(ws.userId, sessionId, ws, ws.connectionId);

        let liveState = await sessionStateService.getSessionState(sessionId, ws.userId).catch(() => null);
        if (!liveState) {
          liveState = await sessionStateService.initSessionState(sessionId, ws.userId, {
            role,
            experience,
          });
        }

        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({ type: "interview:state", state: liveState }));
        }
      }
      break;
    }

    case "transcript:final": {
      const { sessionId, question, text, persona, role } = message;

      // Abort any existing ongoing stream before starting a new one
      if (ws.activeAbortController) {
        ws.activeAbortController.abort();
      }

      const abortController = new AbortController();
      ws.activeAbortController = abortController;

      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: "ai:response:start" }));
      }

      try {
        const { fullText, interrupted } = await streamingAIService.streamInterviewResponse({
          question: question || "Can you tell me about yourself and your background?",
          userAnswer: text || "",
          persona: persona || "balanced",
          role: role || "Software Engineer",
          signal: abortController.signal,
          onToken: (tokenChunk, isFirstToken) => {
            if (ws.readyState === ws.OPEN && !abortController.signal.aborted) {
              ws.send(
                JSON.stringify({
                  type: "ai:response:chunk",
                  text: tokenChunk,
                  isFirstToken,
                })
              );
            }
          },
        });

        if (interrupted) {
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: "ai:response:interrupted" }));
          }
        } else {
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: "ai:response:end", fullText }));
          }

          // Offload evaluation to BullMQ in background with gaze attention metrics
          if (sessionId && text) {
            const gazeMetrics = connectionManager.getGazeAnalytics(sessionId);
            queueService
              .addEvaluationJob({
                sessionId,
                userId: ws.userId,
                questionText: question,
                userAnswer: text,
                persona,
                gazeMetrics,
              })
              .then((job) => {
                if (ws.readyState === ws.OPEN) {
                  ws.send(JSON.stringify({ type: "job:dispatched", jobId: job.id, queue: "evaluation" }));
                }
              })
              .catch((err) => logger.warn({ err: err.message }, "Background evaluation dispatch error"));
          }
        }
      } catch (err) {
        logger.error({ error: err.message }, "Streaming AI response failed");
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({ type: "error", message: "Failed to generate AI response stream" }));
        }
      } finally {
        ws.activeAbortController = null;
      }
      break;
    }

    case "interruption": {
      const { sessionId } = message;
      logger.info({ sessionId, userId: ws.userId }, "User barge-in interruption detected");

      if (ws.activeAbortController) {
        ws.activeAbortController.abort();
        ws.activeAbortController = null;
      }

      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: "ai:response:interrupted" }));
      }

      if (sessionId) {
        const updated = await sessionStateService
          .recordInterruption(sessionId, ws.userId)
          .catch((err) => logger.warn({ err: err.message }, "Failed to record interruption"));

        if (updated && ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({ type: "interview:state", interruptionCount: updated.interruptionCount }));
        }
      }
      break;
    }

    case "gaze:telemetry": {
      const { sessionId, gazeDirection, eyeContactScore, isLookingAway, pitch, yaw } = message;
      connectionManager.recordGazeTelemetry(ws.userId, sessionId, {
        gazeDirection,
        eyeContactScore,
        isLookingAway,
        pitch,
        yaw,
      });

      if (isLookingAway && ws.readyState === ws.OPEN) {
        ws.send(
          JSON.stringify({
            type: "gaze:alert",
            status: "distraction_detected",
            message: "Maintain steady eye contact with the interviewer",
          })
        );
      }
      break;
    }

    case "gaze:query": {
      const { sessionId } = message;
      const analytics = connectionManager.getGazeAnalytics(sessionId || ws.sessionId);
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: "gaze:metrics", data: analytics }));
      }
      break;
    }

    default:
      logger.debug({ type }, "Received unhandled WebSocket message type");
  }
};

/**
 * Cleanly shut down the WebSocket server
 */
const closeWebSocketServer = async () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  connectionManager.closeAll();

  if (wss) {
    return new Promise((resolve) => {
      wss.close(() => {
        logger.info("WebSocket server closed cleanly");
        wss = null;
        resolve();
      });
    });
  }
};

module.exports = {
  initWebSocketServer,
  closeWebSocketServer,
  authenticateSocket,
};
