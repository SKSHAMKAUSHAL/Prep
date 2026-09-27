const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const http = require("node:http");
const ragService = require("../services/ragService");
const cacheService = require("../services/cacheService");

describe("Phase 6: Retrieval-Augmented Generation (RAG) & Vector Database Integration", () => {
  let mockQdrantServer;
  let mockPort;

  before(async () => {
    // Spin up an ephemeral HTTP server to mock Qdrant / LangGraph RAG service
    mockQdrantServer = http.createServer((req, res) => {
      res.setHeader("Content-Type", "application/json");

      if (req.url === "/api/v1/rag/search" && req.method === "POST") {
        let body = "";
        req.on("data", (c) => (body += c));
        req.on("end", () => {
          const parsed = JSON.parse(body);
          res.writeHead(200);
          res.end(
            JSON.stringify({
              query: parsed.query,
              results_count: 2,
              rubrics: [
                {
                  id: "rubric-caching-001",
                  title: "Distributed Caching & Redis Cache-Aside Pattern",
                  topic: "Caching",
                  difficulty: "intermediate",
                  similarity_score: 0.892,
                  ideal_points: [
                    "Explain Cache-Aside (Lazy Loading) vs Write-Through / Write-Behind",
                    "Discuss Cache Invalidation challenges and TTL strategies",
                  ],
                  common_pitfalls: ["Omitting cache invalidation during database mutation writes"],
                },
                {
                  id: "rubric-sharding-002",
                  title: "Database Sharding, Partitioning & Consistent Hashing",
                  topic: "Databases",
                  difficulty: "advanced",
                  similarity_score: 0.741,
                  ideal_points: [
                    "Describe horizontal sharding strategies",
                    "Implement Consistent Hashing with virtual vnodes",
                  ],
                },
              ],
            })
          );
        });
      } else if (req.url === "/api/v1/rag/status" && req.method === "GET") {
        res.writeHead(200);
        res.end(
          JSON.stringify({
            qdrant_connected: true,
            collection_name: "system_design_rubrics",
            vector_dimension: 128,
            total_rubrics_indexed: 7,
            engine_mode: "Qdrant Distributed HNSW",
          })
        );
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: "Not Found" }));
      }
    });

    await new Promise((resolve) => {
      mockQdrantServer.listen(0, "127.0.0.1", () => {
        mockPort = mockQdrantServer.address().port;
        process.env.LANGGRAPH_SERVICE_URL = `http://127.0.0.1:${mockPort}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (mockQdrantServer) {
      await new Promise((resolve) => mockQdrantServer.close(resolve));
    }
  });

  test("Phase 6: Successfully performs vector search for system design rubrics", async () => {
    const res = await ragService.searchRubrics({
      query: "How do we scale database reads with Redis?",
      topic: "Caching",
      limit: 2,
    });

    assert.ok(res, "Expected search result");
    assert.strictEqual(res.results_count, 2);
    assert.strictEqual(res.rubrics[0].id, "rubric-caching-001");
    assert.ok(res.rubrics[0].title.includes("Caching"));
    assert.ok(res.rubrics[0].ideal_points.length > 0);
  });

  test("Phase 6: Verifies Redis Cache-Aside caching on repeated RAG queries", async () => {
    const startTime = Date.now();
    // Second query with identical parameters should hit Redis cache
    const cachedRes = await ragService.searchRubrics({
      query: "How do we scale database reads with Redis?",
      topic: "Caching",
      limit: 2,
    });
    const duration = Date.now() - startTime;

    assert.ok(cachedRes, "Expected cached result");
    assert.strictEqual(cachedRes.results_count, 2);
    // Cached response should resolve virtually instantly (< 50ms)
    assert.ok(duration < 50, `Expected cached query to resolve in <50ms, took ${duration}ms`);
  });

  test("Phase 6: Retrieves RAG vector database status and telemetry", async () => {
    const status = await ragService.getRAGStatus();
    assert.ok(status);
    assert.strictEqual(status.qdrant_connected, true);
    assert.strictEqual(status.collection_name, "system_design_rubrics");
    assert.strictEqual(status.vector_dimension, 128);
    assert.strictEqual(status.total_rubrics_indexed, 7);
  });

  test("Phase 6: Resilient local fallback when Qdrant/LangGraph microservice is unreachable", async () => {
    const originalUrl = process.env.LANGGRAPH_SERVICE_URL;
    process.env.LANGGRAPH_SERVICE_URL = "http://127.0.0.1:19998";

    // Query with non-cached phrase
    const res = await ragService.searchRubrics({
      query: "Rate limiting token bucket algorithm",
      limit: 1,
    });

    assert.ok(res, "Expected resilient fallback result");
    assert.ok(res.rubrics.length >= 1);
    assert.strictEqual(res.source, "resilient_fallback_tier");

    process.env.LANGGRAPH_SERVICE_URL = originalUrl;
  });
});
