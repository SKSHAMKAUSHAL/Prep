"""
Proprietary System Design Architectural Knowledge Base & Scoring Rubrics.
Used for dynamic RAG retrieval to evaluate candidate system design responses.
"""

from typing import List, Dict, Any

SYSTEM_DESIGN_RUBRICS: List[Dict[str, Any]] = [
    {
        "id": "rubric-caching-001",
        "title": "Distributed Caching & Redis Cache-Aside Pattern",
        "topic": "Caching",
        "difficulty": "intermediate",
        "target_roles": ["Backend Engineer", "Full Stack Engineer", "System Architect"],
        "content": (
            "Cache-aside pattern offloads primary database read pressure by storing hot data structures in Redis in-memory RAM. "
            "Mitigates cache stampede/thundering herd using mutex locks or probabilistic early expiration. "
            "Addresses cache penetration via bloom filters and cache breakdown via distributed locks. "
            "Key SLA metrics: sub-millisecond p99 latency, TTL eviction policies (allkeys-lru), and 90%+ cache hit ratio."
        ),
        "ideal_points": [
            "Explain Cache-Aside (Lazy Loading) vs Write-Through / Write-Behind topologies",
            "Discuss Cache Invalidation challenges and TTL (Time-To-Live) strategies",
            "Mitigate Cache Stampede / Thundering Herd with Bloom filters or probabilistic early expiration (XFetch)",
            "Select appropriate Redis eviction policies (e.g. volatile-lru, allkeys-lru)"
        ],
        "common_pitfalls": [
            "Omitting cache invalidation during database mutation writes",
            "Failing to handle database down/failover when cache misses occur",
            "Not sizing Redis memory or configuring eviction policies"
        ]
    },
    {
        "id": "rubric-sharding-002",
        "title": "Database Sharding, Partitioning & Consistent Hashing",
        "topic": "Databases",
        "difficulty": "advanced",
        "target_roles": ["Backend Architect", "Distributed Systems Engineer", "System Architect"],
        "content": (
            "Horizontal partitioning distributes data rows across multiple independent physical database nodes. "
            "Consistent hashing with virtual nodes ensures uniform key distribution across hash rings and minimizes rebalancing when nodes join or leave. "
            "Mitigates hot-spot partitions (celebrity problem) through salted partition keys. "
            "Handles cross-shard transactions using two-phase commit (2PC) or Saga orchestrations."
        ),
        "ideal_points": [
            "Describe horizontal sharding strategies: Range-based, Hash-based, and Directory-based partitioning",
            "Implement Consistent Hashing with virtual vnodes to prevent non-uniform distribution",
            "Handle hot-shard mitigation via key salting (e.g., prefixing tenant or entity IDs)",
            "Analyze cross-shard query latency penalties and distributed transaction trade-offs (Saga vs 2PC)"
        ],
        "common_pitfalls": [
            "Assuming auto-sharding has zero query latency overhead",
            "Overlooking distributed JOIN performance degradation across physical boundaries",
            "Failing to discuss schema migrations and shard rebalancing under live traffic"
        ]
    },
    {
        "id": "rubric-ratelimit-003",
        "title": "Distributed Rate Limiting & Denial-of-Service Defense",
        "topic": "Security",
        "difficulty": "intermediate",
        "target_roles": ["API Engineer", "Backend Engineer", "Platform Engineer"],
        "content": (
            "Protects microservice APIs from rogue scrapers, volumetric attacks, and cascaded cascading failures. "
            "Compares Token Bucket, Leaky Bucket, Fixed Window Counter, and Sliding Window Log/Counter algorithms. "
            "Implements sliding window counters in Redis using sorted sets (ZADD/ZREMRANGEBYSCORE) or atomic Lua scripts. "
            "Standardizes response headers: X-RateLimit-Limit, X-RateLimit-Remaining, and Retry-After with HTTP 429 status code."
        ),
        "ideal_points": [
            "Differentiate between Token Bucket (allows bursts) and Leaky Bucket (smooth egress rate)",
            "Implement atomic distributed sliding window counters in Redis via Lua scripts to avoid race conditions",
            "Return standardized RFC 6585 headers: X-RateLimit-Remaining and Retry-After",
            "Enforce tiered rate limiting: IP-based, authenticated User ID, and API Key tiering"
        ],
        "common_pitfalls": [
            "Using naive GET and INCR operations in Redis without Lua atomicity, introducing race conditions",
            "Applying global rate limits that block high-priority system webhooks alongside untrusted users",
            "Ignoring localized memory consumption of Sliding Window Log under high request volumes"
        ]
    },
    {
        "id": "rubric-consensus-004",
        "title": "Consensus Protocols, Raft/Paxos & High Availability",
        "topic": "Distributed Systems",
        "difficulty": "staff",
        "target_roles": ["Staff Engineer", "Distributed Systems Engineer", "Principal Architect"],
        "content": (
            "Maintains a replicated state machine across untrusted or partition-prone network clusters. "
            "Raft breaks consensus into leader election, log replication, and safety invariants. "
            "Evaluates quorum requirements (N/2 + 1) to prevent split-brain anomalies during network partitions. "
            "Analyzes CAP theorem trade-offs and PACELC latency models (e.g., CP systems like Etcd/ZooKeeper vs AP systems like Cassandra/DynamoDB)."
        ),
        "ideal_points": [
            "Explain Raft terms: Heartbeats, Term elections, Log replication, and Commit indexes",
            "Analyze Quorum requirements (floor(N/2) + 1) to prevent split-brain during network partition",
            "Differentiate PACELC theorem trade-offs: Latency vs Consistency during normal operations",
            "Explain write-ahead logs (WAL) and snapshotting for crash recovery"
        ],
        "common_pitfalls": [
            "Confusing high availability (AP) with strong linearizable consistency (CP)",
            "Failing to explain how stale reads are prevented on partitioned former leaders",
            "Assuming consensus protocols can scale writes horizontally across unbounded nodes"
        ]
    },
    {
        "id": "rubric-messaging-005",
        "title": "Asynchronous Message Queues & Event-Driven Topologies",
        "topic": "Architecture",
        "difficulty": "intermediate",
        "target_roles": ["Backend Engineer", "Platform Engineer", "Full Stack Engineer"],
        "content": (
            "Decouples long-running computational workloads from the synchronous HTTP request-response cycle using BullMQ/Redis or Apache Kafka. "
            "Guarantees at-least-once or exactly-once message delivery semantics with idempotent consumer keys. "
            "Implements Dead Letter Queues (DLQ) with exponential backoff and jitter to prevent retry storms. "
            "Monitors queue lag, consumer group offsets, and backpressure under bursty ingestion."
        ),
        "ideal_points": [
            "Decouple synchronous HTTP request thread using message broker (BullMQ / RabbitMQ / Kafka)",
            "Implement idempotent consumer handlers using idempotency keys or database unique constraints",
            "Configure Dead Letter Queues (DLQ) with exponential backoff and randomized jitter",
            "Manage consumer backpressure and autoscaling consumer pools based on queue depth metrics"
        ],
        "common_pitfalls": [
            "Assuming message delivery is strictly exactly-once without consumer idempotency",
            "Retrying immediately upon failure, creating thundering herds and cascading database crashes",
            "Not monitoring consumer lag, allowing backlogged queues to exhaust broker disk or memory"
        ]
    },
    {
        "id": "rubric-streaming-006",
        "title": "Ultra-Low Latency Conversational Transports: WebRTC vs WebSockets",
        "topic": "Networking",
        "difficulty": "advanced",
        "target_roles": ["Voice AI Engineer", "Real-Time Systems Architect", "Full Stack Engineer"],
        "content": (
            "Standardizes media transports for real-time human-agent conversational AI under 500ms latency budgets. "
            "TCP-based WebSockets suffer from head-of-line blocking during packet loss and aggressive window throttling. "
            "WebRTC operates over UDP/RTP with adaptive jitter buffering, acoustic echo cancellation (AEC), and packet drop tolerance. "
            "Integrates LiveKit SFU infrastructure with ICE Trickle signaling (100-400ms connection establishment) and barge-in interruption detection."
        ),
        "ideal_points": [
            "Analyze TCP Head-of-Line blocking vs UDP packet loss tolerance in real-time voice streaming",
            "Detail WebRTC browser stack features: Acoustic Echo Cancellation (AEC) and Adaptive Jitter Buffers",
            "Explain Selective Forwarding Units (SFU) vs Peer-to-Peer mesh for scalable multi-client media routing",
            "Implement candidate barge-in interruption handling via immediate client buffer cancellation and context truncation"
        ],
        "common_pitfalls": [
            "Using TCP WebSockets for raw PCM audio streaming under high-latency network conditions",
            "Waiting for full candidate gathering before signaling instead of using ICE Trickle",
            "Failing to truncate unplayed assistant audio from the LLM context window after an interruption"
        ]
    },
    {
        "id": "rubric-resiliency-007",
        "title": "Microservices Resiliency: Circuit Breakers & Graceful Degradation",
        "topic": "Resilience",
        "difficulty": "intermediate",
        "target_roles": ["Site Reliability Engineer", "Platform Engineer", "System Architect"],
        "content": (
            "Prevents cascading microservice failures during upstream outages or degraded dependency performance. "
            "Circuit Breaker state machine transitions across CLOSED (healthy), OPEN (failing fast), and HALF-OPEN (probing recovery). "
            "Enforces strict downstream request timeouts, concurrency bulkheads, and cached fallback responses. "
            "Emits health telemetry and synthetic canary pings to automatically trigger self-healing."
        ),
        "ideal_points": [
            "Define Circuit Breaker states: CLOSED, OPEN (fail-fast), and HALF-OPEN (trial recovery)",
            "Implement Bulkhead pattern to isolate thread and connection pools between downstream services",
            "Configure aggressive connection and read timeouts to prevent thread starvation",
            "Provide degraded graceful fallbacks (e.g., serving cached stale data or default offline responses)"
        ],
        "common_pitfalls": [
            "Setting timeouts too long (e.g. 30s), causing connection pools to exhaust under slow dependencies",
            "Not resetting circuit breakers gradually, resulting in immediate re-tripping by thundering herds",
            "Failing to log and alert on state transitions to SRE observability dashboards"
        ]
    }
]
