"""Tool protocol, execution context, and result type."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol, runtime_checkable

from sqlalchemy.orm import Session


@dataclass
class ToolContext:
    """Everything a tool needs to execute, injected by the engine."""

    db: Session
    agent: Any  # models.Agent (avoid circular import)
    run_id: str | None = None


@dataclass
class ToolResult:
    output: str  # text returned to the model as the tool_result
    data: dict[str, Any] = field(default_factory=dict)  # rich payload for the UI trace


@runtime_checkable
class Tool(Protocol):
    name: str
    label: str
    description: str
    icon: str
    accent: str
    input_schema: dict[str, Any]

    def run(self, ctx: ToolContext, **kwargs: Any) -> ToolResult:
        ...
