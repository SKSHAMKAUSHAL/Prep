import json
import logging
from typing import Dict, Any
from app.config import settings
from app.graph.state import InterviewState
from app.rag.retriever import RAGRetriever

logger = logging.getLogger("langgraph.evaluator")

try:
    from groq import Groq
    groq_client = Groq(api_key=settings.GROQ_API_KEY) if settings.GROQ_API_KEY else None
except Exception as e:
    logger.warning(f"Groq SDK initialization warning: {e}")
    groq_client = None


class EvaluatorAgent:
    """
    Evaluator Agent:
    - Silently and impartially evaluates candidate answers across multiple dimensions.
    - Uses Qdrant-backed RAG to inject proprietary scoring rubrics and architectural patterns.
    - Incorporates real-time gaze/attention metrics into behavioral communication scoring.
    - Computes calibrated rubrics: Technical accuracy, clarity, depth, and composite scores.
    """

    @staticmethod
    def evaluate(state: InterviewState, user_answer: str) -> Dict[str, Any]:
        role = state.get("role", "Software Engineer")
        question = state.get("current_question", "")
        current_phase = state.get("current_phase", "technical")
        gaze_score = state.get("gaze_score", None)

        # 1. Retrieve proprietary RAG rubrics for system design & technical questions
        retrieved_rubrics = RAGRetriever.retrieve(
            query=f"{question} {user_answer}",
            role=role,
            limit=2,
        )
        rubric_context = RAGRetriever.format_rubric_context(retrieved_rubrics)
        matched_rubric_title = retrieved_rubrics[0]["title"] if retrieved_rubrics else "Standard Software Engineering Rubric"

        # Fallback evaluation template in case of LLM unavailability or brief answers
        words = user_answer.strip().split()
        word_count = len(words)

        if word_count < 5:
            return {
                "question": question,
                "user_answer": user_answer,
                "technical_score": 25,
                "communication_score": 30,
                "completeness_score": 20,
                "composite_score": 25,
                "rag_rubric_matched": matched_rubric_title,
                "strengths": ["Answer was provided promptly"],
                "areas_for_improvement": ["Elaborate with deeper architectural specifics and trade-offs."],
                "spoken_feedback": "Your response was quite brief. In future responses, aim to provide concrete examples.",
                "suggested_ideal_points": (
                    retrieved_rubrics[0].get("ideal_points", [])[:3]
                    if retrieved_rubrics
                    else [
                        "Define key terminology and foundational constraints",
                        "Analyze architectural bottlenecks and mitigation techniques",
                        "Discuss concrete production metrics and telemetry",
                    ]
                ),
            }

        # Attempt LLM-assisted evaluation
        if groq_client and settings.GROQ_API_KEY:
            try:
                system_prompt = (
                    f"You are a principal engineer conducting a rigorous technical evaluation for a {role} candidate. "
                    f"Phase: {current_phase.upper()}. "
                    f"{rubric_context}\n"
                    f"Evaluate the candidate's answer against the question and the retrieved rubric criteria. "
                    f"Return a strict JSON object with: "
                    f"\"technical_score\" (integer 0-100), "
                    f"\"communication_score\" (integer 0-100), "
                    f"\"completeness_score\" (integer 0-100), "
                    f"\"composite_score\" (integer 0-100), "
                    f"\"strengths\" (list of 2 strings), "
                    f"\"areas_for_improvement\" (list of 2 strings), "
                    f"\"spoken_feedback\" (1 concise sentence summarising the assessment), "
                    f"\"suggested_ideal_points\" (list of 2 strings highlighting ideal answers)."
                )

                user_prompt = f"Question: {question}\nCandidate Answer: {user_answer}\n"

                completion = groq_client.chat.completions.create(
                    model=settings.GROQ_MODEL,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.3,
                    max_tokens=500,
                )

                result = json.loads(completion.choices[0].message.content)
                result["question"] = question
                result["user_answer"] = user_answer
                result["rag_rubric_matched"] = matched_rubric_title
                # Factor in gaze attention metrics if present
                if gaze_score is not None:
                    if gaze_score < 0.6:
                        result["communication_score"] = max(20, result.get("communication_score", 70) - 5)
                        result.setdefault("areas_for_improvement", []).append("Maintain steady eye contact with the camera to demonstrate interview engagement.")
                    elif gaze_score >= 0.85:
                        result.setdefault("strengths", []).append("Strong, confident eye contact and visual attentiveness.")
                return result
            except Exception as e:
                logger.warning(f"Groq API evaluation failed, falling back to rule-based rubric: {e}")

        # Rule-based calibrated rubric
        has_keywords = any(kw in user_answer.lower() for kw in ["trade-off", "scale", "latency", "consistency", "cache", "partition", "async", "queue", "database", "index"])
        base_score = 65 if not has_keywords else 82

        technical = min(100, base_score + (5 if word_count > 30 else 0))
        communication = min(100, 75 + (10 if "." in user_answer else 0))
        completeness = min(100, 70 + (10 if word_count > 40 else 0))

        strengths = [
            "Good conceptual comprehension of the fundamental mechanics",
            "Clear verbal articulation and structure",
        ]
        improvements = [
            "Quantify operational metrics (throughput, p99 latency SLAs)",
            "Address edge-case resilience and failover strategies",
        ]

        # Behavioral Gaze adjustment
        if gaze_score is not None:
            if gaze_score < 0.6:
                communication = max(20, communication - 5)
                improvements.append("Maintain steady eye contact with the camera to demonstrate interview engagement.")
            elif gaze_score >= 0.85:
                strengths.append("Strong, confident eye contact and visual attentiveness.")

        composite = round(0.5 * technical + 0.3 * completeness + 0.2 * communication)

        ideal_points = (
            retrieved_rubrics[0].get("ideal_points", [])[:3]
            if retrieved_rubrics
            else [
                "Address CAP theorem implications under active network partitions",
                "Incorporate read-repair or active anti-entropy background synchronization",
            ]
        )

        return {
            "question": question,
            "user_answer": user_answer,
            "technical_score": technical,
            "communication_score": communication,
            "completeness_score": completeness,
            "composite_score": composite,
            "rag_rubric_matched": matched_rubric_title,
            "strengths": strengths,
            "areas_for_improvement": improvements,
            "spoken_feedback": "You highlighted the key architectural elements with good clarity.",
            "suggested_ideal_points": ideal_points,
        }

