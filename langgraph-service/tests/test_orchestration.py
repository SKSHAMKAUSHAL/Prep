import pytest
from starlette.testclient import TestClient
from app.main import app
from app.graph.graph import InterviewOrchestrator
from app.graph.checkpointer import RedisCheckpointer
from app.agents.interviewer import InterviewerAgent
from app.agents.evaluator import EvaluatorAgent
from app.agents.moderator import ModeratorAgent

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "UP"
    assert "redis_connected" in data
    assert "uptime_seconds" in data


def test_interviewer_persona_adaptation():
    state_strict = {"role": "Distributed Systems Architect", "persona": "strict", "topics": ["Raft"]}
    intro_s, q_s = InterviewerAgent.generate_introduction(state_strict)
    assert "strict" in intro_s.lower() or "assessment" in intro_s.lower()
    assert len(q_s) > 10

    state_friendly = {"role": "Frontend Engineer", "persona": "friendly", "topics": ["React"]}
    intro_f, q_f = InterviewerAgent.generate_introduction(state_friendly)
    assert "welcome" in intro_f.lower() or "glad" in intro_f.lower()
    assert len(q_f) > 10


def test_evaluator_rubric_scoring():
    state = {
        "role": "Backend Engineer",
        "current_question": "Explain database indexing trade-offs.",
        "current_phase": "technical",
    }
    answer = "Indexes speed up read operations via B-Trees, but introduce write latency overhead and disk consumption."
    eval_result = EvaluatorAgent.evaluate(state, answer)

    assert 0 <= eval_result["technical_score"] <= 100
    assert 0 <= eval_result["communication_score"] <= 100
    assert 0 <= eval_result["completeness_score"] <= 100
    assert 0 <= eval_result["composite_score"] <= 100
    assert len(eval_result["strengths"]) > 0
    assert len(eval_result["areas_for_improvement"]) > 0


def test_moderator_governance():
    state = {
        "role": "Staff Engineer",
        "current_question_index": 0,
        "total_questions": 4,
        "current_phase": "technical",
        "evaluations": [{"composite_score": 90}, {"composite_score": 85}],
    }
    govern_data = ModeratorAgent.inspect_and_govern(state)
    assert govern_data["running_avg_score"] == 87.5
    assert govern_data["difficulty_level"] == "hard"

    # Test conclusion when questions reach quota
    state_end = {
        "role": "Staff Engineer",
        "current_question_index": 3,
        "total_questions": 4,
        "current_phase": "technical",
        "evaluations": [{"composite_score": 75}],
    }
    govern_end = ModeratorAgent.inspect_and_govern(state_end)
    assert govern_end["current_phase"] == "closing"


def test_interview_orchestrator_turn_flow():
    # 1. Start Session
    start_res = InterviewOrchestrator.start_session(
        session_id="sess_unit_test",
        user_id="user_unit_test",
        role="DevOps Engineer",
        total_questions=2,
    )
    thread_id = start_res["thread_id"]
    assert thread_id.startswith("thread_sess_unit_test_")
    assert len(start_res["first_question"]) > 10

    # 2. Process Turn 1
    turn1_res = InterviewOrchestrator.process_response(
        thread_id=thread_id,
        user_answer="We use Kubernetes with horizontal pod autoscalers and Prometheus metrics to handle traffic spikes.",
    )
    assert turn1_res["thread_id"] == thread_id
    assert turn1_res["evaluation"]["composite_score"] > 0
    assert len(turn1_res["spoken_feedback"]) > 0

    # 3. Process Turn 2 (Should wrap up since total_questions = 2)
    turn2_res = InterviewOrchestrator.process_response(
        thread_id=thread_id,
        user_answer="CI/CD pipelines run automated regression tests and trigger blue-green deployments.",
    )
    assert turn2_res["is_completed"] is True
    assert turn2_res["final_report"]["overall_score"] > 0


def test_redis_checkpoint_crash_recovery():
    session_id = "sess_recovery_test"
    start_res = InterviewOrchestrator.start_session(
        session_id=session_id,
        user_id="user_123",
        role="Security Architect",
    )
    thread_id = start_res["thread_id"]

    # Process a response to advance state
    InterviewOrchestrator.process_response(
        thread_id=thread_id,
        user_answer="We enforce zero-trust network access, mTLS, and short-lived JWT credentials.",
    )

    # Simulate client crash / page refresh by loading directly from checkpointer
    recovered_state = RedisCheckpointer.load_checkpoint(thread_id)
    assert recovered_state is not None
    assert recovered_state["thread_id"] == thread_id
    assert len(recovered_state["evaluations"]) == 1
    assert recovered_state["evaluations"][0]["composite_score"] > 0


def test_fastapi_rest_flow():
    # 1. POST /start
    start_payload = {
        "session_id": "api_test_session",
        "user_id": "api_test_user",
        "role": "Cloud Architect",
        "experience": 5,
        "persona": "balanced",
        "total_questions": 3,
        "max_duration_seconds": 600,
    }
    start_res = client.post("/api/v1/interview/start", json=start_payload)
    assert start_res.status_code == 201
    start_data = start_res.json()
    thread_id = start_data["thread_id"]
    assert "thread_id" in start_data

    # 2. POST /respond
    respond_payload = {
        "thread_id": thread_id,
        "user_answer": "We partition databases by tenant ID and utilize read replicas to scale query throughput.",
    }
    respond_res = client.post("/api/v1/interview/respond", json=respond_payload)
    assert respond_res.status_code == 200
    respond_data = respond_res.json()
    assert "evaluation" in respond_data
    assert "spoken_feedback" in respond_data

    # 3. GET /state
    state_res = client.get(f"/api/v1/interview/state/{thread_id}")
    assert state_res.status_code == 200
    state_data = state_res.json()
    assert state_data["thread_id"] == thread_id
    assert len(state_data["evaluations"]) == 1

    # 4. POST /end
    end_res = client.post("/api/v1/interview/end", json={"thread_id": thread_id})
    assert end_res.status_code == 200
    end_data = end_res.json()
    assert "final_report" in end_data
    assert "scores" in end_data
