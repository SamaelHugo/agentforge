"""Ingestion + semantic search.

Ingestion: split → embed → persist Document + Chunks.
Search:    embed query → cosine similarity over the agent's chunks → top-k.

Embeddings are stored L2-normalised, so cosine similarity is just a dot
product (computed with numpy). On Postgres you'd push this into pgvector with
`ORDER BY embedding <=> :q LIMIT k`; the SQLite path keeps it in Python.
"""
from __future__ import annotations

import io
from dataclasses import dataclass

import numpy as np
from sqlalchemy.orm import Session

from ..config import get_settings
from ..embeddings import get_embedder
from ..models import Chunk, Document
from .splitter import split_text


@dataclass
class SearchHit:
    content: str
    score: float
    filename: str
    chunk_index: int
    document_id: str

    def as_dict(self) -> dict:
        return {
            "content": self.content,
            "score": round(self.score, 4),
            "filename": self.filename,
            "chunk_index": self.chunk_index,
            "document_id": self.document_id,
        }


def extract_text(filename: str, raw: bytes) -> str:
    """Best-effort text extraction for uploaded files."""
    if filename.lower().endswith(".pdf"):
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(raw))
        return "\n\n".join((page.extract_text() or "") for page in reader.pages)
    # treat everything else as UTF-8 text (txt, md, csv, json, …)
    return raw.decode("utf-8", errors="replace")


def ingest_document(
    db: Session,
    *,
    agent_id: str,
    filename: str,
    text: str,
    size: int | None = None,
) -> Document:
    settings = get_settings()
    embedder = get_embedder()

    pieces = split_text(text, settings.chunk_size, settings.chunk_overlap)
    vectors = embedder.embed(pieces) if pieces else []

    document = Document(
        agent_id=agent_id,
        filename=filename,
        size=size if size is not None else len(text.encode("utf-8")),
        chunk_count=len(pieces),
    )
    db.add(document)
    db.flush()  # assign document.id

    for i, (piece, vector) in enumerate(zip(pieces, vectors)):
        db.add(
            Chunk(
                document_id=document.id,
                agent_id=agent_id,
                index=i,
                content=piece,
                embedding=vector,
                meta={"filename": filename},
            )
        )

    db.commit()
    db.refresh(document)
    return document


def search(db: Session, *, agent_id: str, query: str, top_k: int | None = None) -> list[SearchHit]:
    settings = get_settings()
    top_k = top_k or settings.top_k

    chunks: list[Chunk] = (
        db.query(Chunk).filter(Chunk.agent_id == agent_id).all()
    )
    if not chunks:
        return []

    q = np.array(get_embedder().embed_query(query), dtype=np.float32)
    dim = int(q.shape[0])

    # Only compare against chunks whose embedding dimension matches the active
    # embedder. This guards against mixing providers (e.g. local 384-dim vs
    # OpenAI 1536-dim) after a config change, which would otherwise crash.
    usable = [c for c in chunks if len(c.embedding or []) == dim]
    if not usable:
        return []

    matrix = np.array([c.embedding for c in usable], dtype=np.float32)

    # embeddings are normalised → cosine == dot product
    scores = matrix @ q
    order = np.argsort(-scores)[:top_k]

    hits: list[SearchHit] = []
    for idx in order:
        chunk = usable[int(idx)]
        hits.append(
            SearchHit(
                content=chunk.content,
                score=float(scores[int(idx)]),
                filename=(chunk.meta or {}).get("filename", "document"),
                chunk_index=chunk.index,
                document_id=chunk.document_id,
            )
        )
    return hits
