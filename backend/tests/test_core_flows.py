from __future__ import annotations

import json

from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.models import Artifact


def _events(response_text: str) -> list[dict]:
    return [
        json.loads(line.removeprefix("data:").strip())
        for line in response_text.splitlines()
        if line.startswith("data:")
    ]


def _agent_id(client: TestClient, headers: dict[str, str], name: str) -> str:
    response = client.get("/api/agents", headers=headers)
    response.raise_for_status()
    return next(agent["id"] for agent in response.json() if agent["name"] == name)


def test_health_is_public_but_data_routes_require_token(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    health = client.get("/api/health")
    assert health.status_code == 200
    assert health.json()["auth_required"] is True

    assert client.get("/api/agents").status_code == 401
    assert (
        client.get(
            "/api/agents", headers={"Authorization": "Bearer wrong"}
        ).status_code
        == 401
    )
    assert client.get("/api/agents", headers=auth_headers).status_code == 200


def test_offline_react_stream_uses_knowledge_result_not_save_confirmation(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    agent_id = _agent_id(client, auth_headers, "Support Agent")
    response = client.post(
        f"/api/agents/{agent_id}/runs",
        headers=auth_headers,
        json={
            "history": [
                {"role": "user", "content": "What product is this?"},
                {
                    "role": "assistant",
                    "content": "Northwind Cloud is a data integration platform.",
                },
            ],
            "message": "How often do syncs run on the Growth tier?",
        },
    )
    response.raise_for_status()

    events = _events(response.text)
    event_types = [event["type"] for event in events]
    final_text = next(
        event["content"]["text"] for event in events if event["type"] == "final"
    )

    assert event_types[0] == "start"
    assert "tool_call" in event_types
    assert event_types[-1] == "done"
    assert "Northwind Cloud" in final_text
    assert "How often do syncs run" in final_text
    assert not final_text.lstrip().startswith("> Saved")


def test_unconfigured_web_search_never_fabricates_sources(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    agent_id = _agent_id(client, auth_headers, "Research Assistant")
    response = client.post(
        f"/api/agents/{agent_id}/runs",
        headers=auth_headers,
        json={"message": "Research the current AI agent market."},
    )
    response.raise_for_status()

    events = _events(response.text)
    web_result = next(
        event
        for event in events
        if event["type"] == "result" and event["content"]["tool"] == "web_search"
    )
    assert web_result["content"]["data"]["available"] is False
    assert web_result["content"]["data"]["results"] == []
    assert "example.com" not in response.text


def test_deleting_agent_cascades_its_artifacts(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    created = client.post(
        "/api/agents",
        headers=auth_headers,
        json={
            "name": "Cascade test agent",
            "description": "Temporary regression-test agent",
            "system_prompt": "Save the requested record.",
            "model": "mock",
            "tools": ["save_to_db"],
        },
    )
    created.raise_for_status()
    agent_id = created.json()["id"]

    run = client.post(
        f"/api/agents/{agent_id}/runs",
        headers=auth_headers,
        json={"message": "Save this regression-test record."},
    )
    run.raise_for_status()

    artifacts = client.get(
        f"/api/agents/{agent_id}/artifacts", headers=auth_headers
    )
    artifacts.raise_for_status()
    assert len(artifacts.json()) == 1

    deleted = client.delete(f"/api/agents/{agent_id}", headers=auth_headers)
    assert deleted.status_code == 204

    with SessionLocal() as db:
        assert db.query(Artifact).filter(Artifact.agent_id == agent_id).count() == 0
