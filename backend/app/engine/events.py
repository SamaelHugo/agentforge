"""Trace event factories.

Each event is a ``{"type": ..., "content": {...}}`` dict. Step events
(thinking / tool_call / result / error / final) are persisted as `RunStep`
rows and streamed to the client. The router adds stream-only meta events
(`start` / `done`) around them.
"""
from __future__ import annotations

from typing import Any

# step event types (also the RunStep.type values)
THINKING = "thinking"
TOOL_CALL = "tool_call"
RESULT = "result"
ERROR = "error"
FINAL = "final"

# stream-only meta events (not persisted)
START = "start"
DONE = "done"


def thinking(text: str) -> dict[str, Any]:
    return {"type": THINKING, "content": {"text": text}}


def tool_call(tool: str, tool_input: dict[str, Any]) -> dict[str, Any]:
    return {"type": TOOL_CALL, "content": {"tool": tool, "input": tool_input}}


def result(tool: str, output: str, data: dict[str, Any] | None = None) -> dict[str, Any]:
    return {"type": RESULT, "content": {"tool": tool, "output": output, "data": data or {}}}


def error(message: str, tool: str | None = None) -> dict[str, Any]:
    return {"type": ERROR, "content": {"message": message, "tool": tool}}


def final(text: str) -> dict[str, Any]:
    return {"type": FINAL, "content": {"text": text}}
