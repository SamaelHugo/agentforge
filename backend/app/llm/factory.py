"""Selects the active LLM provider based on configuration."""
from __future__ import annotations

from functools import lru_cache

from ..config import get_settings
from .base import LLMProvider


@lru_cache
def get_llm_provider() -> LLMProvider:
    settings = get_settings()
    provider = settings.resolved_llm_provider

    if provider == "openai":
        if not settings.openai_api_key:
            raise RuntimeError(
                "LLM_PROVIDER=openai but OPENAI_API_KEY is not set."
            )
        from .openai_provider import OpenAIProvider

        return OpenAIProvider(
            api_key=settings.openai_api_key, default_model=settings.default_model
        )

    if provider == "anthropic":
        if not settings.anthropic_api_key:
            raise RuntimeError(
                "LLM_PROVIDER=anthropic but ANTHROPIC_API_KEY is not set."
            )
        from .anthropic_provider import AnthropicProvider

        return AnthropicProvider(api_key=settings.anthropic_api_key)

    from .mock_provider import MockProvider

    return MockProvider()
