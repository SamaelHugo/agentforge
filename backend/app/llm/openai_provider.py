"""OpenAI-compatible Chat Completions provider.

Works against any OpenAI-compatible endpoint by varying ``base_url`` — used here
for OpenAI, **Groq** (free Llama models), and Gemini's OpenAI-compatible API.
Speaks the engine's Anthropic-style message format by translating to/from the
OpenAI shape. Raw HTTP (httpx), no extra SDK.
"""
from __future__ import annotations

import json
import logging
import time
from typing import Any

import httpx

from .base import LLMResult, RateLimitedError, ToolCall

logger = logging.getLogger("agentforge.llm")

# Free tiers (Groq especially) rate-limit aggressively; a couple of short
# retries turn a hard failure into a small pause.
_MAX_RETRIES = 3

OPENAI_PREFIXES = ("gpt-", "o1", "o3", "o4", "chatgpt")
GROQ_PREFIXES = (
    "llama",
    "mixtral",
    "gemma",
    "deepseek",
    "qwen",
    "kimi",
    "moonshot",
    "gpt-oss",
    "openai/",
)
GEMINI_PREFIXES = ("gemini", "gemma")


def _stringify(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "".join(
            b.get("text", "")
            for b in content
            if isinstance(b, dict) and b.get("type") == "text"
        )
    return str(content or "")


def _assistant_blocks_to_openai(blocks: list) -> dict:
    """Anthropic assistant content blocks -> one OpenAI assistant message."""
    text_parts: list[str] = []
    tool_calls: list[dict] = []
    for b in blocks:
        if not isinstance(b, dict):
            continue
        if b.get("type") == "text":
            text_parts.append(b.get("text", ""))
        elif b.get("type") == "tool_use":
            tool_calls.append(
                {
                    "id": b.get("id"),
                    "type": "function",
                    "function": {
                        "name": b.get("name"),
                        "arguments": json.dumps(b.get("input") or {}),
                    },
                }
            )
    msg: dict[str, Any] = {"role": "assistant", "content": "".join(text_parts) or None}
    if tool_calls:
        msg["tool_calls"] = tool_calls
    return msg


def to_openai_messages(system: str, messages: list[dict]) -> list[dict]:
    out: list[dict] = []
    if system:
        out.append({"role": "system", "content": system})
    for m in messages:
        role = m.get("role")
        content = m.get("content")
        if role == "assistant":
            out.append(
                _assistant_blocks_to_openai(content)
                if isinstance(content, list)
                else {"role": "assistant", "content": content or ""}
            )
        elif role == "system":
            out.append({"role": "system", "content": _stringify(content)})
        else:  # user
            if isinstance(content, list):
                texts: list[str] = []
                for b in content:
                    if not isinstance(b, dict):
                        continue
                    if b.get("type") == "tool_result":
                        out.append(
                            {
                                "role": "tool",
                                "tool_call_id": b.get("tool_use_id"),
                                "content": _stringify(b.get("content")),
                            }
                        )
                    elif b.get("type") == "text":
                        texts.append(b.get("text", ""))
                if texts:
                    out.append({"role": "user", "content": "\n".join(texts)})
            else:
                out.append({"role": "user", "content": content or ""})
    return out


def to_openai_tools(tools: list[dict]) -> list[dict]:
    return [
        {
            "type": "function",
            "function": {
                "name": t["name"],
                "description": t.get("description", ""),
                "parameters": t.get("input_schema") or {"type": "object", "properties": {}},
            },
        }
        for t in tools
    ]


class OpenAIProvider:
    """Generic OpenAI-compatible provider (OpenAI / Groq / Gemini / …)."""

    def __init__(
        self,
        api_key: str,
        *,
        base_url: str = "https://api.openai.com/v1",
        default_model: str = "gpt-4o-mini",
        name: str = "openai",
        model_prefixes: tuple[str, ...] = OPENAI_PREFIXES,
    ) -> None:
        self.name = name
        self._api_key = api_key
        self._url = base_url.rstrip("/") + "/chat/completions"
        self._default_model = default_model
        self._prefixes = tuple(p.lower() for p in model_prefixes)

    def _post_with_retry(self, body: dict[str, Any]) -> dict[str, Any]:
        """POST the completion, retrying briefly on 429 (free-tier rate limits)."""
        for attempt in range(_MAX_RETRIES):
            resp = httpx.post(
                self._url,
                headers={"Authorization": f"Bearer {self._api_key}"},
                json=body,
                timeout=120.0,
            )
            if resp.status_code != 429:
                if resp.status_code >= 400:
                    # The provider's body explains *why* — keep it in the logs
                    # (never in the user-facing trace).
                    logger.error(
                        "%s %s returned %s: %s",
                        self.name,
                        self._url,
                        resp.status_code,
                        resp.text[:800],
                    )
                resp.raise_for_status()
                return resp.json()

            # Honour Retry-After when present, otherwise back off gently.
            wait = float(resp.headers.get("retry-after") or (2 * (attempt + 1)))
            wait = min(wait, 10.0)
            logger.warning(
                "%s rate-limited (429); retry %d/%d in %.1fs",
                self.name,
                attempt + 1,
                _MAX_RETRIES,
                wait,
            )
            if attempt == _MAX_RETRIES - 1:
                break
            time.sleep(wait)

        raise RateLimitedError(
            f"{self.name} is rate-limited right now (free tier). Wait a few seconds and try again."
        )

    def complete(
        self,
        *,
        system: str,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]],
        model: str,
        max_tokens: int,
        effort: str | None = None,
    ) -> LLMResult:
        # Use the agent's model only if it belongs to this endpoint's family,
        # otherwise fall back to the configured default (e.g. a seeded "gpt-*"
        # value when the active endpoint is Groq).
        use_model = (
            model if (model and model.lower().startswith(self._prefixes)) else self._default_model
        )
        body: dict[str, Any] = {
            "model": use_model,
            "messages": to_openai_messages(system, messages),
            "max_tokens": max_tokens,
        }
        if tools:
            body["tools"] = to_openai_tools(tools)
            body["tool_choice"] = "auto"

        data = self._post_with_retry(body)
        message = data["choices"][0]["message"]

        text = message.get("content") or ""
        tool_calls: list[ToolCall] = []
        raw_blocks: list[dict] = []
        if text:
            raw_blocks.append({"type": "text", "text": text})
        for tc in message.get("tool_calls") or []:
            fn = tc.get("function", {})
            try:
                args = json.loads(fn.get("arguments") or "{}")
            except json.JSONDecodeError:
                args = {}
            tool_calls.append(ToolCall(id=tc.get("id"), name=fn.get("name"), input=args))
            raw_blocks.append(
                {"type": "tool_use", "id": tc.get("id"), "name": fn.get("name"), "input": args}
            )

        usage = data.get("usage", {}) or {}
        return LLMResult(
            text=text,
            thinking="",
            tool_calls=tool_calls,
            stop_reason="tool_use" if tool_calls else "end_turn",
            raw_assistant_content=raw_blocks,
            usage={
                "input_tokens": usage.get("prompt_tokens", 0),
                "output_tokens": usage.get("completion_tokens", 0),
            },
        )
