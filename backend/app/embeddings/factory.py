"""Selects the active embedder based on configuration."""
from __future__ import annotations

from functools import lru_cache

from ..config import get_settings
from .base import Embedder


@lru_cache
def get_embedder() -> Embedder:
    settings = get_settings()
    provider = settings.resolved_embeddings_provider

    if provider == "openai":
        if not settings.openai_api_key:
            raise RuntimeError(
                "EMBEDDINGS_PROVIDER=openai but OPENAI_API_KEY is not set."
            )
        from .openai_provider import OpenAIEmbedder

        return OpenAIEmbedder(api_key=settings.openai_api_key)

    from .local import LocalEmbedder

    return LocalEmbedder(dim=settings.embedding_dim)
