"""Add file_path to data_imports.

Revision ID: 6d2e8c4a91bf
Revises: 8612455b7032
Create Date: 2026-11-01
"""
from alembic import op
import sqlalchemy as sa


revision = "6d2e8c4a91bf"
down_revision = "8612455b7032"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "data_imports",
        sa.Column("file_path", sa.String(length=255), nullable=True),
    )


def downgrade():
    op.drop_column("data_imports", "file_path")
