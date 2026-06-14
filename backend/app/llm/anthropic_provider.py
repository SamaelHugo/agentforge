"""Anthropic Claude provider.

Uses adaptive thinking (the recommended mode for Claude 4.6+), surfaces a
summarized thinking stream for the execution trace, and returns the raw content
blocks so the engine can replay thinking + tool_use on subsequent turns.

If the installed SDK predates adaptive thinking / ``output_config`` (older than
~0.5x), the request is retried without those parameters so the agent loop still
works — just without surfaced reasoning.
"""
from __future__ import annotations

import logging
from typing import Any

import anthropic

from .base import LLMResult, ToolCall

logger = logging.getLogger("agentforge.llm")


class AnthropicProvider:
    name = "anthropic"

    def __init__(self, api_key: str) -> None:
        self._client = anthropic.Anthropic(api_key=api_key)

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
        base: dict[str, Any] = {
            "model": model,
            "max_tokens": max_tokens,
            "messages": messages,
        }
        if system:
            base["system"] = system
        if tools:
            base["tools"] = tools

        # Adaptive thinking → the model decides depth; summarized so we can render
        # a readable "thinking" step in the trace.
        extra: dict[str, Any] = {"thinking": {"type": "adaptive", "display": "summarized"}}
        if effort:
            extra["output_config"] = {"effort": effort}

        try:
            resp = self._client.messages.create(**base, **extra)
        except TypeError:
            # SDK too old for adaptive thinking / output_config — degrade gracefully.
            logger.warning(
                "Anthropic SDK rejected thinking/output_config; retrying without them. "
                "Upgrade `anthropic` to surface reasoning."
            )
            resp = self._client.messages.create(**base)

        thinking_parts: list[str] = []
        text_parts: list[str] = []
        tool_calls: list[ToolCall] = []
        raw: list[dict] = []

        for block in resp.content:
            raw.append(block.model_dump(exclude_none=True))
            btype = block.type
            if btype == "thinking":
                if getattr(block, "thinking", None):
                    thinking_parts.append(block.thinking)
            elif btype == "text":
                text_parts.append(block.text)
            elif btype == "tool_use":
                tool_calls.append(
                    ToolCall(id=block.id, name=block.name, input=dict(block.input))
                )

        usage = {
            "input_tokens": getattr(resp.usage, "input_tokens", 0),
            "output_tokens": getattr(resp.usage, "output_tokens", 0),
        }

        return LLMResult(
            text="\n".join(text_parts).strip(),
            thinking="\n".join(thinking_parts).strip(),
            tool_calls=tool_calls,
            stop_reason=resp.stop_reason or "end_turn",
            raw_assistant_content=raw,
            usage=usage,
        )
