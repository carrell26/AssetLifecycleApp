"""Add import references and module position fields.

Revision ID: b84f61c2a903
Revises: 6d2e8c4a91bf
Create Date: 2026-11-01
"""
from alembic import op
import sqlalchemy as sa


revision = "b84f61c2a903"
down_revision = "6d2e8c4a91bf"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "locations",
        sa.Column("import_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_locations_import_id_data_imports",
        "locations",
        "data_imports",
        ["import_id"],
        ["import_id"],
        ondelete="SET NULL",
    )

    op.add_column(
        "devices",
        sa.Column("import_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_devices_import_id_data_imports",
        "devices",
        "data_imports",
        ["import_id"],
        ["import_id"],
        ondelete="SET NULL",
    )

    op.add_column(
        "modules",
        sa.Column("unit_part_number", sa.String(length=100), nullable=True),
    )
    op.add_column(
        "modules",
        sa.Column("original_date", sa.String(length=50), nullable=True),
    )
    op.add_column(
        "modules",
        sa.Column("import_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_modules_import_id_data_imports",
        "modules",
        "data_imports",
        ["import_id"],
        ["import_id"],
        ondelete="CASCADE",
    )

    op.add_column(
        "module_positions",
        sa.Column("shelf", sa.String(length=20), nullable=True),
    )
    op.add_column(
        "module_positions",
        sa.Column("port", sa.String(length=50), nullable=True),
    )


def downgrade():
    op.drop_column("module_positions", "port")
    op.drop_column("module_positions", "shelf")

    op.drop_constraint(
        "fk_modules_import_id_data_imports",
        "modules",
        type_="foreignkey",
    )
    op.drop_column("modules", "import_id")
    op.drop_column("modules", "original_date")
    op.drop_column("modules", "unit_part_number")

    op.drop_constraint(
        "fk_devices_import_id_data_imports",
        "devices",
        type_="foreignkey",
    )
    op.drop_column("devices", "import_id")

    op.drop_constraint(
        "fk_locations_import_id_data_imports",
        "locations",
        type_="foreignkey",
    )
    op.drop_column("locations", "import_id")
