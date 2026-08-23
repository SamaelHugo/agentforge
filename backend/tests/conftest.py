from __future__ import annotations

import os
import tempfile
import uuid
from collections.abc import Iterator
from pathlib import Path

import pytest

# Configure the application before importing modules that construct the global
# SQLAlchemy engine or cache settings. Every test session gets an isolated DB.
TEST_DB_PATH = Path(tempfile.gettempdir()) / f"agentforge-tests-{uuid.uuid4().hex}.db"
TEST_TOKEN = "agentforge-test-token"

os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"
os.environ["API_AUTH_TOKEN"] = TEST_TOKEN
os.environ["LLM_PROVIDER"] = "mock"
os.environ["EMBEDDINGS_PROVIDER"] = "local"
os.environ["SEED_ON_STARTUP"] = "true"
os.environ["RATE_LIMIT_PER_MIN"] = "0"
os.environ["WRITE_LIMIT_PER_MIN"] = "0"

from fastapi.testclient import TestClient  # noqa: E402

from app.database import engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client() -> Iterator[TestClient]:
    with TestClient(app) as test_client:
        yield test_client
    engine.dispose()
    TEST_DB_PATH.unlink(missing_ok=True)


@pytest.fixture(scope="session")
def auth_headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {TEST_TOKEN}"}
