"""Optional Bearer-token guard for single-tenant deployments.

AgentForge remains frictionless when ``API_AUTH_TOKEN`` is unset. Setting it
protects every data-bearing API route while leaving health checks public. This
is a deployment guard, not a replacement for real multi-user identity and
tenant isolation.
"""
from __future__ import annotations

import secrets

from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .config import get_settings

_bearer = HTTPBearer(auto_error=False)


def require_api_auth(
    credentials: HTTPAuthorizationCredentials | None = Security(_bearer),
) -> None:
    expected = get_settings().api_auth_token
    if not expected:
        return

    supplied = credentials.credentials if credentials is not None else ""
    valid = (
        credentials is not None
        and credentials.scheme.lower() == "bearer"
        and secrets.compare_digest(supplied, expected)
    )
    if not valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="A valid AgentForge access token is required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
