const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const jwt = require("jsonwebtoken");

// Set test environment
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_phase2_secret_key_minimum_32_characters_long_123456";

const { app } = require("../server");
const cacheService = require("../services/cacheService");
const sessionStateService = require("../services/sessionStateService");
const { checkRedisHealth, isRedisConnected } = require("../config/redis");
const { TTL } = require("../services/cacheService");

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

test("Phase 2: Redis Client Health & Diagnostic Readiness", async (t) => {
  const health = await checkRedisHealth();
  assert.ok(health, "Health check should return a status object");
  assert.ok(
    ["healthy", "degraded", "disconnected"].includes(health.status),
    `Status must be a recognized state, got: ${health.status}`
  );
});

test("Phase 2: CacheService Cache-Aside (Set, Get, Del)", async (t) => {
  const testKey = "test:user:123";
  const testData = { id: "123", name: "Alice", role: "Software Engineer" };

  // 1. Set key
  await cacheService.set(testKey, testData, 60);

  // 2. Get key
  const retrieved = await cacheService.get(testKey);
  assert.deepEqual(retrieved, testData, "Retrieved data should match original data");

  // 3. Delete key
  await cacheService.del(testKey);
  const afterDelete = await cacheService.get(testKey);
  assert.equal(afterDelete, null, "Deleted key should return null");
});

test("Phase 2: CacheService getOrSet (Cache-Aside Helper)", async (t) => {
  const testKey = "test:computed:data";
  let fetchCallCount = 0;

  const fetchFn = async () => {
    fetchCallCount++;
    return { calculatedValue: 42, timestamp: Date.now() };
  };

  // Initial call: cache miss, triggers fetchFn
  const result1 = await cacheService.getOrSet(testKey, fetchFn, 60);
  assert.equal(fetchCallCount, 1, "fetchFn should be called on cache miss");
  assert.equal(result1.calculatedValue, 42);

  // Second call: cache hit, bypasses fetchFn
  const result2 = await cacheService.getOrSet(testKey, fetchFn, 60);
  assert.equal(fetchCallCount, 1, "fetchFn should NOT be called on cache hit");
  assert.equal(result2.calculatedValue, 42);

  // Clean up
  await cacheService.del(testKey);
});

test("Phase 2: CacheService Invalidate Pattern (SCAN-based)", async (t) => {
  await cacheService.set("test:pattern:item1", { num: 1 }, 60);
  await cacheService.set("test:pattern:item2", { num: 2 }, 60);
  await cacheService.set("test:other:item3", { num: 3 }, 60);

  // Invalidate all test:pattern:*
  await cacheService.invalidatePattern("test:pattern:*");

  assert.equal(await cacheService.get("test:pattern:item1"), null);
  assert.equal(await cacheService.get("test:pattern:item2"), null);

  const untouched = await cacheService.get("test:other:item3");
  assert.ok(untouched, "Untouched key should remain cached");

  await cacheService.del("test:other:item3");
});

test("Phase 2: Cache Metrics and Hit Rate Observability", async (t) => {
  const metrics = cacheService.getMetrics();
  assert.ok(typeof metrics.hits === "number", "metrics.hits should be a number");
  assert.ok(typeof metrics.misses === "number", "metrics.misses should be a number");
  assert.ok(typeof metrics.hitRate === "string", "metrics.hitRate should be formatted as percentage string");
});

test("Phase 2: Session State Service (Init, Update, Interruption, End)", async (t) => {
  const sessionId = "507f1f77bcf86cd799439011";
  const userId = "507f191e810c19729de860ea";

  // 1. Initialize live session state
  const state = await sessionStateService.initSessionState(sessionId, userId, {
    role: "Backend Engineer",
    experience: 4,
  });

  assert.equal(state.sessionId, sessionId);
  assert.equal(state.userId, userId);
  assert.equal(state.currentPhase, "intro");
  assert.equal(state.currentQuestionIndex, 0);
  assert.equal(state.interruptionCount, 0);

  // 2. Update state
  const updated = await sessionStateService.updateSessionState(sessionId, userId, {
    currentQuestionIndex: 1,
    currentPhase: "technical",
    elapsedSeconds: 120,
  });

  assert.equal(updated.currentQuestionIndex, 1);
  assert.equal(updated.currentPhase, "technical");
  assert.equal(updated.elapsedSeconds, 120);

  // 3. Record interruption
  const interrupted = await sessionStateService.recordInterruption(sessionId, userId);
  assert.equal(interrupted.interruptionCount, 1);

  // 4. Retrieve state
  const fetched = await sessionStateService.getSessionState(sessionId, userId);
  assert.equal(fetched.currentQuestionIndex, 1);
  assert.equal(fetched.interruptionCount, 1);

  // 5. End session state
  await sessionStateService.endSessionState(sessionId, userId);
  const afterEnd = await sessionStateService.getSessionState(sessionId, userId);
  assert.equal(afterEnd, null, "Ended session state should return null");
});

test("Phase 2: Security & IDOR Guard on Live Session State", async (t) => {
  const sessionId = "507f1f77bcf86cd799439022";
  const legitOwnerId = "507f191e810c19729de860eb";
  const attackerId = "507f191e810c19729de860ec";

  // Owner initializes session state
  await sessionStateService.initSessionState(sessionId, legitOwnerId);

  // Attacker tries to view owner's session state -> Must throw 403 Forbidden AppError
  await assert.rejects(
    async () => {
      await sessionStateService.getSessionState(sessionId, attackerId);
    },
    {
      statusCode: 403,
      message: /Access denied/,
    },
    "Attacker should receive 403 Access Denied when attempting IDOR access"
  );

  // Attacker tries to update owner's session state -> Must throw 403 Forbidden AppError
  await assert.rejects(
    async () => {
      await sessionStateService.updateSessionState(sessionId, attackerId, { currentQuestionIndex: 99 });
    },
    {
      statusCode: 403,
      message: /Access denied/,
    },
    "Attacker should receive 403 Access Denied on mutation"
  );

  // Clean up
  await sessionStateService.endSessionState(sessionId, legitOwnerId);
});

test("Phase 2: Live Session State HTTP Endpoints Authentication & Validation", async (t) => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));

  try {
    const validSessionId = "507f1f77bcf86cd799439033";

    // 1. Unauthenticated request to /api/sessions/:id/live-state returns 401
    const resNoAuth = await request(server, {
      path: `/api/sessions/${validSessionId}/live-state`,
      method: "GET",
    });
    assert.equal(resNoAuth.statusCode, 401);

    // 2. Invalid session ID param returns 400 validation error
    const testToken = createTestJwt("507f191e810c19729de860ee");
    const resBadId = await request(server, {
      path: `/api/sessions/not-a-valid-object-id/live-state`,
      method: "GET",
      headers: { Authorization: `Bearer ${testToken}` },
    });
    assert.equal(resBadId.statusCode, 400);

    // 3. Put with invalid phase returns 400 validation error
    const resBadBody = await request(
      server,
      {
        path: `/api/sessions/${validSessionId}/live-state`,
        method: "PUT",
        headers: { Authorization: `Bearer ${testToken}` },
      },
      { currentPhase: "invalid_phase_name" }
    );
    assert.equal(resBadBody.statusCode, 400);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("Phase 2: Deep Health Probe Exposing Redis & Cache Services", async (t) => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));

  try {
    const res = await request(server, { path: "/health", method: "GET" });
    assert.ok([200, 503].includes(res.statusCode));
    assert.ok(res.body.services, "Health response should contain services");
    assert.ok(res.body.services.redis, "Health response should report Redis status");
    assert.ok(res.body.services.cache, "Health response should report Cache status & metrics");
    assert.ok(res.body.services.cache.hitRate, "Cache metrics should include hit rate");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
