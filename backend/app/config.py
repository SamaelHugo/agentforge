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
    llm_provider: str = "auto"  # auto | groq | gemini | openai | anthropic | mock
    groq_api_key: str | None = None
    gemini_api_key: str | None = None
    anthropic_api_key: str | None = None
    default_model: str = "gpt-4o-mini"
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
    rate_limit_per_min: int = 10  # per-IP cap on agent runs (0 disables)

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def resolved_llm_provider(self) -> str:
        if self.llm_provider != "auto":
            return self.llm_provider
        if self.groq_api_key:
            return "groq"
        if self.gemini_api_key:
            return "gemini"
        if self.openai_api_key:
            return "openai"
        if self.anthropic_api_key:
            return "anthropic"
        return "mock"

    @property
    def resolved_embeddings_provider(self) -> str:
        if self.embeddings_provider != "auto":
            return self.embeddings_provider
        # Default to the free local embedder even when an OpenAI key is present
        # (which it usually is, for the LLM). Opt into OpenAI embeddings
        # explicitly with EMBEDDINGS_PROVIDER=openai.
        return "local"


@lru_cache
def get_settings() -> Settings:
    return Settings()
