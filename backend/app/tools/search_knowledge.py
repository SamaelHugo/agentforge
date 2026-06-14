"""search_knowledge — semantic search over the agent's knowledge base (RAG)."""
from __future__ import annotations

from typing import Any

from ..rag import search
from .base import ToolContext, ToolResult


class SearchKnowledgeTool:
    name = "search_knowledge"
    label = "Search Knowledge"
    description = (
        "Semantic search over the agent's uploaded documents. Use this to ground "
        "answers in the knowledge base before responding. Returns the most "
        "relevant passages with their source and similarity score."
    )
    icon = "search"
    accent = "cyan"
    input_schema: dict[str, Any] = {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "What to look for in the knowledge base.",
            }
        },
        "required": ["query"],
    }

    def run(self, ctx: ToolContext, query: str = "", **_: Any) -> ToolResult:
        hits = search(ctx.db, agent_id=ctx.agent.id, query=query)
        if not hits:
            return ToolResult(
                output="No relevant documents found in the knowledge base.",
                data={"query": query, "hits": []},
            )

        lines = []
        for i, hit in enumerate(hits, start=1):
            lines.append(
                f"[{i}] ({hit.filename}, similarity {hit.score:.3f})\n{hit.content}"
            )
        return ToolResult(
            output="\n\n".join(lines),
            data={"query": query, "hits": [h.as_dict() for h in hits]},
        )
