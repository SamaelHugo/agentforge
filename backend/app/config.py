"""Application settings, loaded from environment / .env file."""
from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # --- Database ---
    database_url: str = "sqlite:///./agentforge.db"

    # --- LLM ---
    llm_provider: str = "auto"  # auto | anthropic | mock
    anthropic_api_key: str | None = None
    default_model: str = "claude-opus-4-8"
    max_tokens: int = 4096

    # --- Embeddings ---
    embeddings_provider: str = "auto"  # auto | local | openai
    openai_api_key: str | None = None
    embedding_dim: int = 384

    # --- RAG ---
    chunk_size: int = 800
    chunk_overlap: int = 120
    top_k: int = 4

    # --- App ---
    cors_origins: str = "http://localhost:3000"
    seed_on_startup: bool = True

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def resolved_llm_provider(self) -> str:
        if self.llm_provider != "auto":
            return self.llm_provider
        return "anthropic" if self.anthropic_api_key else "mock"

    @property
    def resolved_embeddings_provider(self) -> str:
        if self.embeddings_provider != "auto":
            return self.embeddings_provider
        return "openai" if self.openai_api_key else "local"


@lru_cache
def get_settings() -> Settings:
    return Settings()
