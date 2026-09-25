from typing import Literal
from app.graph.state import InterviewState


def route_after_moderator(state: InterviewState) -> Literal["closing", "interviewer"]:
    """
    Conditional routing edge from Moderator:
    - If interview time has expired or phase is 'closing'/'completed', route to closing node.
    - Otherwise, route to interviewer node to deliver feedback and the next question.
    """
    phase = state.get("current_phase", "technical")
    if phase in ("closing", "completed"):
        return "closing"
    return "interviewer"
