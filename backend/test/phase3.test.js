const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const jwt = require("jsonwebtoken");

// Set test environment
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_phase3_secret_key_minimum_32_characters_long_123456";

const { app } = require("../server");
const queueService = require("../queues");
const { processEvaluationJob } = require("../workers/evaluationWorker");
const { processReportJob } = require("../workers/reportWorker");
const { processAnalyticsJob } = require("../workers/analyticsWorker");

const createTestJwt = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

/**
 * Helper to make HTTP requests against the in-process express app
 */
const request = (server, options, body = null) => {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const port = address.port;
    const reqOptions = {
      hostname: "127.0.0.1",
      port,
      path: options.path,
      method: options.method || "GET",
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: json,
        });
      });
    });

    req.on("error", reject);

    if (body) {
      req.write(typeof body === "string" ? body : JSON.stringify(body));
    }
    req.end();
  });
};

test("Phase 3: Evaluation Worker Processor Multi-Dimensional Scoring", async (t) => {
  const mockJob = {
    id: "eval-test-1",
    data: {
      sessionId: "507f1f77bcf86cd799439011",
      userId: "507f191e810c19729de860ea",
      questionText: "Explain how Redis handles caching and cache eviction policies.",
      userAnswer:
        "Redis is an in-memory key-value data store that supports TTL expirations and eviction policies like LRU and LFU to prevent memory exhaustion.",
      persona: "tough",
    },
    updateProgress: async (p) => {},
  };

  const result = await processEvaluationJob(mockJob);

  assert.ok(result.score >= 0 && result.score <= 100, "Score should be between 0 and 100");
  assert.ok(result.dimensions.technicalAccuracy !== undefined);
  assert.ok(result.dimensions.communicationClarity !== undefined);
  assert.ok(result.dimensions.relevance !== undefined);
  assert.ok(result.dimensions.structure !== undefined);
  assert.ok(result.feedback.length > 0, "Feedback should not be empty");
  assert.equal(result.persona, "tough");
});

test("Phase 3: Report Worker Processor Session Diagnostic Summary", async (t) => {
  const mockJob = {
    id: "report-test-1",
    data: {
      sessionId: "507f1f77bcf86cd799439011",
      userId: "507f191e810c19729de860ea",
      role: "Backend Engineer",
      experience: "Senior",
      attempts: [
        { avgScore: 85, avgConfidence: 80, duration: 600 },
        { avgScore: 90, avgConfidence: 85, duration: 720 },
      ],
    },
    updateProgress: async (p) => {},
  };

  const report = await processReportJob(mockJob);

  assert.equal(report.targetRole, "Backend Engineer");
  assert.equal(report.overallAvgScore, 88);
  assert.equal(report.overallAvgConfidence, 83);
  assert.equal(report.performanceBand, "Exceptional");
  assert.ok(report.strengths.length > 0);
  assert.equal(report.attemptCount, 2);
});

test("Phase 3: Analytics Worker Processor Candidate Metric Aggregation", async (t) => {
  const mockJob = {
    id: "analytics-test-1",
    data: {
      userId: "507f191e810c19729de860ea",
      sessionId: "507f1f77bcf86cd799439011",
      metrics: {
        score: 88,
        confidence: 83,
        duration: 1320,
      },
    },
    updateProgress: async (p) => {},
  };

  const analytics = await processAnalyticsJob(mockJob);
  assert.equal(analytics.userId, "507f191e810c19729de860ea");
  assert.equal(analytics.score, 88);
  assert.equal(analytics.duration, 1320);
});

test("Phase 3: Queue Service Job Dispatch & Retrieval", async (t) => {
  const testPayload = {
    sessionId: "507f1f77bcf86cd799439011",
    userId: "507f191e810c19729de860ea",
    questionText: "What is horizontal scaling?",
    userAnswer: "Adding more machines to the pool rather than upgrading CPU/RAM.",
    persona: "balanced",
  };

  const job = await queueService.addEvaluationJob(testPayload);
  assert.ok(job.id, "Dispatched job must return a valid ID");

  // Wait briefly for asynchronous execution
  await new Promise((resolve) => setTimeout(resolve, 50));

  const status = await queueService.getJobStatus("evaluation-queue", job.id);
  assert.ok(status, "Job status should be retrievable");
  assert.equal(status.id, job.id);
  assert.ok(["active", "completed"].includes(status.state));
});

test("Phase 3: Queue Metrics Observability for Health Probes", async (t) => {
  const metrics = await queueService.getQueuesMetrics();
  assert.ok(metrics, "Metrics should be returned");
  assert.ok(metrics.isRedisBacked !== undefined);
});

test("Phase 3: Security & IDOR Guard on Job Status Endpoint", async (t) => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));

  try {
    const ownerId = "507f191e810c19729de860ea";
    const attackerId = "507f191e810c19729de860eb";

    const ownerToken = createTestJwt(ownerId);
    const attackerToken = createTestJwt(attackerId);

    // Dispatch job for owner
    const job = await queueService.addEvaluationJob({
      sessionId: "507f1f77bcf86cd799439011",
      userId: ownerId,
      questionText: "Security test",
      userAnswer: "Answer",
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    // 1. Unauthenticated request -> 401 Unauthorized
    const resNoAuth = await request(server, {
      path: `/api/sessions/jobs/evaluation-queue/${job.id}`,
      method: "GET",
    });
    assert.equal(resNoAuth.statusCode, 401);

    // 2. Attacker querying owner's job -> 403 Forbidden (IDOR Guard)
    const resAttacker = await request(server, {
      path: `/api/sessions/jobs/evaluation-queue/${job.id}`,
      method: "GET",
      headers: { Authorization: `Bearer ${attackerToken}` },
    });
    assert.equal(resAttacker.statusCode, 403);
    assert.match(resAttacker.body.message, /Access denied/);

    // 3. Legitimate owner querying job -> 200 OK
    const resOwner = await request(server, {
      path: `/api/sessions/jobs/evaluation-queue/${job.id}`,
      method: "GET",
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert.equal(resOwner.statusCode, 200);
    assert.equal(resOwner.body.job.id, job.id);

    // 4. Invalid queue name parameter -> 400 Bad Request
    const resInvalidQueue = await request(server, {
      path: `/api/sessions/jobs/non-existent-queue/${job.id}`,
      method: "GET",
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert.equal(resInvalidQueue.statusCode, 400);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("Phase 3: Deep Health Check Exposes Queue Status", async (t) => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));

  try {
    const res = await request(server, { path: "/health", method: "GET" });
    assert.ok([200, 503].includes(res.statusCode));
    assert.ok(res.body.services.queues, "Health response must include queue metrics");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
