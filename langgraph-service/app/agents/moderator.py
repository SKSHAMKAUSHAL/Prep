import time
import logging
from typing import Dict, Any, List
from app.graph.state import InterviewState

logger = logging.getLogger("langgraph.moderator")


class ModeratorAgent:
    """
    Moderator Agent:
    - Enforces interview governance, pacing, and timeboxing.
    - Manages phase transitions (Introduction -> Technical -> Behavioral -> Closing).
    - Adapts question difficulty dynamically based on candidate performance.
    - Generates final comprehensive evaluation report on wrap-up.
    """

    @staticmethod
    def inspect_and_govern(state: InterviewState) -> Dict[str, Any]:
        start_time = state.get("start_time", time.time())
        max_duration = state.get("max_duration_seconds", 600)
        elapsed_seconds = time.time() - start_time

        current_idx = state.get("current_question_index", 0)
        total_q = state.get("total_questions", 5)
        current_phase = state.get("current_phase", "technical")
        evaluations: List[Dict[str, Any]] = state.get("evaluations", [])

        # 1. Calculate running average score
        if evaluations:
            avg_score = sum(e.get("composite_score", 0) for e in evaluations) / len(evaluations)
        else:
            avg_score = 70.0

        # 2. Dynamic difficulty adaptation
        if avg_score >= 80.0:
            difficulty = "hard"
        elif avg_score < 55.0:
            difficulty = "easy"
        else:
            difficulty = "medium"

        # 3. Phase Transition Logic
        next_phase = current_phase
        time_exceeded = elapsed_seconds >= max_duration
        questions_depleted = (current_idx + 1) >= total_q

        if time_exceeded or questions_depleted:
            next_phase = "closing"
        elif current_phase == "introduction":
            next_phase = "technical"
        elif current_phase == "technical" and current_idx >= (total_q // 2):
            next_phase = "behavioral"

        return {
            "current_phase": next_phase,
            "running_avg_score": round(avg_score, 1),
            "difficulty_level": difficulty,
            "elapsed_seconds": round(elapsed_seconds, 1),
            "is_time_up": time_exceeded,
        }

    @staticmethod
    def generate_final_report(state: InterviewState) -> Dict[str, Any]:
        role = state.get("role", "Software Engineer")
        evaluations = state.get("evaluations", [])
        avg_score = state.get("running_avg_score", 70.0)

        # Aggregate strengths and areas for improvement
        all_strengths = []
        all_improvements = []
        for ev in evaluations:
            all_strengths.extend(ev.get("strengths", []))
            all_improvements.extend(ev.get("areas_for_improvement", []))

        # Deduplicate
        unique_strengths = list(dict.fromkeys(all_strengths))[:4]
        unique_improvements = list(dict.fromkeys(all_improvements))[:4]

        readiness = "Strong Hire" if avg_score >= 85 else ("Hire" if avg_score >= 70 else "Needs Practice")

        # Behavioral & RAG metadata aggregation
        gaze_scores = [ev.get("gaze_score") for ev in evaluations if ev.get("gaze_score") is not None]
        avg_gaze = sum(gaze_scores) / len(gaze_scores) if gaze_scores else state.get("gaze_score", 0.9)
        gaze_status = "Optimal Eye Contact & Attentiveness" if avg_gaze >= 0.8 else ("Moderate Focus" if avg_gaze >= 0.6 else "Visual Distraction Detected")

        rubrics_applied = list(dict.fromkeys([ev.get("rag_rubric_matched") for ev in evaluations if ev.get("rag_rubric_matched")]))

        return {
            "role": role,
            "overall_score": round(avg_score),
            "readiness_verdict": readiness,
            "questions_evaluated": len(evaluations),
            "key_strengths": unique_strengths or ["Demonstrated good overall communication"],
            "critical_growth_areas": unique_improvements or ["Deepen operational edge-case reasoning"],
            "behavioral_analysis": {
                "average_eye_contact_score": round(avg_gaze * 100, 1) if avg_gaze is not None else 90.0,
                "attention_assessment": gaze_status,
                "facial_engagement_level": "High" if (avg_gaze or 0.9) >= 0.75 else "Medium",
            },
            "rag_rubrics_applied": rubrics_applied or ["Distributed Systems Architecture Standard"],
            "summary": (
                f"Candidate completed mock interview for {role}. "
                f"Achieved an overall score of {round(avg_score)}/100, demonstrating {readiness.lower()} potential. "
                f"Behavioral assessment: {gaze_status}. "
                f"Recommended focus: study production reliability, CAP theorem edge-cases, and telemetry."
            ),
        }

