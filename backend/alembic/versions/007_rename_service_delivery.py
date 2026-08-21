"""Rename Instant Impact subcategory 'Service Recovery Excellence' to 'Service Delivery'.

Revision ID: 007_rename_service_recovery_excellence
Revises: 006_fix_hall_of_fame_url
Create Date: 2026-08-21
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "007_rename_service_delivery"
down_revision: str | None = "006_fix_hall_of_fame_url"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    """Rename the Instant Impact subcategory."""

    op.execute(
        """
        UPDATE config_subcategories
        SET name = 'Service Delivery'
        WHERE award_type = 'INSTANT_IMPACT' AND name = 'Service Recovery Excellence';
        """
    )


def downgrade() -> None:
    """Restore the original subcategory name."""

    op.execute(
        """
        UPDATE config_subcategories
        SET name = 'Service Recovery Excellence'
        WHERE award_type = 'INSTANT_IMPACT' AND name = 'Service Delivery';
        """
    )
