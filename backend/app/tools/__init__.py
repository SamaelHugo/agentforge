"""Tool registry and catalog."""
from __future__ import annotations

from typing import Any

from .base import Tool, ToolContext, ToolResult
from .draft_email import DraftEmailTool
from .save_to_db import SaveToDbTool
from .search_knowledge import SearchKnowledgeTool
from .web_search import WebSearchTool

_REGISTRY: dict[str, Tool] = {
    tool.name: tool
    for tool in (
        SearchKnowledgeTool(),
        DraftEmailTool(),
        SaveToDbTool(),
        WebSearchTool(),
    )
}


def get_tool(name: str) -> Tool | None:
    return _REGISTRY.get(name)


def all_tools() -> list[Tool]:
    return list(_REGISTRY.values())


def tool_catalog() -> list[dict[str, str]]:
    """Catalog for the UI (used by the agent builder and trace legend)."""
    return [
        {
            "name": t.name,
            "label": t.label,
            "description": t.description,
            "icon": t.icon,
            "accent": t.accent,
        }
        for t in _REGISTRY.values()
    ]


def build_tool_schemas(names: list[str]) -> list[dict[str, Any]]:
    """Anthropic-format tool definitions for the requested tools."""
    schemas: list[dict[str, Any]] = []
    for name in names:
        tool = _REGISTRY.get(name)
        if tool is None:
            continue
        schemas.append(
            {
                "name": tool.name,
                "description": tool.description,
                "input_schema": tool.input_schema,
            }
        )
    return schemas


__all__ = [
    "Tool",
    "ToolContext",
    "ToolResult",
    "get_tool",
    "all_tools",
    "tool_catalog",
    "build_tool_schemas",
]
