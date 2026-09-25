const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const http = require("node:http");
const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const connectionManager = require("../websocket/connectionManager");
const { initWebSocketServer, closeWebSocketServer } = require("../websocket/wsServer");

describe("Phase 8: Browser-Native Behavioral Analysis via Computer Vision (MediaPipe)", () => {
  let server;
  let port;
  let validToken;
  const testUserId = "507f191e810c19729de860ee";
  const testSessionId = "507f1f77bcf86cd799439099";

  before(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test-super-secret-jwt-key-256";
    validToken = jwt.sign({ id: testUserId }, process.env.JWT_SECRET, { expiresIn: "1h" });

    server = http.createServer();
    initWebSocketServer(server);

    await new Promise((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        port = server.address().port;
        resolve();
      });
    });
  });

  after(async () => {
    await closeWebSocketServer();
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test("Phase 8: ConnectionManager records and aggregates real-time gaze telemetry", () => {
    const sessionId = "sample-sess-gaze-001";
    const userId = "sample-user-001";

    // Feed focused gaze samples
    for (let i = 0; i < 10; i++) {
      connectionManager.recordGazeTelemetry(userId, sessionId, {
        gazeDirection: "center",
        eyeContactScore: 0.95,
        isLookingAway: false,
        pitch: 0,
        yaw: 0,
      });
    }

    const analytics = connectionManager.getGazeAnalytics(sessionId);
    assert.strictEqual(analytics.sampleCount, 10);
    assert.strictEqual(analytics.engagementLevel, "Optimal");
    assert.strictEqual(analytics.distractionEventCount, 0);
    assert.ok(analytics.averageEyeContact >= 0.9);
  });

  test("Phase 8: ConnectionManager detects visual distraction and computes center ratio", () => {
    const sessionId = "sample-sess-distracted-002";
    const userId = "sample-user-002";

    // Feed distraction samples
    for (let i = 0; i < 20; i++) {
      connectionManager.recordGazeTelemetry(userId, sessionId, {
        gazeDirection: i % 2 === 0 ? "right" : "left",
        eyeContactScore: 0.40,
        isLookingAway: true,
        pitch: 12,
        yaw: 25,
      });
    }

    const analytics = connectionManager.getGazeAnalytics(sessionId);
    assert.strictEqual(analytics.sampleCount, 20);
    assert.strictEqual(analytics.engagementLevel, "Distracted");
    assert.strictEqual(analytics.distractionEventCount, 20);
    assert.ok(analytics.averageEyeContact < 0.6);
  });

  test("Phase 8: Streaming WebSocket receives gaze telemetry and emits distraction alerts", async () => {
    const wsUrl = `ws://127.0.0.1:${port}/ws/interview?token=${validToken}&sessionId=${testSessionId}`;
    const ws = new WebSocket(wsUrl);

    await new Promise((resolve) => ws.once("open", resolve));

    let alertReceived = false;

    ws.on("message", (raw) => {
      const msg = JSON.parse(raw.toString());
      if (msg.type === "gaze:alert" && msg.status === "distraction_detected") {
        alertReceived = true;
      }
    });

    // 1. Send normal telemetry
    ws.send(
      JSON.stringify({
        type: "gaze:telemetry",
        sessionId: testSessionId,
        gazeDirection: "center",
        eyeContactScore: 0.96,
        isLookingAway: false,
      })
    );

    // 2. Send looking away distraction telemetry (should trigger immediate alert)
    ws.send(
      JSON.stringify({
        type: "gaze:telemetry",
        sessionId: testSessionId,
        gazeDirection: "away",
        eyeContactScore: 0.35,
        isLookingAway: true,
      })
    );

    await new Promise((resolve) => setTimeout(resolve, 150));
    assert.strictEqual(alertReceived, true, "Expected distraction alert message over WebSocket");

    // 3. Query gaze telemetry summary
    const queryPromise = new Promise((resolve) => {
      const listener = (raw) => {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "gaze:metrics") {
          ws.removeListener("message", listener);
          resolve(msg.data);
        }
      };
      ws.on("message", listener);
    });

    ws.send(JSON.stringify({ type: "gaze:query", sessionId: testSessionId }));
    const summary = await queryPromise;

    assert.ok(summary, "Expected gaze metrics response");
    assert.ok(summary.sampleCount >= 2);

    ws.close();
  });
});
