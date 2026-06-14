"""AgentForge FastAPI application."""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .database import SessionLocal, init_db
from .routers import agents, documents, runs
from .seed import seed_if_empty

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    if settings.seed_on_startup:
        db = SessionLocal()
        try:
            seed_if_empty(db)
        finally:
            db.close()
    yield


app = FastAPI(
    title="AgentForge API",
    version="1.0.0",
    description="AI agent platform — custom ReAct engine, RAG, and real-time execution tracing.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,  # no cookies/credentials are used; avoids wildcard+creds foot-gun
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agents.router)
app.include_router(documents.router)
app.include_router(runs.router)


@app.get("/api/health", tags=["meta"])
def health() -> dict:
    return {
        "status": "ok",
        "llm_provider": settings.resolved_llm_provider,
        "embeddings_provider": settings.resolved_embeddings_provider,
        "default_model": settings.default_model,
    }


@app.get("/", tags=["meta"])
def root() -> dict:
    return {
        "name": "AgentForge API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health",
    }
