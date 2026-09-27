import time
import logging
from fastapi import APIRouter, HTTPException, status
from app.api.schemas import (
    StartInterviewRequest,
    StartInterviewResponse,
    RespondInterviewRequest,
    RespondInterviewResponse,
    EndInterviewRequest,
    EndInterviewResponse,
    HealthResponse,
    RAGSearchRequest,
    RAGSearchResponse,
)
from app.graph.graph import InterviewOrchestrator
from app.graph.checkpointer import RedisCheckpointer
from app.rag.qdrant_client import QdrantRAGService

logger = logging.getLogger("langgraph.routes")
router = APIRouter()
_app_start_time = time.time()


@router.post(
    "/api/v1/interview/start",
    response_model=StartInterviewResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Initialize a multi-agent interview state machine",
)
async def start_interview(request: StartInterviewRequest):
    try:
        result = InterviewOrchestrator.start_session(
            session_id=request.session_id,
            user_id=request.user_id,
            role=request.role,
            experience=request.experience,
            topics=request.topics,
            persona=request.persona,
            total_questions=request.total_questions,
            max_duration_seconds=request.max_duration_seconds,
        )
        return result
    except Exception as e:
        logger.error(f"Error starting interview session: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize interview state machine: {str(e)}",
        )


@router.post(
    "/api/v1/interview/respond",
    response_model=RespondInterviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Process candidate response through Evaluator, Moderator, and Interviewer agents",
)
async def respond_to_question(request: RespondInterviewRequest):
    try:
        result = InterviewOrchestrator.process_response(
            thread_id=request.thread_id,
            user_answer=request.user_answer,
            gaze_metrics=request.gaze_metrics,
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        logger.error(f"Error processing response turn in thread {request.thread_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent orchestration failed: {str(e)}",
        )


@router.post(
    "/api/v1/interview/end",
    response_model=EndInterviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Manually or automatically conclude interview session and generate final report",
)
async def end_interview(request: EndInterviewRequest):
    try:
        result = InterviewOrchestrator.end_session(thread_id=request.thread_id)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        logger.error(f"Error ending interview in thread {request.thread_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to conclude interview session: {str(e)}",
        )


@router.get(
    "/api/v1/interview/state/{thread_id}",
    summary="Fetch current state of interview for deterministic crash recovery",
)
async def get_state(thread_id: str):
    state = InterviewOrchestrator.get_session_state(thread_id)
    if not state:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No state found for thread '{thread_id}'",
        )
    return state


@router.post(
    "/api/v1/rag/search",
    response_model=RAGSearchResponse,
    summary="Semantic vector search across system design rubrics with HNSW indexing",
)
async def search_rag(request: RAGSearchRequest):
    results = QdrantRAGService.search(
        query=request.query,
        role=request.role,
        topic=request.topic,
        limit=request.limit,
    )
    return {
        "query": request.query,
        "results_count": len(results),
        "rubrics": results,
    }


@router.get(
    "/api/v1/rag/status",
    summary="Observability status for Qdrant vector database and RAG collection",
)
async def get_rag_status():
    return QdrantRAGService.get_status()


@router.post(
    "/api/v1/rag/seed",
    summary="Seed or re-index system design architectural rubrics into Qdrant",
)
async def seed_rag():
    QdrantRAGService.initialize()
    seeded = QdrantRAGService.seed_qdrant_points()
    return {
        "success": True,
        "qdrant_seeded": seeded,
        "total_rubrics": len(QdrantRAGService._in_memory_index),
    }


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Service health and readiness probe",
)
async def health_check():
    return {
        "status": "UP",
        "redis_connected": RedisCheckpointer.is_connected(),
        "active_threads": RedisCheckpointer.get_active_threads_count(),
        "uptime_seconds": round(time.time() - _app_start_time, 2),
        "rag_status": QdrantRAGService.get_status(),
    }

