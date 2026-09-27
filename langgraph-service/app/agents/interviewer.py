import json
import logging
from typing import Dict, Any, Tuple
from app.config import settings
from app.graph.state import InterviewState

logger = logging.getLogger("langgraph.interviewer")

try:
    from groq import Groq
    groq_client = Groq(api_key=settings.GROQ_API_KEY) if settings.GROQ_API_KEY else None
except Exception as e:
    logger.warning(f"Groq SDK initialization warning: {e}")
    groq_client = None


class InterviewerAgent:
    """
    Interviewer Agent:
    - Generates dynamic introductions matching the persona.
    - Generates adaptive follow-up questions and conversational spoken feedback.
    """

    @staticmethod
    def generate_introduction(state: InterviewState) -> Tuple[str, str]:
        role = state.get("role", "Software Engineer")
        persona = state.get("persona", "balanced")
        topics = state.get("topics", ["System Design", "Core Principles"])
        topics_str = ", ".join(topics) if topics else "general technical concepts"

        # Persona-tailored intro
        if persona == "strict":
            intro = (
                f"Assessment commenced for the {role} role. "
                f"We will be covering {topics_str}. Answer with technical precision, scalability considerations, and direct trade-offs."
            )
            first_q = (
                f"Let's dive right in. When designing a distributed system for {topics[0] if topics else 'high availability'}, "
                f"how do you balance data consistency against latency and partition tolerance?"
            )
        elif persona == "friendly":
            intro = (
                f"Welcome! It's fantastic to meet you today. We'll be walking through a few questions tailored to the {role} position, "
                f"focusing on {topics_str}. Take your time, think out loud, and let's have a great conversation!"
            )
            first_q = (
                f"To kick things off comfortably: Could you walk me through your architectural approach when tackling {topics[0] if topics else 'system scaling'}?"
            )
        else:
            intro = (
                f"Hello and welcome to your {role} technical interview. "
                f"Today we will evaluate your problem-solving and architectural expertise across {topics_str}."
            )
            first_q = (
                f"To begin: What are the primary trade-offs you consider when choosing between a relational and non-relational database for {topics[0] if topics else 'a high-throughput application'}?"
            )

        return intro, first_q

    @staticmethod
    def generate_response(state: InterviewState, user_answer: str, evaluation: Dict[str, Any]) -> Tuple[str, str]:
        """
        Synthesizes conversational spoken feedback and selects the next question.
        Uses Groq if available, or structured rule-based adaptive logic.
        """
        role = state.get("role", "Software Engineer")
        persona = state.get("persona", "balanced")
        current_q = state.get("current_question", "")
        current_idx = state.get("current_question_index", 0)
        total_q = state.get("total_questions", 5)
        difficulty = state.get("difficulty_level", "medium")
        topics = state.get("topics", ["Architecture"])

        score = evaluation.get("composite_score", 70)

        # Attempt Groq LLM completion if available
        if groq_client and settings.GROQ_API_KEY:
            try:
                system_prompt = (
                    f"You are an expert technical interviewer conducting an interview for a {role}. "
                    f"Interviewer Persona: {persona.upper()}. "
                    f"The candidate scored {score}/100 on their answer. "
                    f"Provide: "
                    f"1. Spoken feedback (1-2 conversational sentences acknowledging their points). "
                    f"2. Next question (an adaptive follow-up probe or next question suited for {difficulty} level). "
                    f"Respond ONLY in valid JSON format: {{\"spoken_feedback\": \"...\", \"next_question\": \"...\"}}"
                )
                user_prompt = (
                    f"Question: {current_q}\n"
                    f"Candidate Answer: {user_answer}\n"
                    f"Current Question Index: {current_idx + 1} of {total_q}\n"
                )

                completion = groq_client.chat.completions.create(
                    model=settings.GROQ_MODEL,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.6,
                    max_tokens=300,
                )
                data = json.loads(completion.choices[0].message.content)
                return data.get("spoken_feedback", ""), data.get("next_question", "")
            except Exception as e:
                logger.warning(f"Groq API call in InterviewerAgent failed, falling back to local synthesis: {e}")

        # Deterministic / Resilient Fallback Synthesis
        if score >= 80:
            feedback_pfx = "Excellent breakdown! You clearly articulated the core trade-offs and structural mechanics."
        elif score >= 50:
            feedback_pfx = "Solid points covered. Consider delving deeper into operational failure modes and edge cases."
        else:
            feedback_pfx = "Thank you for sharing your thoughts. Let's make sure we ground the concepts in concrete system guarantees."

        # Adaptive next question based on index & difficulty
        next_topic = topics[(current_idx + 1) % len(topics)] if topics else "System Design"
        if current_idx + 1 < total_q:
            if difficulty == "hard":
                next_q = (
                    f"Moving to our next challenge on {next_topic}: How would you design a distributed lock service "
                    f"with fencing tokens to prevent split-brain anomalies under network partitions?"
                )
            elif difficulty == "easy":
                next_q = (
                    f"Let's explore {next_topic}: Can you explain how in-memory caching like Redis helps alleviate database bottlenecks, "
                    f"and what cache eviction policies you would recommend?"
                )
            else:
                next_q = (
                    f"Next question regarding {next_topic}: What strategies would you implement to guarantee idempotent request handling "
                    f"in an asynchronous event-driven architecture?"
                )
        else:
            next_q = "That was our final technical inquiry. Thank you for walking through these complex scenarios."

        return f"{feedback_pfx} {evaluation.get('spoken_feedback', '')}".strip(), next_q
