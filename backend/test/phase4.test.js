const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const WebSocket = require("ws");
const jwt = require("jsonwebtoken");

// Set test environment
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_phase4_secret_key_minimum_32_characters_long_123456";

const { app } = require("../server");
const { initWebSocketServer, closeWebSocketServer } = require("../websocket/wsServer");
const connectionManager = require("../websocket/connectionManager");
const streamingAIService = require("../services/streamingAIService");

const createTestJwt = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

test("Phase 4: Streaming AI Service Token Generation & Interruption", async (t) => {
  const receivedTokens = [];
  const abortController = new AbortController();

  const { fullText, interrupted } = await streamingAIService.streamInterviewResponse({
    question: "What is the difference between TCP and UDP?",
    userAnswer: "TCP is connection-oriented and reliable, while UDP is connectionless and low-latency.",
    persona: "tough",
    signal: abortController.signal,
    onToken: (chunk) => {
      receivedTokens.push(chunk);
    },
  });

  assert.ok(receivedTokens.length > 0, "Should stream at least one token chunk");
  assert.ok(fullText.length > 0, "Full text should be populated");
  assert.equal(interrupted, false, "Should not be interrupted");

  // Test interruption with AbortController
  const abortCtrl = new AbortController();
  abortCtrl.abort(); // Abort immediately

  const interruptedResult = await streamingAIService.streamInterviewResponse({
    question: "What is microservices architecture?",
    userAnswer: "Decomposing apps into small services.",
    signal: abortCtrl.signal,
  });

  assert.equal(interruptedResult.interrupted, true, "Should report interrupted when signal is aborted");
});

test("Phase 4: WebSocket Authentication Guard", async (t) => {
  const server = http.createServer(app);
  initWebSocketServer(server);
  await new Promise((resolve) => server.listen(0, resolve));

  const port = server.address().port;

  try {
    // 1. Connection without token -> Fails with HTTP 401
    await assert.rejects(
      () => {
        return new Promise((resolve, reject) => {
          const ws = new WebSocket(`ws://127.0.0.1:${port}/ws/interview`);
          ws.on("open", () => {
            ws.close();
            resolve();
          });
          ws.on("error", (err) => {
            reject(err);
          });
        });
      },
      /401|Unexpected server response/i,
      "WebSocket connection without token must be rejected"
    );

    // 2. Connection with valid token -> Succeeds
    const token = createTestJwt("507f191e810c19729de860ea");
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws/interview?token=${token}`);

    const readyMessage = await new Promise((resolve, reject) => {
      ws.on("message", (data) => {
        const parsed = JSON.parse(data.toString());
        if (parsed.type === "connection:ready") {
          resolve(parsed);
        }
      });
      ws.on("error", reject);
    });

    assert.equal(readyMessage.type, "connection:ready");
    assert.equal(readyMessage.userId, "507f191e810c19729de860ea");
    assert.ok(readyMessage.connectionId);

    ws.close();
    await new Promise((resolve) => setTimeout(resolve, 50));
  } finally {
    await closeWebSocketServer();
    await new Promise((resolve) => server.close(resolve));
  }
});

test("Phase 4: WebSocket Heartbeat (Ping -> Pong)", async (t) => {
  const server = http.createServer(app);
  initWebSocketServer(server);
  await new Promise((resolve) => server.listen(0, resolve));

  const port = server.address().port;

  try {
    const token = createTestJwt("507f191e810c19729de860eb");
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws/interview?token=${token}`);

    await new Promise((resolve) => ws.on("open", resolve));

    ws.send(JSON.stringify({ type: "ping" }));

    const pong = await new Promise((resolve) => {
      ws.on("message", (data) => {
        const parsed = JSON.parse(data.toString());
        if (parsed.type === "pong") resolve(parsed);
      });
    });

    assert.equal(pong.type, "pong");
    assert.ok(pong.timestamp);

    ws.close();
    await new Promise((resolve) => setTimeout(resolve, 50));
  } finally {
    await closeWebSocketServer();
    await new Promise((resolve) => server.close(resolve));
  }
});

test("Phase 4: Real-Time Token Streaming over WebSocket (transcript:final)", async (t) => {
  const server = http.createServer(app);
  initWebSocketServer(server);
  await new Promise((resolve) => server.listen(0, resolve));

  const port = server.address().port;

  try {
    const token = createTestJwt("507f191e810c19729de860ec");
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws/interview?token=${token}`);

    await new Promise((resolve) => ws.on("open", resolve));

    // Send candidate answer transcript
    ws.send(
      JSON.stringify({
        type: "transcript:final",
        sessionId: "507f1f77bcf86cd799439011",
        question: "Explain database indexing.",
        text: "Indexes use B-Trees to enable logarithmic lookup times.",
        persona: "balanced",
      })
    );

    const receivedChunks = [];
    let receivedStart = false;
    let receivedEnd = false;

    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Timeout waiting for stream")), 3000);

      ws.on("message", (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === "ai:response:start") {
          receivedStart = true;
        } else if (msg.type === "ai:response:chunk") {
          receivedChunks.push(msg.text);
        } else if (msg.type === "ai:response:end") {
          receivedEnd = true;
          clearTimeout(timer);
          resolve();
        }
      });
    });

    assert.equal(receivedStart, true, "Should receive ai:response:start");
    assert.ok(receivedChunks.length > 0, "Should receive token chunks");
    assert.equal(receivedEnd, true, "Should receive ai:response:end");

    ws.close();
    await new Promise((resolve) => setTimeout(resolve, 50));
  } finally {
    await closeWebSocketServer();
    await new Promise((resolve) => server.close(resolve));
  }
});

test("Phase 4: Barge-In Interruption Handling over WebSocket", async (t) => {
  const server = http.createServer(app);
  initWebSocketServer(server);
  await new Promise((resolve) => server.listen(0, resolve));

  const port = server.address().port;

  try {
    const token = createTestJwt("507f191e810c19729de860ed");
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws/interview?token=${token}`);

    await new Promise((resolve) => ws.on("open", resolve));

    // Start streaming
    ws.send(
      JSON.stringify({
        type: "transcript:final",
        sessionId: "507f1f77bcf86cd799439011",
        question: "How does garbage collection work in Node.js?",
        text: "V8 uses generational garbage collection with Scavenge and Mark-Sweep.",
      })
    );

    // Wait for start of response
    await new Promise((resolve) => {
      const onMsg = (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === "ai:response:start" || msg.type === "ai:response:chunk") {
          ws.off("message", onMsg);
          resolve();
        }
      };
      ws.on("message", onMsg);
    });

    // Send interruption (candidate starts speaking again)
    ws.send(
      JSON.stringify({
        type: "interruption",
        sessionId: "507f1f77bcf86cd799439011",
      })
    );

    const interruptedMessage = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Timeout waiting for interruption confirmation")), 2000);
      ws.on("message", (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === "ai:response:interrupted") {
          clearTimeout(timer);
          resolve(msg);
        }
      });
    });

    assert.equal(interruptedMessage.type, "ai:response:interrupted");

    ws.close();
    await new Promise((resolve) => setTimeout(resolve, 50));
  } finally {
    await closeWebSocketServer();
    await new Promise((resolve) => server.close(resolve));
  }
});

test("Phase 4: Connection Limits and Health Observability", async (t) => {
  const stats = connectionManager.getStats();
  assert.ok(stats.totalConnections !== undefined);
  assert.ok(stats.activeUsers !== undefined);
  assert.ok(stats.activeSessions !== undefined);
});
