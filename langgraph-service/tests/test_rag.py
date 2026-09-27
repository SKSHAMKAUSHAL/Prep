import pytest
from starlette.testclient import TestClient
from app.main import app
from app.rag.qdrant_client import QdrantRAGService
from app.rag.retriever import RAGRetriever
from app.rag.vector_math import generate_embedding, cosine_similarity

client = TestClient(app)


def test_vector_embedding_generation_and_cosine_similarity():
    vec1 = generate_embedding("Distributed Caching with Redis and Memcached", dim=128)
    vec2 = generate_embedding("Redis in-memory caching and cache-aside patterns", dim=128)
    vec3 = generate_embedding("CSS grid flexbox frontend styling layout", dim=128)

    assert len(vec1) == 128
    assert len(vec2) == 128
    assert len(vec3) == 128

    sim_related = cosine_similarity(vec1, vec2)
    sim_unrelated = cosine_similarity(vec1, vec3)

    assert sim_related > sim_unrelated
    assert sim_related > 0.15


def test_qdrant_service_search_and_payload_filter():
    results = QdrantRAGService.search(
        query="How do we scale database reads using cache?",
        topic="Caching",
        limit=2,
    )

    assert len(results) > 0
    top = results[0]
    assert top["topic"] == "Caching"
    assert "Redis" in top["title"] or "Caching" in top["title"]
    assert top["similarity_score"] > 0
    assert len(top["ideal_points"]) > 0


def test_rag_retriever_formatting():
    rubrics = RAGRetriever.retrieve(query="WebRTC UDP real-time voice latency", limit=1)
    assert len(rubrics) >= 1
    formatted = RAGRetriever.format_rubric_context(rubrics)
    assert "RETRIEVED PROPRIETARY SYSTEM DESIGN EVALUATION RUBRICS" in formatted
    assert "WebRTC" in formatted or "Streaming" in formatted


def test_rag_fastapi_rest_endpoints():
    # 1. GET /api/v1/rag/status
    status_res = client.get("/api/v1/rag/status")
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert "collection_name" in status_data
    assert "total_rubrics_indexed" in status_data
    assert status_data["total_rubrics_indexed"] >= 7

    # 2. POST /api/v1/rag/search
    search_res = client.post(
        "/api/v1/rag/search",
        json={
            "query": "Raft consensus leader election quorum network partition",
            "topic": "Distributed Systems",
            "limit": 2,
        },
    )
    assert search_res.status_code == 200
    search_data = search_res.json()
    assert search_data["results_count"] > 0
    assert any("Consensus" in r["title"] or "Raft" in r["title"] for r in search_data["rubrics"])

    # 3. POST /api/v1/rag/seed
    seed_res = client.post("/api/v1/rag/seed")
    assert seed_res.status_code == 200
    assert seed_res.json()["success"] is True
