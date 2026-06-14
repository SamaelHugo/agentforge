"""Recursive character text splitter.

Splits on progressively finer separators (paragraph → line → sentence → word →
char) so chunks stay close to the target size without cutting mid-sentence,
then merges adjacent splits into overlapping windows.
"""
from __future__ import annotations

_SEPARATORS = ["\n\n", "\n", ". ", " ", ""]


def _recursive_split(text: str, separators: list[str], chunk_size: int) -> list[str]:
    if len(text) <= chunk_size:
        return [text] if text else []

    sep = separators[0]
    rest = separators[1:]

    if sep == "":
        return [text[i : i + chunk_size] for i in range(0, len(text), chunk_size)]

    pieces = text.split(sep)
    out: list[str] = []
    for i, piece in enumerate(pieces):
        # re-attach the separator we split on (except for the last piece)
        fragment = piece + (sep if i < len(pieces) - 1 else "")
        if len(fragment) <= chunk_size:
            if fragment:
                out.append(fragment)
        elif rest:
            out.extend(_recursive_split(fragment, rest, chunk_size))
        else:
            out.append(fragment)
    return out


def split_text(text: str, chunk_size: int = 800, chunk_overlap: int = 120) -> list[str]:
    text = (text or "").strip()
    if not text:
        return []

    splits = _recursive_split(text, _SEPARATORS, chunk_size)

    chunks: list[str] = []
    current = ""
    for piece in splits:
        if len(current) + len(piece) <= chunk_size:
            current += piece
            continue
        if current.strip():
            chunks.append(current.strip())
        if chunk_overlap and current:
            current = current[-chunk_overlap:] + piece
        else:
            current = piece
    if current.strip():
        chunks.append(current.strip())

    return [c for c in chunks if c]
