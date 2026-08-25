from __future__ import annotations

from typing import Any

import httpx

from app.llm.factory import resolve_default_model
from app.llm.openai_provider import (
    GROQ_DEFAULT_MODEL,
    GROQ_MODEL_ALIASES,
    GROQ_PREFIXES,
    OpenAIProvider,
)


def test_retired_groq_default_resolves_to_live_replacement() -> None:
    assert (
        resolve_default_model("groq", "llama-3.3-70b-versatile")
        == GROQ_DEFAULT_MODEL
    )


def test_saved_agent_with_retired_groq_model_uses_live_alias(
    monkeypatch: Any,
) -> None:
    requested_bodies: list[dict[str, Any]] = []

    def fake_post(url: str, **kwargs: Any) -> httpx.Response:
        requested_bodies.append(kwargs["json"])
        request = httpx.Request("POST", url)
        return httpx.Response(
            200,
            request=request,
            json={
                "choices": [{"message": {"content": "ok"}}],
                "usage": {"prompt_tokens": 1, "completion_tokens": 1},
            },
        )

    monkeypatch.setattr(httpx, "post", fake_post)
    provider = OpenAIProvider(
        "test-key",
        base_url="https://api.groq.com/openai/v1",
        default_model=GROQ_DEFAULT_MODEL,
        name="groq",
        model_prefixes=GROQ_PREFIXES,
        model_aliases=GROQ_MODEL_ALIASES,
    )

    provider.complete(
        system="",
        messages=[{"role": "user", "content": "hello"}],
        tools=[],
        model="llama-3.3-70b-versatile",
        max_tokens=256,
    )

    assert requested_bodies[0]["model"] == GROQ_DEFAULT_MODEL
