"""Simple in-memory, per-IP rate limits for the public demo.

A fixed 60-second sliding window keyed by client IP, split into independent
buckets: runs burn the free LLM quota, writes just litter the demo, so they get
separate budgets. Good enough to blunt abuse on a single-instance free
deployment (the free LLM tier is rate-limited too).

Not a security boundary — the demo has no auth. It only raises the cost of
casual abuse.
"""
from __future__ import annotations

import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request

from .config import get_settings

_WINDOW = 60.0
# bucket -> client ip -> hit timestamps
_hits: dict[str, dict[str, deque[float]]] = defaultdict(lambda: defaultdict(deque))


def _client_ip(request: Request) -> str:
    # Render/most proxies set X-Forwarded-For: "<client>, <proxy>, ..."
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _enforce(bucket_name: str, request: Request, limit: int) -> None:
    if limit <= 0:  # 0 disables the limit
        return

    now = time.time()
    bucket = _hits[bucket_name][_client_ip(request)]
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


def rate_limit(request: Request) -> None:
    """Agent runs — the expensive path (each one spends free LLM quota)."""
    _enforce("runs", request, get_settings().rate_limit_per_min)


def write_limit(request: Request) -> None:
    """Mutations — cheap to serve, but trivially abusable on an open demo."""
    _enforce("writes", request, get_settings().write_limit_per_min)
