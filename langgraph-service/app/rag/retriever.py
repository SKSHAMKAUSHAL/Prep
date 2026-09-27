from typing import List, Dict, Any, Optional
from app.rag.qdrant_client import QdrantRAGService


class RAGRetriever:
    """
    RAG Retriever for System Design & Architecture Mock Interviews.
    Retrieves dynamic scoring rubrics, benchmark patterns, and ideal points.
    """

    @staticmethod
    def retrieve(
        query: str,
        role: Optional[str] = None,
        topic: Optional[str] = None,
        limit: int = 2,
    ) -> List[Dict[str, Any]]:
        return QdrantRAGService.search(
            query=query,
            role=role,
            topic=topic,
            limit=limit,
        )

    @staticmethod
    def format_rubric_context(rubrics: List[Dict[str, Any]]) -> str:
        """
        Formats retrieved rubrics for LLM system prompt injection.
        """
        if not rubrics:
            return ""

        context_lines = ["\n[RETRIEVED PROPRIETARY SYSTEM DESIGN EVALUATION RUBRICS]:"]
        for i, r in enumerate(rubrics, 1):
            context_lines.append(f"Rubric {i}: {r['title']} (Topic: {r['topic']}, Difficulty: {r['difficulty'].upper()})")
            context_lines.append(f"  Summary: {r['content']}")
            if r.get("ideal_points"):
                context_lines.append("  Key Criteria to verify in answer:")
                for pt in r["ideal_points"][:3]:
                    context_lines.append(f"    - {pt}")
            if r.get("common_pitfalls"):
                context_lines.append("  Common Pitfalls to penalize:")
                for pf in r["common_pitfalls"][:2]:
                    context_lines.append(f"    - {pf}")
        context_lines.append("")
        return "\n".join(context_lines)
