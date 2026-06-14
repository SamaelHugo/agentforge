"""ORM → Pydantic serialization helpers."""
from __future__ import annotations

from .models import Agent
from .schemas import AgentOut


def agent_out(agent: Agent) -> AgentOut:
    runs = agent.runs
    return AgentOut(
        id=agent.id,
        name=agent.name,
        description=agent.description or "",
        system_prompt=agent.system_prompt or "",
        model=agent.model,
        settings=agent.settings or {},
        status=agent.status,
        tools=[t.tool_name for t in agent.tools],
        run_count=len(runs),
        document_count=len(agent.documents),
        last_run_at=max((r.started_at for r in runs), default=None),
        created_at=agent.created_at,
        updated_at=agent.updated_at,
    )
