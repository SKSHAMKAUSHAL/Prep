import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    PORT: int = 8001
    HOST: str = "0.0.0.0"

    # AI Model Settings
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-120b"
    GROQ_FALLBACK_MODEL: str = "qwen/qwen3.8-27b"

    # Redis Settings
    REDIS_URL: str = "redis://localhost:6379"
    CHECKPOINT_TTL_SECONDS: int = 7200  # 2 hours

    # Vector Database (Qdrant) & RAG Settings
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_API_KEY: str = ""
    QDRANT_COLLECTION: str = "system_design_rubrics"
    VECTOR_DIM: int = 128

    # CORS
    ALLOWED_ORIGINS: List[str] = ["*"]

    model_config = SettingsConfigDict(
        env_file=(".env", "../backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
