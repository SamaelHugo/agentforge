"""Agent CRUD + tool catalog + artifacts."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Agent, AgentTool, Artifact
from ..schemas import AgentCreate, AgentOut, AgentUpdate, ToolInfo
from ..serializers import agent_out
from ..tools import get_tool, tool_catalog

router = APIRouter(prefix="/api", tags=["agents"])


@router.get("/tools", response_model=list[ToolInfo])
def list_tools() -> list[dict]:
    return tool_catalog()


@router.get("/agents", response_model=list[AgentOut])
def list_agents(db: Session = Depends(get_db)) -> list[AgentOut]:
    agents = db.query(Agent).order_by(desc(Agent.created_at)).all()
    return [agent_out(a) for a in agents]


@router.post("/agents", response_model=AgentOut, status_code=status.HTTP_201_CREATED)
def create_agent(payload: AgentCreate, db: Session = Depends(get_db)) -> AgentOut:
    agent = Agent(
        name=payload.name,
        description=payload.description,
        system_prompt=payload.system_prompt,
        model=payload.model,
        settings=payload.settings,
    )
    for name in payload.tools:
        if get_tool(name) is not None:
            agent.tools.append(AgentTool(tool_name=name, config={}))
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent_out(agent)


def _get_agent_or_404(db: Session, agent_id: str) -> Agent:
    agent = db.get(Agent, agent_id)
    if agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.get("/agents/{agent_id}", response_model=AgentOut)
def get_agent(agent_id: str, db: Session = Depends(get_db)) -> AgentOut:
    return agent_out(_get_agent_or_404(db, agent_id))


@router.patch("/agents/{agent_id}", response_model=AgentOut)
def update_agent(
    agent_id: str, payload: AgentUpdate, db: Session = Depends(get_db)
) -> AgentOut:
    agent = _get_agent_or_404(db, agent_id)

    data = payload.model_dump(exclude_unset=True)
    if "tools" in data:
        new_tools = data.pop("tools") or []
        agent.tools.clear()
        for name in new_tools:
            if get_tool(name) is not None:
                agent.tools.append(AgentTool(tool_name=name, config={}))
    for key, value in data.items():
        setattr(agent, key, value)

    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent_out(agent)


@router.delete("/agents/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_agent(agent_id: str, db: Session = Depends(get_db)):
    agent = _get_agent_or_404(db, agent_id)
    db.delete(agent)
    db.commit()


@router.get("/agents/{agent_id}/artifacts")
def list_artifacts(agent_id: str, db: Session = Depends(get_db)) -> list[dict]:
    _get_agent_or_404(db, agent_id)
    rows = (
        db.query(Artifact)
        .filter(Artifact.agent_id == agent_id)
        .order_by(desc(Artifact.created_at))
        .all()
    )
    return [
        {
            "id": a.id,
            "kind": a.kind,
            "title": a.title,
            "content": a.content,
            "data": a.data,
            "run_id": a.run_id,
            "created_at": a.created_at.isoformat(),
        }
        for a in rows
    ]
