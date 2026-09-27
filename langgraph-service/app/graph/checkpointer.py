import json
import logging
from typing import Optional, Dict, Any
from app.config import settings
from app.graph.state import InterviewState

logger = logging.getLogger("langgraph.checkpointer")

try:
    import redis
    redis_client = redis.Redis.from_url(
        settings.REDIS_URL,
        decode_responses=True,
        socket_connect_timeout=1.0,
        socket_timeout=1.0,
    )
except Exception as e:
    logger.warning(f"Could not initialize Redis client for checkpointer: {e}")
    redis_client = None

# High-performance in-memory fallback store
_memory_store: Dict[str, Dict[str, Any]] = {}


class RedisCheckpointer:
    """
    Checkpointer for LangGraph state persistence:
    - Stores serialized graph state in Redis key: `langgraph:thread:{thread_id}`
    - Automatic 2-hour TTL (7200s)
    - Fallback to in-memory store if Redis is unavailable (zero downtime)
    """

    KEY_PREFIX = "langgraph:thread:"

    @classmethod
    def is_connected(cls) -> bool:
        if redis_client is None:
            return False
        try:
            return bool(redis_client.ping())
        except Exception:
            return False

    @classmethod
    def save_checkpoint(cls, thread_id: str, state: InterviewState) -> bool:
        serialized = json.dumps(state)

        # 1. Update in-memory fallback
        _memory_store[thread_id] = json.loads(serialized)

        # 2. Persist to Redis if available
        if redis_client is not None:
            try:
                key = f"{cls.KEY_PREFIX}{thread_id}"
                redis_client.set(key, serialized, ex=settings.CHECKPOINT_TTL_SECONDS)
                return True
            except Exception as e:
                logger.debug(f"Redis save failed, relying on memory checkpointer: {e}")
        return True

    @classmethod
    def load_checkpoint(cls, thread_id: str) -> Optional[InterviewState]:
        # 1. Try Redis first
        if redis_client is not None:
            try:
                key = f"{cls.KEY_PREFIX}{thread_id}"
                data = redis_client.get(key)
                if data:
                    return json.loads(data)
            except Exception as e:
                logger.debug(f"Redis read failed, reading from memory store: {e}")

        # 2. Fall back to in-memory store
        return _memory_store.get(thread_id)

    @classmethod
    def delete_checkpoint(cls, thread_id: str) -> bool:
        _memory_store.pop(thread_id, None)
        if redis_client is not None:
            try:
                key = f"{cls.KEY_PREFIX}{thread_id}"
                redis_client.delete(key)
            except Exception:
                pass
        return True

    @classmethod
    def get_active_threads_count(cls) -> int:
        return len(_memory_store)
