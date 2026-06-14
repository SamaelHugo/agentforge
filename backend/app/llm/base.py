"""Provider-agnostic LLM types.

The engine drives a manual ReAct loop, so a provider only needs to produce a
*single* completion. It receives the conversation in Anthropic message format
and returns the parsed thinking / text / tool calls plus the raw assistant
content blocks (so the engine can replay them on the next turn — required for
extended thinking + tool use).
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol, runtime_checkable


@dataclass
class ToolCall:
    id: str
    name: str
    input: dict[str, Any]


@dataclass
class LLMResult:
    text: str = ""
    thinking: str = ""
    tool_calls: list[ToolCall] = field(default_factory=list)
    stop_reason: str = "end_turn"  # "tool_use" | "end_turn" | "max_tokens" | ...
    raw_assistant_content: list[dict] = field(default_factory=list)
    usage: dict[str, int] = field(default_factory=dict)


@runtime_checkable
class LLMProvider(Protocol):
    name: str

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
        ...
