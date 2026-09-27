import uuid
import time
import logging
from typing import Dict, Any, Optional
from langgraph.graph import StateGraph, START, END
from app.graph.state import InterviewState
from app.graph.nodes import evaluator_node, moderator_node, interviewer_node, closing_node
from app.graph.edges import route_after_moderator
from app.agents.interviewer import InterviewerAgent
from app.agents.moderator import ModeratorAgent
from app.graph.checkpointer import RedisCheckpointer

logger = logging.getLogger("langgraph.graph")


def build_interview_graph():
    """
    Compiles the production LangGraph state machine.
    Workflow:
      START -> evaluator -> moderator -> [route_after_moderator]
                                          ├── interviewer -> END
                                          └── closing -> END
    """
    workflow = StateGraph(InterviewState)

    workflow.add_node("evaluator", evaluator_node)
    workflow.add_node("moderator", moderator_node)
    workflow.add_node("interviewer", interviewer_node)
    workflow.add_node("closing", closing_node)

    workflow.add_edge(START, "evaluator")
    workflow.add_edge("evaluator", "moderator")
    workflow.add_conditional_edges(
        "moderator",
        route_after_moderator,
        {
            "interviewer": "interviewer",
            "closing": "closing",
        },
    )
    workflow.add_edge("interviewer", END)
    workflow.add_edge("closing", END)

    return workflow.compile()


# Singleton compiled graph
compiled_graph = build_interview_graph()


class InterviewOrchestrator:
    """
    Orchestrates live interview sessions with checkpointing and stateful multi-agent execution.
    """

    @classmethod
    def start_session(
        cls,
        session_id: str,
        user_id: str,
        role: str = "Full Stack Engineer",
        experience: int = 3,
        topics: Optional[list] = None,
        persona: str = "balanced",
        total_questions: int = 5,
        max_duration_seconds: int = 600,
    ) -> Dict[str, Any]:
        thread_id = f"thread_{session_id}_{uuid.uuid4().hex[:8]}"

        initial_state: InterviewState = {
            "session_id": session_id,
            "user_id": user_id,
            "thread_id": thread_id,
            "role": role,
            "experience": experience,
            "topics": topics or ["System Architecture", "Performance Optimization"],
            "persona": persona,
            "messages": [],
            "current_phase": "introduction",
            "current_question": "",
            "current_question_index": 0,
            "total_questions": total_questions,
            "evaluations": [],
            "running_avg_score": 75.0,
            "difficulty_level": "medium",
            "start_time": time.time(),
            "max_duration_seconds": max_duration_seconds,
            "warnings_issued": 0,
            "is_interrupted": False,
            "latest_user_answer": "",
            "latest_feedback": "",
            "latest_next_question": "",
            "final_report": {},
        }

        # Generate introduction and first question
        intro, first_q = InterviewerAgent.generate_introduction(initial_state)
        initial_state["current_question"] = first_q
        initial_state["latest_feedback"] = intro
        initial_state["latest_next_question"] = first_q
        initial_state["current_phase"] = "technical"
        initial_state["messages"].append({
            "role": "assistant",
            "content": f"{intro} {first_q}".strip(),
            "timestamp": time.time(),
        })

        # Persist checkpoint to Redis / memory
        RedisCheckpointer.save_checkpoint(thread_id, initial_state)

        return {
            "thread_id": thread_id,
            "greeting_message": intro,
            "first_question": first_q,
            "role": role,
            "persona": persona,
            "current_phase": "technical",
            "total_questions": total_questions,
        }

    @classmethod
    def process_response(
        cls,
        thread_id: str,
        user_answer: str,
        gaze_metrics: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        state = RedisCheckpointer.load_checkpoint(thread_id)
        if not state:
            raise ValueError(f"Interview thread '{thread_id}' not found or session expired.")

        # Update input turn in state
        state["latest_user_answer"] = user_answer
        if gaze_metrics:
            state["gaze_score"] = gaze_metrics.get("score", 1.0)

        # Run compiled LangGraph state machine
        updated_state = compiled_graph.invoke(state)

        # Persist updated state checkpoint
        RedisCheckpointer.save_checkpoint(thread_id, updated_state)

        evaluations = updated_state.get("evaluations", [])
        latest_eval = evaluations[-1] if evaluations else {}

        return {
            "thread_id": thread_id,
            "spoken_feedback": updated_state.get("latest_feedback", ""),
            "next_question": updated_state.get("latest_next_question", ""),
            "evaluation": latest_eval,
            "current_phase": updated_state.get("current_phase", "technical"),
            "current_question_index": updated_state.get("current_question_index", 0),
            "running_avg_score": updated_state.get("running_avg_score", 70.0),
            "difficulty_level": updated_state.get("difficulty_level", "medium"),
            "is_completed": updated_state.get("current_phase") in ("closing", "completed"),
            "final_report": updated_state.get("final_report", {}),
        }

    @classmethod
    def end_session(cls, thread_id: str) -> Dict[str, Any]:
        state = RedisCheckpointer.load_checkpoint(thread_id)
        if not state:
            raise ValueError(f"Interview thread '{thread_id}' not found.")

        final_report = state.get("final_report")
        if not final_report:
            final_report = ModeratorAgent.generate_final_report(state)
            state["final_report"] = final_report
            state["current_phase"] = "completed"
            RedisCheckpointer.save_checkpoint(thread_id, state)

        return {
            "thread_id": thread_id,
            "final_report": final_report,
            "scores": {
                "overall": final_report.get("overall_score"),
                "readiness": final_report.get("readiness_verdict"),
            },
            "evaluations_count": len(state.get("evaluations", [])),
        }

    @classmethod
    def get_session_state(cls, thread_id: str) -> Optional[Dict[str, Any]]:
        return RedisCheckpointer.load_checkpoint(thread_id)
