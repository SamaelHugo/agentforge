"""Simple in-memory, per-IP rate limit for the public demo run endpoint.

A fixed 60-second sliding window keyed by client IP. Good enough to blunt abuse
on a single-instance free deployment (the free LLM tier is rate-limited too).
"""
from __future__ import annotations

import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request

from .config import get_settings

_WINDOW = 60.0
_hits: dict[str, deque[float]] = defaultdict(deque)


def _client_ip(request: Request) -> str:
    # Railway/most proxies set X-Forwarded-For: "<client>, <proxy>, ..."
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def rate_limit(request: Request) -> None:
    """FastAPI dependency — raises 429 when the per-IP window is exceeded."""
    limit = get_settings().rate_limit_per_min
    if limit <= 0:
        return

    now = time.time()
    bucket = _hits[_client_ip(request)]
    while bucket and now - bucket[0] > _WINDOW:
        bucket.popleft()

    if len(bucket) >= limit:
        retry_after = int(_WINDOW - (now - bucket[0])) + 1
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded — please wait a moment before trying again.",
            headers={"Retry-After": str(retry_after)},
        )

    bucket.append(now)
