"""Selects the active LLM provider based on configuration."""
from __future__ import annotations

from functools import lru_cache

from ..config import get_settings
from .base import LLMProvider


@lru_cache
def get_llm_provider() -> LLMProvider:
    settings = get_settings()
    provider = settings.resolved_llm_provider

    if provider == "groq":
        if not settings.groq_api_key:
            raise RuntimeError("LLM_PROVIDER=groq but GROQ_API_KEY is not set.")
        from .openai_provider import GROQ_PREFIXES, OpenAIProvider

        model = settings.default_model
        if not model.lower().startswith(tuple(p.lower() for p in GROQ_PREFIXES)):
            model = "llama-3.3-70b-versatile"
        return OpenAIProvider(
            api_key=settings.groq_api_key,
            base_url="https://api.groq.com/openai/v1",
            default_model=model,
            name="groq",
            model_prefixes=GROQ_PREFIXES,
        )

    if provider == "gemini":
        if not settings.gemini_api_key:
            raise RuntimeError("LLM_PROVIDER=gemini but GEMINI_API_KEY is not set.")
        from .openai_provider import GEMINI_PREFIXES, OpenAIProvider

        model = settings.default_model
        if not model.lower().startswith(tuple(p.lower() for p in GEMINI_PREFIXES)):
            model = "gemini-2.0-flash"
        return OpenAIProvider(
            api_key=settings.gemini_api_key,
            base_url="https://generativelanguage.googleapis.com/v1beta/openai",
            default_model=model,
            name="gemini",
            model_prefixes=GEMINI_PREFIXES,
        )

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
