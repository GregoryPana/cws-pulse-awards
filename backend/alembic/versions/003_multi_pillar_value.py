"""Support multiple Charter Pillars and Company Values per winner, add Ethics pillar.

Revision ID: 003_multi_pillar_value
Revises: 002_seed_winners_and_recipients
Create Date: 2026-07-10
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "003_multi_pillar_value"
down_revision: str | None = "002_seed_winners_and_recipients"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    """Convert charter_pillar/company_value to array columns and seed the Ethics pillar."""

    op.execute(
        """
        ALTER TABLE winners
            ADD COLUMN charter_pillars TEXT[],
            ADD COLUMN company_values TEXT[];

        UPDATE winners
        SET charter_pillars = ARRAY[charter_pillar],
            company_values = ARRAY[company_value];

        ALTER TABLE winners
            ALTER COLUMN charter_pillars SET NOT NULL,
            ALTER COLUMN company_values SET NOT NULL,
            ADD CONSTRAINT winners_charter_pillars_nonempty_check CHECK (array_length(charter_pillars, 1) >= 1),
            ADD CONSTRAINT winners_company_values_nonempty_check CHECK (array_length(company_values, 1) >= 1),
            DROP COLUMN charter_pillar,
            DROP COLUMN company_value;

        INSERT INTO config_pillars (name, sort_order, active) VALUES
            ('Ethics', 9, true)
        ON CONFLICT DO NOTHING;
        """
    )


def downgrade() -> None:
    """Collapse array columns back to single values and remove the Ethics pillar."""

    op.execute(
        """
        ALTER TABLE winners
            ADD COLUMN charter_pillar VARCHAR(200),
            ADD COLUMN company_value VARCHAR(100);

        UPDATE winners
        SET charter_pillar = charter_pillars[1],
            company_value = company_values[1];

        ALTER TABLE winners
            ALTER COLUMN charter_pillar SET NOT NULL,
            ALTER COLUMN company_value SET NOT NULL,
            DROP CONSTRAINT winners_charter_pillars_nonempty_check,
            DROP CONSTRAINT winners_company_values_nonempty_check,
            DROP COLUMN charter_pillars,
            DROP COLUMN company_values;

        DELETE FROM config_pillars WHERE name = 'Ethics';
        """
    )
