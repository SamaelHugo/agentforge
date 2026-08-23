"""Add artifact integrity and native pgvector storage.

Revision ID: 0002
Revises: 0001
"""
from __future__ import annotations

from alembic import op

from app.config import get_settings

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name

    # Legacy demo databases could contain artifacts left behind by deleted
    # agents/runs. Clean those rows before enforcing referential integrity.
    op.execute(
        "DELETE FROM artifacts WHERE NOT EXISTS "
        "(SELECT 1 FROM agents WHERE agents.id = artifacts.agent_id)"
    )
    op.execute(
        "UPDATE artifacts SET run_id = NULL WHERE run_id IS NOT NULL AND NOT EXISTS "
        "(SELECT 1 FROM runs WHERE runs.id = artifacts.run_id)"
    )
    with op.batch_alter_table("artifacts") as batch:
        batch.create_foreign_key(
            "fk_artifacts_agent_id_agents",
            "agents",
            ["agent_id"],
            ["id"],
            ondelete="CASCADE",
        )
        batch.create_foreign_key(
            "fk_artifacts_run_id_runs",
            "runs",
            ["run_id"],
            ["id"],
            ondelete="SET NULL",
        )

    if dialect == "postgresql":
        dim = get_settings().embedding_dim
        op.execute("CREATE EXTENSION IF NOT EXISTS vector")
        op.execute(
            "ALTER TABLE chunks ALTER COLUMN embedding "
            f"TYPE vector({dim}) USING embedding::text::vector({dim})"
        )
        op.execute(
            "CREATE INDEX IF NOT EXISTS ix_chunks_embedding_hnsw "
            "ON chunks USING hnsw (embedding vector_cosine_ops)"
        )


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("DROP INDEX IF EXISTS ix_chunks_embedding_hnsw")
        op.execute(
            "ALTER TABLE chunks ALTER COLUMN embedding "
            "TYPE JSON USING embedding::text::json"
        )

    with op.batch_alter_table("artifacts") as batch:
        batch.drop_constraint("fk_artifacts_run_id_runs", type_="foreignkey")
        batch.drop_constraint("fk_artifacts_agent_id_agents", type_="foreignkey")
