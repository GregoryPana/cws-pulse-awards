"""Fix hall_of_fame_url to the real staging address.

The seeded default (001_initial_schema) pointed at a bare production-style
domain ('https://pulse.cwsey.com') that has never matched how this app is
actually deployed: path-mounted on the shared VM at APP_BASE_URL
(https://cwscx-tst01.cwsey.com/pulse-awards). The Hall of Fame email button
was therefore linking somewhere unreachable.

Revision ID: 006_fix_hall_of_fame_url
Revises: 005_clear_test_winners
Create Date: 2026-08-21
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "006_fix_hall_of_fame_url"
down_revision: str | None = "005_clear_test_winners"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    """Point hall_of_fame_url at the real staging APP_BASE_URL."""

    op.execute(
        """
        UPDATE config_settings
        SET value = 'https://cwscx-tst01.cwsey.com/pulse-awards'
        WHERE key = 'hall_of_fame_url';
        """
    )


def downgrade() -> None:
    """Restore the original seeded (incorrect) default."""

    op.execute(
        """
        UPDATE config_settings
        SET value = 'https://pulse.cwsey.com'
        WHERE key = 'hall_of_fame_url';
        """
    )
