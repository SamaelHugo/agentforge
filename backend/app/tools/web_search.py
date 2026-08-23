"""web_search — real Tavily search when configured, honest fallback otherwise."""
from __future__ import annotations

import logging
from typing import Any

import httpx

from ..config import get_settings
from .base import ToolContext, ToolResult

logger = logging.getLogger("agentforge.tools")


class WebSearchTool:
    name = "web_search"
    label = "Web Search"
    description = (
        "Search the live web for up-to-date information through Tavily. Use when "
        "the answer may depend on recent or external information. If Tavily is "
        "not configured, the tool reports that clearly and returns no sources."
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
        api_key = get_settings().tavily_api_key
        if not api_key:
            message = (
                "Live web search is not configured. Set TAVILY_API_KEY on the "
                "backend, or answer using the knowledge base and state that no "
                "external sources were checked."
            )
            return ToolResult(
                output=message,
                data={"query": q, "results": [], "available": False},
            )

        try:
            response = httpx.post(
                "https://api.tavily.com/search",
                json={
                    "api_key": api_key,
                    "query": q,
                    "search_depth": "basic",
                    "max_results": 5,
                    "include_answer": False,
                    "include_raw_content": False,
                },
                timeout=30.0,
            )
            response.raise_for_status()
            payload = response.json()
        except (httpx.HTTPError, ValueError):
            logger.exception("Tavily search failed")
            message = "Live web search failed. No external sources were retrieved."
            return ToolResult(
                output=message,
                data={"query": q, "results": [], "available": False},
            )

        results = [
            {
                "title": str(item.get("title") or "Untitled result"),
                "url": str(item.get("url") or ""),
                "snippet": str(item.get("content") or ""),
            }
            for item in (payload.get("results") or [])
            if isinstance(item, dict) and item.get("url")
        ]
        if not results:
            return ToolResult(
                output="No web results were found for this query.",
                data={"query": q, "results": [], "available": True},
            )

        formatted = "\n\n".join(
            f"[{i}] {r['title']}\n{r['url']}\n{r['snippet']}"
            for i, r in enumerate(results, start=1)
        )
        return ToolResult(
            output=formatted,
            data={"query": q, "results": results, "available": True},
        )
