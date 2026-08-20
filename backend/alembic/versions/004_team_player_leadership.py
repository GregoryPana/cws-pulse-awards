"""Add Outstanding Team Player and Leadership in Action subcategories to both award types.

Revision ID: 004_team_player_leadership
Revises: 003_multi_pillar_value
Create Date: 2026-08-20
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "004_team_player_leadership"
down_revision: str | None = "003_multi_pillar_value"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    """Seed the two new subcategories for both CHARTER_CHAMPION and INSTANT_IMPACT."""

    op.execute(
        """
        INSERT INTO config_subcategories (award_type, name, sort_order, active) VALUES
            ('CHARTER_CHAMPION', 'Outstanding Team Player', 4, true),
            ('CHARTER_CHAMPION', 'Leadership in Action',    5, true),
            ('INSTANT_IMPACT',   'Outstanding Team Player', 4, true),
            ('INSTANT_IMPACT',   'Leadership in Action',    5, true)
        ON CONFLICT DO NOTHING;
        """
    )


def downgrade() -> None:
    """Remove the two subcategories from both award types."""

    op.execute(
        """
        DELETE FROM config_subcategories
        WHERE name IN ('Outstanding Team Player', 'Leadership in Action');
        """
    )
