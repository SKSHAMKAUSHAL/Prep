const logger = require("../utils/logger");
const cacheService = require("./cacheService");

const getLangGraphServiceUrl = () => process.env.LANGGRAPH_SERVICE_URL || "http://localhost:8001";

// Curated fallback rubrics for Node.js tier resilience
const FALLBACK_RUBRICS = [
  {
    id: "rubric-caching-001",
    title: "Distributed Caching & Redis Cache-Aside Pattern",
    topic: "Caching",
    difficulty: "intermediate",
    ideal_points: [
      "Explain Cache-Aside (Lazy Loading) vs Write-Through / Write-Behind topologies",
      "Discuss Cache Invalidation challenges and TTL (Time-To-Live) strategies",
      "Mitigate Cache Stampede / Thundering Herd with Bloom filters or probabilistic early expiration (XFetch)",
      "Select appropriate Redis eviction policies (e.g. volatile-lru, allkeys-lru)",
    ],
    common_pitfalls: [
      "Omitting cache invalidation during database mutation writes",
      "Failing to handle database down/failover when cache misses occur",
    ],
  },
  {
    id: "rubric-sharding-002",
    title: "Database Sharding, Partitioning & Consistent Hashing",
    topic: "Databases",
    difficulty: "advanced",
    ideal_points: [
      "Describe horizontal sharding strategies: Range-based, Hash-based, and Directory-based partitioning",
      "Implement Consistent Hashing with virtual vnodes to prevent non-uniform distribution",
      "Handle hot-shard mitigation via key salting",
    ],
    common_pitfalls: [
      "Assuming auto-sharding has zero query latency overhead",
      "Overlooking distributed JOIN performance degradation across physical boundaries",
    ],
  },
  {
    id: "rubric-ratelimit-003",
    title: "Distributed Rate Limiting & Denial-of-Service Defense",
    topic: "Security",
    difficulty: "intermediate",
    ideal_points: [
      "Differentiate between Token Bucket and Leaky Bucket",
      "Implement atomic distributed sliding window counters in Redis via Lua scripts",
      "Return standardized RFC 6585 headers: X-RateLimit-Remaining and Retry-After",
    ],
    common_pitfalls: [
      "Using non-atomic GET and INCR operations in Redis, creating race conditions",
    ],
  },
  {
    id: "rubric-consensus-004",
    title: "Consensus Protocols, Raft/Paxos & High Availability",
    topic: "Distributed Systems",
    difficulty: "staff",
    ideal_points: [
      "Explain Raft terms: Heartbeats, Term elections, Log replication, and Commit indexes",
      "Analyze Quorum requirements (floor(N/2) + 1) to prevent split-brain during network partition",
      "Differentiate PACELC theorem trade-offs: Latency vs Consistency during normal operations",
    ],
    common_pitfalls: [
      "Confusing high availability (AP) with strong linearizable consistency (CP)",
    ],
  },
  {
    id: "rubric-messaging-005",
    title: "Asynchronous Message Queues & Event-Driven Topologies",
    topic: "Architecture",
    difficulty: "intermediate",
    ideal_points: [
      "Decouple synchronous HTTP request thread using message broker (BullMQ / RabbitMQ / Kafka)",
      "Implement idempotent consumer handlers using idempotency keys",
      "Configure Dead Letter Queues (DLQ) with exponential backoff and randomized jitter",
    ],
    common_pitfalls: [
      "Assuming message delivery is strictly exactly-once without consumer idempotency",
    ],
  },
  {
    id: "rubric-streaming-006",
    title: "Ultra-Low Latency Conversational Transports: WebRTC vs WebSockets",
    topic: "Networking",
    difficulty: "advanced",
    ideal_points: [
      "Analyze TCP Head-of-Line blocking vs UDP packet loss tolerance in real-time voice streaming",
      "Detail WebRTC browser stack features: Acoustic Echo Cancellation (AEC) and Adaptive Jitter Buffers",
      "Implement candidate barge-in interruption handling via immediate client buffer cancellation",
    ],
    common_pitfalls: [
      "Using TCP WebSockets for raw PCM audio streaming under high-latency network conditions",
    ],
  },
];

/**
 * Searches system design scoring rubrics with Redis caching and microservice integration
 */
const searchRubrics = async ({ query, role, topic, limit = 3 }) => {
  const cacheKey = `rag:search:${Buffer.from(`${query || ""}_${role || ""}_${topic || ""}_${limit}`).toString("base64")}`;

  // 1. Check Redis Cache
  const cached = await cacheService.get(cacheKey);
  if (cached) {
    logger.debug({ cacheKey }, "RAG search cache hit");
    return cached;
  }

  // 2. Query LangGraph Python Microservice Qdrant Vector Engine
  try {
    const res = await fetch(`${getLangGraphServiceUrl()}/api/v1/rag/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, role, topic, limit }),
    });

    if (res.ok) {
      const data = await res.json();
      // Cache in Redis for 1 hour (3600 seconds)
      await cacheService.set(cacheKey, data, 3600);
      return data;
    }
  } catch (err) {
    logger.warn({ error: err.message }, "LangGraph RAG service unreachable, falling back to local rubrics");
  }

  // 3. Fallback: Local Semantic Match
  const qLower = (query || "").toLowerCase();
  const matched = FALLBACK_RUBRICS.filter((r) => {
    if (topic && r.topic.toLowerCase() !== topic.toLowerCase()) return false;
    return (
      r.title.toLowerCase().includes(qLower) ||
      r.topic.toLowerCase().includes(qLower) ||
      qLower.split(" ").some((w) => w.length > 3 && r.title.toLowerCase().includes(w))
    );
  });

  const results = (matched.length > 0 ? matched : FALLBACK_RUBRICS).slice(0, limit);
  const response = {
    query,
    results_count: results.length,
    rubrics: results,
    source: "resilient_fallback_tier",
  };

  await cacheService.set(cacheKey, response, 1800);
  return response;
};

/**
 * Gets Qdrant / RAG observability metrics
 */
const getRAGStatus = async () => {
  try {
    const res = await fetch(`${getLangGraphServiceUrl()}/api/v1/rag/status`);
    if (res.ok) return await res.json();
  } catch (e) {
    // Service offline
  }

  return {
    qdrant_connected: false,
    collection_name: "system_design_rubrics",
    vector_dimension: 128,
    total_rubrics_indexed: FALLBACK_RUBRICS.length,
    engine_mode: "Local Node.js In-Memory Resilient Tier",
  };
};

module.exports = {
  searchRubrics,
  getRAGStatus,
  FALLBACK_RUBRICS,
};
