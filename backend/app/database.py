"""Database engine, session factory and helpers."""
from __future__ import annotations

from collections.abc import Iterator

from sqlalchemy import create_engine, event
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


if DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def _enable_sqlite_foreign_keys(dbapi_connection, connection_record) -> None:
        """SQLite disables FK enforcement unless each connection opts in."""
        del connection_record
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

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
    """Bring the database to the latest Alembic revision.

    Databases created before migrations existed are stamped at the legacy
    baseline and then upgraded, preserving their data.
    """
    from pathlib import Path

    from alembic import command
    from alembic.config import Config
    from sqlalchemy import inspect

    from . import models  # noqa: F401  (ensures models are registered on Base)

    backend_dir = Path(__file__).resolve().parents[1]
    cfg = Config(str(backend_dir / "alembic.ini"))
    cfg.set_main_option("script_location", str(backend_dir / "migrations"))
    cfg.set_main_option("sqlalchemy.url", DATABASE_URL.replace("%", "%%"))

    tables = set(inspect(engine).get_table_names())
    if "agents" in tables and "alembic_version" not in tables:
        command.stamp(cfg, "0001")
    command.upgrade(cfg, "head")
