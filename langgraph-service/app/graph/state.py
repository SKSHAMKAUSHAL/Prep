from typing import List, Dict, Any, Optional
from typing_extensions import TypedDict
from pydantic import BaseModel, Field


class QuestionEvaluation(BaseModel):
    question: str
    user_answer: str
    technical_score: int = Field(ge=0, le=100)
    communication_score: int = Field(ge=0, le=100)
    completeness_score: int = Field(ge=0, le=100)
    composite_score: int = Field(ge=0, le=100)
    strengths: List[str] = Field(default_factory=list)
    areas_for_improvement: List[str] = Field(default_factory=list)
    spoken_feedback: str = ""
    suggested_ideal_points: List[str] = Field(default_factory=list)


class InterviewState(TypedDict, total=False):
    # Session Identifiers
    session_id: str
    user_id: str
    thread_id: str

    # Target Metadata
    role: str
    experience: int
    topics: List[str]
    persona: str  # "strict" | "friendly" | "balanced"

    # Conversation History
    messages: List[Dict[str, Any]]
    current_phase: str  # "introduction" | "technical" | "behavioral" | "closing" | "completed"
    current_question: str
    current_question_index: int
    total_questions: int

    # Candidate Performance Tracking
    evaluations: List[Dict[str, Any]]
    running_avg_score: float
    difficulty_level: str  # "easy" | "medium" | "hard"

    # Governance & Timeboxing
    start_time: float
    max_duration_seconds: int
    warnings_issued: int
    is_interrupted: bool

    # Active Turn Buffer
    latest_user_answer: str
    latest_feedback: str
    latest_next_question: str

    # Post-Interview Synthesis
    final_report: Dict[str, Any]
