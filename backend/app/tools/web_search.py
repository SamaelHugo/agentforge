"""web_search — mock external web search (deterministic).

A stand-in for an external integration. It returns plausible, deterministic
results derived from the query so the agent can demonstrate combining internal
knowledge with "external" sources without any third-party API.
"""
from __future__ import annotations

from typing import Any

from .base import ToolContext, ToolResult


class WebSearchTool:
    name = "web_search"
    label = "Web Search"
    description = (
        "Search the web for up-to-date information (mock integration). Use when "
        "the answer may depend on recent or external information not in the "
        "knowledge base."
    )
    icon = "globe"
    accent = "amber"
    input_schema: dict[str, Any] = {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "The search query."}
        },
        "required": ["query"],
    }

    def run(self, ctx: ToolContext, query: str = "", **_: Any) -> ToolResult:
        q = query.strip() or "your topic"
        slug = "-".join(q.lower().split())[:60] or "result"
        results = [
            {
                "title": f"{q.title()} — Industry Overview (2026)",
                "url": f"https://example.com/insights/{slug}",
                "snippet": (
                    f"A comprehensive overview of {q}, covering current trends, "
                    "best practices, and what teams are adopting in 2026."
                ),
            },
            {
                "title": f"How leading teams approach {q}",
                "url": f"https://example.com/guides/{slug}",
                "snippet": (
                    f"Practical guidance and case studies on {q}, with concrete "
                    "examples and measurable outcomes."
                ),
            },
            {
                "title": f"{q.title()}: Frequently Asked Questions",
                "url": f"https://example.com/faq/{slug}",
                "snippet": f"Answers to the most common questions about {q}.",
            },
        ]
        formatted = "\n\n".join(
            f"[{i}] {r['title']}\n{r['url']}\n{r['snippet']}"
            for i, r in enumerate(results, start=1)
        )
        return ToolResult(output=formatted, data={"query": q, "results": results})
