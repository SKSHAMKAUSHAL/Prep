from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class StartInterviewRequest(BaseModel):
    session_id: str = Field(..., description="Unique interview session ID")
    user_id: str = Field(..., description="User ID of the candidate")
    role: str = Field("Full Stack Engineer", description="Target job title")
    experience: int = Field(3, ge=0, le=40, description="Years of relevant experience")
    topics: List[str] = Field(default_factory=lambda: ["System Design", "Backend Architecture"])
    persona: str = Field("balanced", description="Interviewer persona: strict | friendly | balanced")
    total_questions: int = Field(5, ge=1, le=20, description="Total questions in the session")
    max_duration_seconds: int = Field(600, ge=60, le=7200, description="Maximum session duration in seconds")


class StartInterviewResponse(BaseModel):
    thread_id: str
    greeting_message: str
    first_question: str
    role: str
    persona: str
    current_phase: str
    total_questions: int


class RespondInterviewRequest(BaseModel):
    thread_id: str = Field(..., description="Unique state graph thread ID")
    user_answer: str = Field(..., description="Candidate transcript response")
    gaze_metrics: Optional[Dict[str, Any]] = Field(None, description="Optional behavioral MediaPipe metrics")


class RespondInterviewResponse(BaseModel):
    thread_id: str
    spoken_feedback: str
    next_question: str
    evaluation: Dict[str, Any]
    current_phase: str
    current_question_index: int
    running_avg_score: float
    difficulty_level: str
    is_completed: bool
    final_report: Optional[Dict[str, Any]] = None


class EndInterviewRequest(BaseModel):
    thread_id: str


class EndInterviewResponse(BaseModel):
    thread_id: str
    final_report: Dict[str, Any]
    scores: Dict[str, Any]
    evaluations_count: int


class HealthResponse(BaseModel):
    status: str
    redis_connected: bool
    active_threads: int
    uptime_seconds: float
    rag_status: Optional[Dict[str, Any]] = None


class RAGSearchRequest(BaseModel):
    query: str = Field(..., description="Semantic search query")
    role: Optional[str] = Field(None, description="Target engineering role filter")
    topic: Optional[str] = Field(None, description="Topic category filter")
    limit: int = Field(3, ge=1, le=10, description="Max rubrics to return")


class RAGSearchResponse(BaseModel):
    query: str
    results_count: int
    rubrics: List[Dict[str, Any]]

