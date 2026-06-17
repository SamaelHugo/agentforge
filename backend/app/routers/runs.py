"""Runs: stream an agent execution as Server-Sent Events, plus run history."""
from __future__ import annotations

import json
import logging
from collections.abc import Iterator
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import desc
from sqlalchemy.orm import Session

from ..database import SessionLocal, get_db
from ..engine import ReActEngine, events
from ..models import Agent, Run, RunStep
from ..ratelimit import rate_limit
from ..schemas import ChatRequest, RunDetail, RunOut, RunStepOut
from ..tools import ToolContext

router = APIRouter(prefix="/api", tags=["runs"])

logger = logging.getLogger("agentforge.runs")


def _sse(event: dict) -> str:
    """Format a trace event as a Server-Sent Event frame."""
    return f"event: {event['type']}\ndata: {json.dumps(event, default=str)}\n\n"


@router.post("/agents/{agent_id}/runs")
def stream_run(
    agent_id: str,
    body: ChatRequest,
    db: Session = Depends(get_db),
    _rl: None = Depends(rate_limit),
) -> StreamingResponse:
    agent = db.get(Agent, agent_id)
    if agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")

    run = Run(agent_id=agent_id, input=body.message, status="running")
    db.add(run)
    db.commit()
    run_id = run.id

    def generate() -> Iterator[str]:
        # Use a dedicated session for the lifetime of the stream so it isn't
        # tied to the request-scoped dependency session.
        sdb = SessionLocal()
        final_text: str | None = None
        last_error: str | None = None
        try:
            agent_row = sdb.get(Agent, agent_id)
            run_row = sdb.get(Run, run_id)

            yield _sse(
                {
                    "type": events.START,
                    "content": {"run_id": run_id, "agent_id": agent_id},
                }
            )

            ctx = ToolContext(db=sdb, agent=agent_row, run_id=run_id)
            engine = ReActEngine()

            step_index = 0
            for event in engine.run(ctx, user_message=body.message):
                sdb.add(
                    RunStep(
                        run_id=run_id,
                        step_index=step_index,
                        type=event["type"],
                        content=event["content"],
                    )
                )
                sdb.commit()
                step_index += 1

                if event["type"] == events.FINAL:
                    final_text = event["content"].get("text", "")
                elif event["type"] == events.ERROR:
                    last_error = event["content"].get("message")

                yield _sse(event)

            if final_text is not None:
                run_row.status = "completed"
                run_row.output = final_text
            else:
                run_row.status = "error"
                run_row.error = last_error or "Run ended unexpectedly."
            run_row.finished_at = datetime.now(timezone.utc)
            sdb.add(run_row)
            sdb.commit()

            yield _sse(
                {
                    "type": events.DONE,
                    "content": {
                        "run_id": run_id,
                        "status": run_row.status,
                        "output": run_row.output,
                        "error": run_row.error,
                    },
                }
            )
        except Exception:  # pragma: no cover - defensive
            logger.exception("Run %s failed unexpectedly", run_id)
            message = "The run failed unexpectedly."
            yield _sse(events.error(message))
            try:
                run_row = sdb.get(Run, run_id)
                if run_row is not None:
                    run_row.status = "error"
                    run_row.error = message
                    run_row.finished_at = datetime.now(timezone.utc)
                    sdb.add(run_row)
                    sdb.commit()
            except Exception:
                logger.exception("Failed to persist error state for run %s", run_id)
        finally:
            sdb.close()

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # disable proxy buffering (nginx)
        },
    )


@router.get("/agents/{agent_id}/runs", response_model=list[RunOut])
def list_runs(agent_id: str, db: Session = Depends(get_db)) -> list[Run]:
    if db.get(Agent, agent_id) is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    return (
        db.query(Run)
        .filter(Run.agent_id == agent_id)
        .order_by(desc(Run.started_at))
        .all()
    )


@router.get("/runs/{run_id}", response_model=RunDetail)
def get_run(run_id: str, db: Session = Depends(get_db)) -> RunDetail:
    run = db.get(Run, run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Run not found")
    return RunDetail(
        id=run.id,
        agent_id=run.agent_id,
        input=run.input,
        output=run.output,
        status=run.status,
        error=run.error,
        started_at=run.started_at,
        finished_at=run.finished_at,
        steps=[RunStepOut.model_validate(s) for s in run.steps],
    )
