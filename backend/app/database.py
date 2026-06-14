"""Database engine, session factory and helpers."""
from __future__ import annotations

from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import get_settings

settings = get_settings()


def _normalize_db_url(url: str) -> str:
    """Normalize managed-Postgres URLs to the psycopg (v3) driver.

    Railway / Render / Supabase / Heroku hand out ``postgres://`` or
    ``postgresql://`` URLs, which SQLAlchemy maps to the psycopg2 driver. We
    ship psycopg v3, so rewrite the scheme. URLs that already pin a driver
    (e.g. ``postgresql+psycopg://``) or use another backend are left untouched.
    """
    if url.startswith("postgres://"):
        return "postgresql+psycopg://" + url[len("postgres://") :]
    if url.startswith("postgresql://"):
        return "postgresql+psycopg://" + url[len("postgresql://") :]
    return url


DATABASE_URL = _normalize_db_url(settings.database_url)

_connect_args: dict = {}
if DATABASE_URL.startswith("sqlite"):
    # allow the SSE generator (runs in a worker thread) to reuse the session
    _connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    connect_args=_connect_args,
    pool_pre_ping=True,
    future=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    pass


def get_db() -> Iterator[Session]:
    """FastAPI dependency that yields a scoped session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables. Imported lazily to register the models first."""
    from . import models  # noqa: F401  (ensures models are registered on Base)

    Base.metadata.create_all(bind=engine)
