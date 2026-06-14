"""Embeddings abstraction (pluggable backends)."""
from .base import Embedder
from .factory import get_embedder

__all__ = ["Embedder", "get_embedder"]
