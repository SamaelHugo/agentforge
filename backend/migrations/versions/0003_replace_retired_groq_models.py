"""Replace Groq model ids retired for free/developer accounts.

Revision ID: 0003
Revises: 0002
"""
from __future__ import annotations

from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "UPDATE agents SET model = 'openai/gpt-oss-120b' "
        "WHERE model = 'llama-3.3-70b-versatile'"
    )
    op.execute(
        "UPDATE agents SET model = 'openai/gpt-oss-20b' "
        "WHERE model IN ('llama-3.1-8b-instant', 'gemma2-9b-it')"
    )


def downgrade() -> None:
    # Model availability cannot be rolled back safely. Keep the live ids.
    pass
