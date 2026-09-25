import time
import logging
from typing import Dict, Any
from app.graph.state import InterviewState
from app.agents.interviewer import InterviewerAgent
from app.agents.evaluator import EvaluatorAgent
from app.agents.moderator import ModeratorAgent

logger = logging.getLogger("langgraph.nodes")


def evaluator_node(state: InterviewState) -> Dict[str, Any]:
    """
    Evaluator Node:
    Extracts the latest candidate response and executes multi-dimensional rubric scoring.
    """
    user_answer = state.get("latest_user_answer", "").strip()
    if not user_answer:
        user_answer = "No response provided."

    eval_result = EvaluatorAgent.evaluate(state, user_answer)

    evaluations = list(state.get("evaluations", []))
    evaluations.append(eval_result)

    # Record message history
    messages = list(state.get("messages", []))
    messages.append({
        "role": "user",
        "content": user_answer,
        "timestamp": time.time(),
        "evaluation": eval_result,
    })

    return {
        "evaluations": evaluations,
        "messages": messages,
    }


def moderator_node(state: InterviewState) -> Dict[str, Any]:
    """
    Moderator Node:
    Inspects time elapsed, question quotas, and candidate performance.
    Determines next phase (Technical, Behavioral, Closing) and sets dynamic difficulty.
    """
    govern_data = ModeratorAgent.inspect_and_govern(state)

    updates = {
        "current_phase": govern_data["current_phase"],
        "running_avg_score": govern_data["running_avg_score"],
        "difficulty_level": govern_data["difficulty_level"],
    }

    if govern_data["current_phase"] == "closing":
        updates["final_report"] = ModeratorAgent.generate_final_report(state)

    return updates


def interviewer_node(state: InterviewState) -> Dict[str, Any]:
    """
    Interviewer Node:
    Synthesizes spoken feedback and formulates the next question.
    """
    current_phase = state.get("current_phase", "technical")
    evaluations = state.get("evaluations", [])
    latest_eval = evaluations[-1] if evaluations else {}
    user_answer = state.get("latest_user_answer", "")
    current_idx = state.get("current_question_index", 0)

    if current_phase == "introduction":
        intro, first_q = InterviewerAgent.generate_introduction(state)
        messages = list(state.get("messages", []))
        messages.append({
            "role": "assistant",
            "content": f"{intro} {first_q}".strip(),
            "timestamp": time.time(),
        })

        return {
            "current_question": first_q,
            "latest_feedback": intro,
            "latest_next_question": first_q,
            "messages": messages,
        }

    # Technical or Behavioral round
    spoken_fb, next_q = InterviewerAgent.generate_response(state, user_answer, latest_eval)
    new_idx = current_idx + 1

    messages = list(state.get("messages", []))
    messages.append({
        "role": "assistant",
        "content": f"{spoken_fb} {next_q}".strip(),
        "timestamp": time.time(),
    })

    return {
        "current_question": next_q,
        "current_question_index": new_idx,
        "latest_feedback": spoken_fb,
        "latest_next_question": next_q,
        "messages": messages,
    }


def closing_node(state: InterviewState) -> Dict[str, Any]:
    """
    Closing Node:
    Generates the final comprehensive interview report and terminates the state machine.
    """
    final_report = state.get("final_report") or ModeratorAgent.generate_final_report(state)
    conclusion_text = (
        f"Thank you for completing your mock technical interview. "
        f"Your performance has been evaluated across all dimensions. Final Score: {final_report.get('overall_score')}/100."
    )

    messages = list(state.get("messages", []))
    messages.append({
        "role": "assistant",
        "content": conclusion_text,
        "timestamp": time.time(),
    })

    return {
        "current_phase": "completed",
        "final_report": final_report,
        "latest_feedback": conclusion_text,
        "latest_next_question": "",
        "messages": messages,
    }
