require("dotenv").config();
const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const hpp = require("hpp");
const mongoSanitize = require("express-mongo-sanitize");
const pinoHttp = require("pino-http");
const mongoose = require("mongoose");

const connectDB = require("./config/db");
const { connectRedis, checkRedisHealth, closeRedis } = require("./config/redis");
const cacheService = require("./services/cacheService");
const queueService = require("./queues");
const { startWorkers, stopWorkers } = require("./workers");
const { initWebSocketServer, closeWebSocketServer } = require("./websocket/wsServer");
const connectionManager = require("./websocket/connectionManager");
const logger = require("./utils/logger");
const { AppError, errorHandler } = require("./middlewares/errorHandler");
const { apiLimiter } = require("./middlewares/rateLimiter");

// Route imports
const authRoute = require("./routes/authRoute");
const sessionRoute = require("./routes/sessionRoute");
const questionRoutes = require("./routes/questionRoute");
const aiRoute = require("./routes/aiRoute");
const ragRoute = require("./routes/ragRoute");
const codeRoute = require("./routes/codeRoute");

const app = express();
const PORT = process.env.PORT || 9000;

// Trust reverse proxy (e.g. Nginx, AWS ALB, Render)
app.set("trust proxy", 1);

// Attach unique correlation ID to every incoming request
app.use((req, res, next) => {
  req.id = req.headers["x-request-id"] || crypto.randomUUID();
  res.setHeader("X-Request-Id", req.id);
  next();
});

// Structured HTTP request logging with Pino
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.id,
    customLogLevel: (req, res, err) => {
      if (res.statusCode >= 500 || err) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
    autoLogging: {
      ignore: (req) => req.url.startsWith("/health") || req.url === "/ping",
    },
  })
);

// Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// Prevent HTTP Parameter Pollution attacks
app.use(hpp());

// Sanitize user-supplied data against NoSQL query injection (Express 5 compatible)
app.use((req, res, next) => {
  if (req.body && typeof req.body === "object") {
    mongoSanitize.sanitize(req.body, { replaceWith: "_" });
  }
  if (req.params && typeof req.params === "object") {
    mongoSanitize.sanitize(req.params, { replaceWith: "_" });
  }
  if (req.query && typeof req.query === "object") {
    for (const key of Object.keys(req.query)) {
      if (typeof req.query[key] === "object" && req.query[key] !== null) {
        mongoSanitize.sanitize(req.query[key], { replaceWith: "_" });
      }
    }
  }
  next();
});

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:9000",
      "http://127.0.0.1:5173",
    ];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        return callback(null, true);
      }
      return callback(new AppError(`CORS policy does not allow access from ${origin}`, 403));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
    exposedHeaders: ["X-Request-Id", "RateLimit-Limit", "RateLimit-Remaining", "RateLimit-Reset"],
  })
);

// Body Parsers with payload limits
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Connect to MongoDB and Redis
if (process.env.NODE_ENV !== "test") {
  connectDB();
  connectRedis();
}

// Global API rate limiter
app.use("/api", apiLimiter);

// Health Check Endpoints
app.get("/health", async (req, res) => {
  const mongoStatus = mongoose.connection.readyState;
  const mongoStateMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const redisHealth = await checkRedisHealth();
  const queueMetrics = await queueService.getQueuesMetrics();
  const isHealthy = mongoStatus === 1;

    const healthData = {
      status: isHealthy ? "UP" : "DEGRADED",
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      services: {
        mongodb: {
          status: mongoStateMap[mongoStatus] || "unknown",
          connected: mongoStatus === 1,
        },
        redis: redisHealth,
        cache: cacheService.getMetrics(),
        queues: queueMetrics,
        websocket: connectionManager.getStats(),
      },
      system: {
        nodeVersion: process.version,
        memoryUsageMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
        pid: process.pid,
      },
    };

  res.status(isHealthy ? 200 : 503).json(healthData);
});

// Liveness probe (Kubernetes / container healthcheck)
app.get("/health/live", (req, res) => {
  res.status(200).json({ status: "alive", timestamp: new Date().toISOString() });
});

// Readiness probe
app.get("/health/ready", (req, res) => {
  if (mongoose.connection.readyState === 1) {
    return res.status(200).json({ status: "ready", timestamp: new Date().toISOString() });
  }
  return res.status(503).json({ status: "not_ready", reason: "MongoDB not connected" });
});

// Keep-alive endpoint for legacy compatibility
app.get("/ping", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Application Routes
app.use("/api/auth", authRoute);
app.use("/api/sessions", sessionRoute);
app.use("/api/questions", questionRoutes);
app.use("/api/ai", aiRoute);
app.use("/api/rag", ragRoute);
app.use("/api/code", codeRoute);

// Static uploads serving
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Welcome route for root
app.get("/", (req, res) => {
  res.status(200).json({
    name: "Prep API Platform",
    version: "1.0.0",
    status: "running",
    docs: "/health",
  });
});

// Catch-all for unhandled routes (404)
app.use((req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
});

// Centralized error handler
app.use(errorHandler);

let server;

if (require.main === module) {
  // Start server
  server = app.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
    initWebSocketServer(server);
    startWorkers();
  });

  // Graceful shutdown handling
  const gracefulShutdown = (signal) => {
    logger.info({ signal }, `Received ${signal}. Starting graceful shutdown...`);

    server.close(async () => {
      logger.info("HTTP server closed to new requests.");
      try {
        await closeWebSocketServer();
        await stopWorkers();
        await queueService.closeQueues();
        await closeRedis();
        await mongoose.connection.close(false);
        logger.info("WebSocket, Queues, Database and Redis connections closed cleanly.");
        process.exit(0);
      } catch (err) {
        logger.error({ err: err.message }, "Error during cleanup/disconnection");
        process.exit(1);
      }
    });

    // Force shutdown after 10 seconds if graceful drain fails
    setTimeout(() => {
      logger.error("Forcefully terminating process after shutdown timeout.");
      process.exit(1);
    }, 10000).unref();
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  // Global process exception safety nets
  process.on("uncaughtException", (err) => {
    logger.fatal({ err: err.message, stack: err.stack }, "Uncaught Exception! Shutting down...");
    process.exit(1);
  });

  process.on("unhandledRejection", (err) => {
    logger.fatal({ err: err?.message || err, stack: err?.stack }, "Unhandled Rejection! Shutting down...");
    server.close(() => {
      process.exit(1);
    });
  });
}

module.exports = { app, server };
