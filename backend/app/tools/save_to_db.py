"""save_to_db — persist a result (tool use with real side effects)."""
from __future__ import annotations

from typing import Any

from ..models import Artifact
from .base import ToolContext, ToolResult


class SaveToDbTool:
    name = "save_to_db"
    label = "Save to DB"
    description = (
        "Persist a result to the database so it's available for later review and "
        "downstream steps. Provide a title and the content to store."
    )
    icon = "database"
    accent = "green"
    input_schema: dict[str, Any] = {
        "type": "object",
        "properties": {
            "title": {"type": "string", "description": "Short title for the record."},
            "content": {"type": "string", "description": "The content to store."},
            "kind": {
                "type": "string",
                "description": "Optional category, e.g. 'lead', 'report', 'note'.",
            },
        },
        "required": ["title", "content"],
    }

    def run(
        self,
        ctx: ToolContext,
        title: str = "",
        content: str = "",
        kind: str = "record",
        **extra: Any,
    ) -> ToolResult:
        artifact = Artifact(
            agent_id=ctx.agent.id,
            run_id=ctx.run_id,
            kind=kind or "record",
            title=title or "Untitled",
            content=content,
            data=extra,
        )
        ctx.db.add(artifact)
        ctx.db.commit()
        ctx.db.refresh(artifact)
        return ToolResult(
            output=f"Saved '{artifact.title}' to the database (id={artifact.id}).",
            data={"artifact_id": artifact.id, "title": artifact.title, "kind": artifact.kind},
        )
