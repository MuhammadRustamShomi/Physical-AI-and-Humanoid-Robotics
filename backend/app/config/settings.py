"""Application settings using Pydantic BaseSettings."""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # OpenAI API for embeddings
    openai_api_key: str

    # Qdrant Cloud vector database
    qdrant_api_key: str
    qdrant_url: str

    # Neon Serverless PostgreSQL
    neon_database_url: str

    # Anthropic API for Claude
    anthropic_api_key: str

    # Frontend URL for CORS
    frontend_url: str = "http://localhost:3000"

    # Environment
    environment: str = "development"

    # Application settings
    app_name: str = "Physical AI Textbook API"
    app_version: str = "0.1.0"
    debug: bool = False

    # RAG settings
    embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 768
    chunk_size: int = 512
    chunk_overlap: int = 64
    top_k_results: int = 5

    # Session settings
    session_ttl_hours: int = 24

    @property
    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.environment == "development"

    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return self.environment == "production"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
