"""Pydantic request/response schemas — the public API contract."""
from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


# ── Tools ───────────────────────────────────────────────────────────────
class ToolConfig(BaseModel):
    tool_name: str
    config: dict[str, Any] = Field(default_factory=dict)


class ToolInfo(BaseModel):
    """Catalog entry describing an available tool."""

    name: str
    label: str
    description: str
    icon: str
    accent: str  # "cyan" | "violet" | "green" | "amber"


# ── Agents ──────────────────────────────────────────────────────────────
class AgentBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str = ""
    system_prompt: str = ""
    model: str = "claude-opus-4-8"
    settings: dict[str, Any] = Field(default_factory=dict)


class AgentCreate(AgentBase):
    tools: list[str] = Field(default_factory=list)


class AgentUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=120)
    description: str | None = None
    system_prompt: str | None = None
    model: str | None = None
    settings: dict[str, Any] | None = None
    status: str | None = None
    tools: list[str] | None = None


class AgentOut(AgentBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    status: str
    tools: list[str] = Field(default_factory=list)
    run_count: int = 0
    document_count: int = 0
    last_run_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


# ── Documents / Knowledge Base ──────────────────────────────────────────
class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    agent_id: str
    filename: str
    size: int
    chunk_count: int
    created_at: datetime


class TextDocumentCreate(BaseModel):
    filename: str = Field(min_length=1, max_length=255)
    content: str = Field(min_length=1, max_length=1_000_000)


# ── Runs ────────────────────────────────────────────────────────────────
class RunStepOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    step_index: int
    type: str
    content: dict[str, Any]
    created_at: datetime


class RunOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    agent_id: str
    input: str
    output: str
    status: str
    error: str | None = None
    started_at: datetime
    finished_at: datetime | None = None


class RunDetail(RunOut):
    steps: list[RunStepOut] = Field(default_factory=list)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=8000)
