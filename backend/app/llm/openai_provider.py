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
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Any

import httpx

from .base import LLMResult, RateLimitedError, ToolCall, ToolCallFormatError

logger = logging.getLogger("agentforge.llm")

# Free tiers (Groq especially) rate-limit aggressively; a couple of short
# retries turn a hard failure into a small pause.
_MAX_RETRIES = 3
# Resamples when the model writes a tool call the provider can't parse.
_MAX_TOOL_RETRIES = 3
# Longest we'll block a request waiting out a burst limit.
_MAX_RETRY_WAIT = 10.0

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


def _retry_after_seconds(resp: httpx.Response) -> float | None:
    """Seconds from a Retry-After header, or None when absent/unparseable.

    RFC 9110 allows either a delay in seconds or an HTTP date; providers use
    both, so handle each.
    """
    raw = resp.headers.get("retry-after")
    if not raw:
        return None
    try:
        return float(raw)
    except ValueError:
        pass
    try:
        when = parsedate_to_datetime(raw)
    except (TypeError, ValueError):
        return None
    if when is None:
        return None
    if when.tzinfo is None:
        when = when.replace(tzinfo=timezone.utc)
    return max(0.0, (when - datetime.now(timezone.utc)).total_seconds())


def _humanise(seconds: float) -> str:
    if seconds < 90:
        return f"{int(seconds)} seconds"
    minutes = round(seconds / 60)
    if minutes < 60:
        return f"{minutes} minutes"
    hours = seconds / 3600
    return f"{hours:.1f} hours"


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

    @staticmethod
    def _is_tool_use_failed(resp: httpx.Response) -> bool:
        """Did the provider reject the model's own malformed tool call?

        Groq validates tool calls server-side. When the model writes the call
        into the text instead of returning it structured, Groq answers 400 with
        code=tool_use_failed. That is the model misbehaving, not a bad request
        from us — and it is worth resampling.
        """
        try:
            return resp.json().get("error", {}).get("code") == "tool_use_failed"
        except Exception:
            return False

    def _post_with_retry(self, body: dict[str, Any]) -> dict[str, Any]:
        """POST the completion, retrying on 429 and on malformed tool calls."""
        rate_limited = 0
        tool_failures = 0

        while True:
            resp = httpx.post(
                self._url,
                headers={"Authorization": f"Bearer {self._api_key}"},
                json=body,
                timeout=120.0,
            )

            # --- rate limited ---------------------------------------------
            if resp.status_code == 429:
                retry_after = _retry_after_seconds(resp)

                # Two very different limits arrive as the same 429. A burst
                # limit (tokens *per minute*) clears in seconds and is worth
                # waiting out. A long-window quota (Groq's free tier bills
                # 100k tokens *per day*) answers Retry-After in the tens of
                # minutes — no number of short retries will clear it, so stop
                # immediately and tell the user the real wait instead of
                # burning 30s to report "wait a few seconds".
                if retry_after is not None and retry_after > _MAX_RETRY_WAIT:
                    logger.warning(
                        "%s quota exhausted (retry-after=%.0fs): %s",
                        self.name,
                        retry_after,
                        resp.text[:400],
                    )
                    raise RateLimitedError(
                        f"{self.name}'s free tier is out of quota right now — "
                        f"try again in about {_humanise(retry_after)}."
                    )

                rate_limited += 1
                wait = min(retry_after or (2 * rate_limited), _MAX_RETRY_WAIT)
                logger.warning(
                    "%s rate-limited (429); retry %d/%d in %.1fs",
                    self.name,
                    rate_limited,
                    _MAX_RETRIES,
                    wait,
                )
                if rate_limited >= _MAX_RETRIES:
                    raise RateLimitedError(
                        f"{self.name} is rate-limited right now (free tier). "
                        "Wait a few seconds and try again."
                    )
                time.sleep(wait)
                continue

            # --- model botched the tool-call syntax: resample --------------
            # Sampling is stochastic, so an identical request usually succeeds
            # on the next attempt. No backoff: nothing is throttling us.
            if resp.status_code == 400 and self._is_tool_use_failed(resp):
                tool_failures += 1
                logger.warning(
                    "%s rejected a malformed tool call (tool_use_failed); "
                    "resample %d/%d",
                    self.name,
                    tool_failures,
                    _MAX_TOOL_RETRIES,
                )
                if tool_failures >= _MAX_TOOL_RETRIES:
                    raise ToolCallFormatError(
                        "The model kept returning a malformed tool call "
                        f"({self._default_model} on {self.name} does this "
                        "occasionally). Try rephrasing the task."
                    )
                continue

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
