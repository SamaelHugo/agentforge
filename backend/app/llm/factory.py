"""Selects the active LLM provider based on configuration."""
from __future__ import annotations

from functools import lru_cache

from ..config import get_settings
from .base import LLMProvider


def resolve_default_model(provider: str, configured_model: str) -> str:
    """Return a model that belongs to the active provider and is still live."""
    if provider == "groq":
        from .openai_provider import (
            GROQ_DEFAULT_MODEL,
            GROQ_MODEL_ALIASES,
            GROQ_PREFIXES,
        )

        model = GROQ_MODEL_ALIASES.get(configured_model.lower(), configured_model)
        if not model.lower().startswith(tuple(p.lower() for p in GROQ_PREFIXES)):
            return GROQ_DEFAULT_MODEL
        return model

    if provider == "gemini":
        from .openai_provider import GEMINI_PREFIXES

        if configured_model.lower().startswith(
            tuple(p.lower() for p in GEMINI_PREFIXES)
        ):
            return configured_model
        return "gemini-2.0-flash"

    if provider == "openai":
        from .openai_provider import OPENAI_PREFIXES

        if configured_model.lower().startswith(
            tuple(p.lower() for p in OPENAI_PREFIXES)
        ):
            return configured_model
        return "gpt-4o-mini"

    if provider == "anthropic":
        from .anthropic_provider import CLAUDE_PREFIXES, DEFAULT_CLAUDE_MODEL

        if configured_model.lower().startswith(CLAUDE_PREFIXES):
            return configured_model
        return DEFAULT_CLAUDE_MODEL

    return "mock"


@lru_cache
def get_llm_provider() -> LLMProvider:
    settings = get_settings()
    provider = settings.resolved_llm_provider

    if provider == "groq":
        if not settings.groq_api_key:
            raise RuntimeError("LLM_PROVIDER=groq but GROQ_API_KEY is not set.")
        from .openai_provider import (
            GROQ_MODEL_ALIASES,
            GROQ_PREFIXES,
            OpenAIProvider,
        )

        model = resolve_default_model(provider, settings.default_model)
        return OpenAIProvider(
            api_key=settings.groq_api_key,
            base_url="https://api.groq.com/openai/v1",
            default_model=model,
            name="groq",
            model_prefixes=GROQ_PREFIXES,
            model_aliases=GROQ_MODEL_ALIASES,
        )

    if provider == "gemini":
        if not settings.gemini_api_key:
            raise RuntimeError("LLM_PROVIDER=gemini but GEMINI_API_KEY is not set.")
        from .openai_provider import GEMINI_PREFIXES, OpenAIProvider

        model = resolve_default_model(provider, settings.default_model)
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

        model = resolve_default_model(provider, settings.default_model)
        return OpenAIProvider(api_key=settings.openai_api_key, default_model=model)

    if provider == "anthropic":
        if not settings.anthropic_api_key:
            raise RuntimeError(
                "LLM_PROVIDER=anthropic but ANTHROPIC_API_KEY is not set."
            )
        from .anthropic_provider import AnthropicProvider

        model = resolve_default_model(provider, settings.default_model)
        return AnthropicProvider(api_key=settings.anthropic_api_key, default_model=model)

    from .mock_provider import MockProvider

    return MockProvider()
