"""Clear seeded test winners from staging, keeping the one real entry (Darren Dupres).

Revision ID: 005_clear_test_winners
Revises: 004_team_player_leadership
Create Date: 2026-08-21
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "005_clear_test_winners"
down_revision: str | None = "004_team_player_leadership"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    """Delete every winner row except Darren Dupres, for a clean staging slate."""

    op.execute(
        """
        DELETE FROM winners
        WHERE NOT (lower(first_name) = 'darren' AND lower(last_name) = 'dupres');
        """
    )


def downgrade() -> None:
    """No-op — the deleted seed/test winners are not restored."""
