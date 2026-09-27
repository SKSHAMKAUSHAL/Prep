const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const http = require("node:http");
const {
  startLangGraphSession,
  executeLangGraphTurn,
  getLangGraphState,
} = require("../services/streamingAIService");

describe("Phase 5: LangGraph Multi-Agent Orchestration Integration", () => {
  let mockServer;
  let mockServerPort;

  before(async () => {
    // Spin up an ephemeral HTTP server to mock the Python LangGraph microservice
    mockServer = http.createServer((req, res) => {
      res.setHeader("Content-Type", "application/json");

      if (req.url === "/api/v1/interview/start" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          const parsed = JSON.parse(body);
          res.writeHead(201);
          res.end(
            JSON.stringify({
              thread_id: `thread_${parsed.session_id}_abc123`,
              greeting_message: "Welcome to your mock interview.",
              first_question: "Explain database normalization.",
              role: parsed.role,
              persona: parsed.persona,
              current_phase: "technical",
              total_questions: parsed.total_questions || 5,
            })
          );
        });
      } else if (req.url === "/api/v1/interview/respond" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          const parsed = JSON.parse(body);
          res.writeHead(200);
          res.end(
            JSON.stringify({
              thread_id: parsed.thread_id,
              spoken_feedback: "Solid understanding of normal forms.",
              next_question: "How do you handle denormalization for read performance?",
              evaluation: {
                technical_score: 85,
                communication_score: 90,
                completeness_score: 80,
                composite_score: 85,
              },
              current_phase: "technical",
              current_question_index: 1,
              running_avg_score: 85.0,
              difficulty_level: "hard",
              is_completed: false,
            })
          );
        });
      } else if (req.url.startsWith("/api/v1/interview/state/") && req.method === "GET") {
        const threadId = req.url.split("/").pop();
        res.writeHead(200);
        res.end(
          JSON.stringify({
            thread_id: threadId,
            current_phase: "technical",
            running_avg_score: 85.0,
          })
        );
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: "Not Found" }));
      }
    });

    await new Promise((resolve) => {
      mockServer.listen(0, "127.0.0.1", () => {
        mockServerPort = mockServer.address().port;
        process.env.LANGGRAPH_SERVICE_URL = `http://127.0.0.1:${mockServerPort}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (mockServer) {
      await new Promise((resolve) => mockServer.close(resolve));
    }
  });

  test("Phase 5: Successfully initiates LangGraph interview session via microservice", async () => {
    const sessionRes = await startLangGraphSession({
      sessionId: "test-sess-001",
      userId: "test-user-001",
      role: "Backend Architect",
      persona: "strict",
      totalQuestions: 4,
    });

    assert.ok(sessionRes, "Expected non-null session response");
    assert.strictEqual(sessionRes.thread_id, "thread_test-sess-001_abc123");
    assert.strictEqual(sessionRes.role, "Backend Architect");
    assert.strictEqual(sessionRes.current_phase, "technical");
    assert.strictEqual(sessionRes.first_question, "Explain database normalization.");
  });

  test("Phase 5: Successfully processes multi-agent response turn through microservice", async () => {
    const turnRes = await executeLangGraphTurn({
      threadId: "thread_test-sess-001_abc123",
      userAnswer: "1NF eliminates duplicates, 2NF removes partial dependencies, and 3NF removes transitive dependencies.",
    });

    assert.ok(turnRes, "Expected non-null turn response");
    assert.strictEqual(turnRes.thread_id, "thread_test-sess-001_abc123");
    assert.strictEqual(turnRes.evaluation.composite_score, 85);
    assert.strictEqual(turnRes.difficulty_level, "hard");
    assert.ok(turnRes.next_question.includes("denormalization"));
  });

  test("Phase 5: Fetches persisted session state for deterministic crash recovery", async () => {
    const state = await getLangGraphState("thread_test-sess-001_abc123");
    assert.ok(state, "Expected state object");
    assert.strictEqual(state.thread_id, "thread_test-sess-001_abc123");
    assert.strictEqual(state.current_phase, "technical");
    assert.strictEqual(state.running_avg_score, 85.0);
  });

  test("Phase 5: Resilient fallback when LangGraph microservice is unreachable", async () => {
    // Point to non-existent port to simulate network failure or microservice crash
    const originalUrl = process.env.LANGGRAPH_SERVICE_URL;
    process.env.LANGGRAPH_SERVICE_URL = "http://127.0.0.1:19999";

    const sessionRes = await startLangGraphSession({
      sessionId: "offline-sess",
      userId: "offline-user",
    });
    assert.strictEqual(sessionRes, null, "Should return null and not throw");

    const turnRes = await executeLangGraphTurn({
      threadId: "thread_offline",
      userAnswer: "Testing offline resilience",
    });
    assert.strictEqual(turnRes, null, "Should return null and not throw");

    process.env.LANGGRAPH_SERVICE_URL = originalUrl;
  });
});
