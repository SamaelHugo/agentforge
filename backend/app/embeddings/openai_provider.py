"""OpenAI embeddings (text-embedding-3-small) via raw HTTP.

Optional production backend. Only used when OPENAI_API_KEY is set and
EMBEDDINGS_PROVIDER resolves to "openai".
"""
from __future__ import annotations

import httpx

_MODEL = "text-embedding-3-small"
_DIM = 1536
_URL = "https://api.openai.com/v1/embeddings"


class OpenAIEmbedder:
    name = "openai"

    def __init__(self, api_key: str, dim: int = _DIM) -> None:
        self._api_key = api_key
        self.dim = dim

    def _request(self, inputs: list[str]) -> list[list[float]]:
        resp = httpx.post(
            _URL,
            headers={"Authorization": f"Bearer {self._api_key}"},
            json={"model": _MODEL, "input": inputs},
            timeout=60.0,
        )
        resp.raise_for_status()
        data = resp.json()["data"]
        data.sort(key=lambda d: d["index"])
        return [d["embedding"] for d in data]

    def embed(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        # batch in chunks to stay within request limits
        out: list[list[float]] = []
        for i in range(0, len(texts), 128):
            out.extend(self._request(texts[i : i + 128]))
        return out

    def embed_query(self, text: str) -> list[float]:
        return self._request([text])[0]
