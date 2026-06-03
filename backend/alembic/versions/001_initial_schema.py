"""Initial schema for CWS Pulse Awards.

Revision ID: 001_initial_schema
Revises:
Create Date: 2026-05-26
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "001_initial_schema"
down_revision: str | None = None
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    """Create all Phase 0 tables, triggers, indexes, and seed data."""

    op.execute(
        """
        CREATE EXTENSION IF NOT EXISTS "pgcrypto";

        CREATE TABLE IF NOT EXISTS config_pillars (
            id          SERIAL PRIMARY KEY,
            name        VARCHAR(200)    NOT NULL,
            sort_order  INTEGER         NOT NULL DEFAULT 0,
            active      BOOLEAN         NOT NULL DEFAULT true,
            created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS config_values (
            id          SERIAL PRIMARY KEY,
            name        VARCHAR(100)    NOT NULL,
            sort_order  INTEGER         NOT NULL DEFAULT 0,
            active      BOOLEAN         NOT NULL DEFAULT true,
            created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS config_subcategories (
            id          SERIAL PRIMARY KEY,
            award_type  VARCHAR(50)     NOT NULL,
            name        VARCHAR(200)    NOT NULL,
            sort_order  INTEGER         NOT NULL DEFAULT 0,
            active      BOOLEAN         NOT NULL DEFAULT true,
            created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS config_settings (
            key         VARCHAR(100)    PRIMARY KEY,
            value       TEXT,
            description TEXT,
            updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_by  VARCHAR(200)
        );

        CREATE TABLE IF NOT EXISTS email_recipients (
            id          SERIAL PRIMARY KEY,
            email       VARCHAR(200)    NOT NULL,
            name        VARCHAR(200),
            active      BOOLEAN         NOT NULL DEFAULT true,
            created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_by  VARCHAR(200),
            CONSTRAINT uq_email_recipient UNIQUE (email)
        );

        CREATE TABLE IF NOT EXISTS winners (
            id                          SERIAL PRIMARY KEY,
            award_type                  VARCHAR(50)     NOT NULL,
            first_name                  VARCHAR(100)    NOT NULL,
            last_name                   VARCHAR(100)    NOT NULL,
            job_title                   VARCHAR(200)    NOT NULL,
            department                  VARCHAR(200)    NOT NULL,
            subcategory                 VARCHAR(200)    NOT NULL,
            charter_pillar              VARCHAR(200)    NOT NULL,
            company_value               VARCHAR(100)    NOT NULL,
            story                       TEXT            NOT NULL,
            nominated_by                VARCHAR(200),
            photo_url                   VARCHAR(500),
            award_month                 VARCHAR(20)     NOT NULL,
            award_year                  INTEGER         NOT NULL,
            golden_ticket               BOOLEAN         NOT NULL DEFAULT false,
            golden_ticket_occasion      VARCHAR(100),
            golden_ticket_ceo_message   TEXT,
            golden_ticket_triggered_at  TIMESTAMP WITH TIME ZONE,
            golden_ticket_triggered_by  VARCHAR(200),
            is_top_five                 BOOLEAN         NOT NULL DEFAULT false,
            top_five_rank               INTEGER         CHECK (top_five_rank BETWEEN 1 AND 5),
            top_five_year               INTEGER,
            status                      VARCHAR(50)     NOT NULL DEFAULT 'PUBLISHED',
            removed_reason              TEXT,
            created_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_by                  VARCHAR(200)    NOT NULL,
            updated_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_by                  VARCHAR(200)
        );

        CREATE INDEX IF NOT EXISTS idx_winners_award_type ON winners (award_type);
        CREATE INDEX IF NOT EXISTS idx_winners_award_month ON winners (award_month);
        CREATE INDEX IF NOT EXISTS idx_winners_award_year ON winners (award_year);
        CREATE INDEX IF NOT EXISTS idx_winners_status ON winners (status);
        CREATE INDEX IF NOT EXISTS idx_winners_golden_ticket ON winners (golden_ticket) WHERE golden_ticket = true;
        CREATE INDEX IF NOT EXISTS idx_winners_type_month ON winners (award_type, award_month, status);

        CREATE OR REPLACE FUNCTION trigger_set_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER set_winners_updated_at
            BEFORE UPDATE ON winners
            FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

        CREATE TRIGGER set_pillars_updated_at
            BEFORE UPDATE ON config_pillars
            FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

        CREATE TRIGGER set_values_updated_at
            BEFORE UPDATE ON config_values
            FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

        CREATE TRIGGER set_subcategories_updated_at
            BEFORE UPDATE ON config_subcategories
            FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

        INSERT INTO config_pillars (name, sort_order, active) VALUES
            ('Professionalism & Respect', 1, true),
            ('Empathy, Listening & Understanding', 2, true),
            ('Effective & Transparent Communication', 3, true),
            ('Proactive Problem Solving, Urgency & Ownership', 4, true),
            ('Customer Centricity & Insights Driven', 5, true),
            ('Accountability', 6, true),
            ('Innovation', 7, true),
            ('Continuous Improvement', 8, true)
        ON CONFLICT DO NOTHING;

        INSERT INTO config_values (name, sort_order, active) VALUES
            ('Customer', 1, true),
            ('Team', 2, true),
            ('Integrity', 3, true),
            ('Respect', 4, true),
            ('Accountability', 5, true)
        ON CONFLICT DO NOTHING;

        INSERT INTO config_subcategories (award_type, name, sort_order, active) VALUES
            ('CHARTER_CHAMPION', 'Collaboration Catalyst', 1, true),
            ('CHARTER_CHAMPION', 'Empathy Anchor', 2, true),
            ('CHARTER_CHAMPION', 'Knowledge Sharer', 3, true),
            ('INSTANT_IMPACT', 'Service Recovery Excellence', 1, true),
            ('INSTANT_IMPACT', 'Innovative Efficiency', 2, true),
            ('INSTANT_IMPACT', 'Integrity Under Pressure', 3, true)
        ON CONFLICT DO NOTHING;

        INSERT INTO config_settings (key, value, description) VALUES
            ('ceo_name', 'Naadir Hassan', 'CEO full name — appears on emails and Golden Ticket certificate'),
            ('ceo_title', 'Chief Executive Officer', 'CEO title — appears on emails and Golden Ticket certificate'),
            ('ccco_name', 'Maria Pouponneau', 'CCCO full name — appears on Golden Ticket certificate'),
            ('ccco_title', 'Chief Customer Centric Officer', 'CCCO title — appears on Golden Ticket certificate'),
            ('chief_pc_name', '', 'Chief P&C Officer name — optional third signatory on Golden Ticket certificate. Leave blank to omit.'),
            ('chief_pc_title', 'Chief People & Culture Officer', 'Chief P&C title — used if chief_pc_name is set'),
            ('hall_of_fame_url', 'https://pulse.cwsey.com', 'URL included in email footers linking to the Hall of Fame'),
            ('hall_of_fame_intro', '', 'Hero section introductory text on both Hall of Fame pages. Edit to set the programme welcome message.'),
            ('programme_launch_month', 'Jun 2026', 'Controls the archive floor — months before this are not shown in the month filter'),
            ('email_from_address', 'noreply@cwseychelles.com', 'From address for all platform emails sent via SMTP relay'),
            ('golden_ticket_message_template', 'To [Name]: thank you. Not just for what you did, but for how you did it. You reminded every one of us what it means to be part of Cable & Wireless Seychelles. To the rest of the team — these stories are not the exception. They are the standard we are building together. Keep nominating the people around you who make a difference. Living the Charter. Leading the Techco.', 'Default CEO closing paragraph pre-populated in the Golden Ticket trigger flow. Admin edits before each send to personalise.')
        ON CONFLICT (key) DO NOTHING;
        """
    )


def downgrade() -> None:
    """Drop all Phase 0 tables, indexes, and triggers."""

    op.execute(
        """
        DROP TRIGGER IF EXISTS set_subcategories_updated_at ON config_subcategories;
        DROP TRIGGER IF EXISTS set_values_updated_at ON config_values;
        DROP TRIGGER IF EXISTS set_pillars_updated_at ON config_pillars;
        DROP TRIGGER IF EXISTS set_winners_updated_at ON winners;
        DROP FUNCTION IF EXISTS trigger_set_updated_at();
        DROP TABLE IF EXISTS winners;
        DROP TABLE IF EXISTS email_recipients;
        DROP TABLE IF EXISTS config_settings;
        DROP TABLE IF EXISTS config_subcategories;
        DROP TABLE IF EXISTS config_values;
        DROP TABLE IF EXISTS config_pillars;
        """
    )
