"""Knowledge base: list / upload / ingest text / delete documents."""
from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Agent, Document
from ..rag import extract_text, ingest_document
from ..schemas import DocumentOut, TextDocumentCreate

router = APIRouter(prefix="/api", tags=["documents"])

MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB


def _get_agent_or_404(db: Session, agent_id: str) -> Agent:
    agent = db.get(Agent, agent_id)
    if agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.get("/agents/{agent_id}/documents", response_model=list[DocumentOut])
def list_documents(agent_id: str, db: Session = Depends(get_db)) -> list[Document]:
    _get_agent_or_404(db, agent_id)
    return (
        db.query(Document)
        .filter(Document.agent_id == agent_id)
        .order_by(desc(Document.created_at))
        .all()
    )


@router.post(
    "/agents/{agent_id}/documents/upload",
    response_model=DocumentOut,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    agent_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> Document:
    _get_agent_or_404(db, agent_id)
    if file.size is not None and file.size > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 10 MB).")
    raw = await file.read()
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 10 MB).")
    filename = file.filename or "upload.txt"
    text = extract_text(filename, raw)
    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract any text from the file.")
    return ingest_document(
        db, agent_id=agent_id, filename=filename, text=text, size=len(raw)
    )


@router.post(
    "/agents/{agent_id}/documents/text",
    response_model=DocumentOut,
    status_code=status.HTTP_201_CREATED,
)
def add_text_document(
    agent_id: str, payload: TextDocumentCreate, db: Session = Depends(get_db)
) -> Document:
    _get_agent_or_404(db, agent_id)
    return ingest_document(
        db, agent_id=agent_id, filename=payload.filename, text=payload.content
    )


@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: str, db: Session = Depends(get_db)):
    document = db.get(Document, document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(document)
    db.commit()
