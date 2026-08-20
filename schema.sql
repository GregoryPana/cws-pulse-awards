-- CWS Pulse Awards — Complete Database Schema
-- PostgreSQL 16
-- All decisions incorporated as of May 2026
-- Use via Alembic migration: alembic upgrade head
-- Or apply directly for development: psql -U pulse -d pulse_awards -f schema.sql

-- ── EXTENSIONS ────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- For gen_random_uuid() if needed

-- ── CONFIG: CHARTER PILLARS ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS config_pillars (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200)    NOT NULL,
    sort_order  INTEGER         NOT NULL DEFAULT 0,
    active      BOOLEAN         NOT NULL DEFAULT true,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE  config_pillars IS '8 Customer Centric Charter Pillars — admin-managed, order-controlled';
COMMENT ON COLUMN config_pillars.active IS 'Inactive pillars are hidden from the entry form but retained for historical data integrity';

-- ── CONFIG: COMPANY VALUES ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS config_values (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL,
    sort_order  INTEGER         NOT NULL DEFAULT 0,
    active      BOOLEAN         NOT NULL DEFAULT true,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE config_values IS '5 CWS Company Values — admin-managed';

-- ── CONFIG: SUB-CATEGORIES ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS config_subcategories (
    id          SERIAL PRIMARY KEY,
    award_type  VARCHAR(50)     NOT NULL,   -- CHARTER_CHAMPION or INSTANT_IMPACT
    name        VARCHAR(200)    NOT NULL,
    sort_order  INTEGER         NOT NULL DEFAULT 0,
    active      BOOLEAN         NOT NULL DEFAULT true,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE  config_subcategories IS 'Sub-categories per award type — 5 for Charter Champion, 5 for Instant Impact';
COMMENT ON COLUMN config_subcategories.award_type IS 'Values: CHARTER_CHAMPION, INSTANT_IMPACT';

-- ── CONFIG: SETTINGS (KEY-VALUE) ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS config_settings (
    key         VARCHAR(100)    PRIMARY KEY,
    value       TEXT,
    description TEXT,           -- Human-readable description for admin UI
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by  VARCHAR(200)
);

COMMENT ON TABLE config_settings IS 'All platform configuration as key-value pairs. Editable via admin config panel.';

-- ── EMAIL RECIPIENTS ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS email_recipients (
    id          SERIAL PRIMARY KEY,
    email       VARCHAR(200)    NOT NULL,
    name        VARCHAR(200),               -- Optional display name (e.g. "P&C Team")
    active      BOOLEAN         NOT NULL DEFAULT true,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by  VARCHAR(200),
    CONSTRAINT uq_email_recipient UNIQUE (email)
);

COMMENT ON TABLE  email_recipients IS 'P&C distribution addresses. All active recipients receive all award notification emails.';
COMMENT ON COLUMN email_recipients.active IS 'Inactive recipients are retained for audit but do not receive emails';

-- ── WINNERS ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS winners (
    id                          SERIAL PRIMARY KEY,

    -- Award classification
    award_type                  VARCHAR(50)     NOT NULL,
    -- Values: CHARTER_CHAMPION, INSTANT_IMPACT, TEAM_AWARD, TOP_5

    -- Person
    first_name                  VARCHAR(100)    NOT NULL,
    last_name                   VARCHAR(100)    NOT NULL,
    job_title                   VARCHAR(200)    NOT NULL,
    department                  VARCHAR(200)    NOT NULL,

    -- Award details
    subcategory                 VARCHAR(200)    NOT NULL,   -- Denormalised from config_subcategories at entry time
    charter_pillar              VARCHAR(200)    NOT NULL,   -- Denormalised from config_pillars at entry time
    company_value               VARCHAR(100)    NOT NULL,   -- Denormalised from config_values at entry time
    story                       TEXT            NOT NULL,
    nominated_by                VARCHAR(200),               -- Nullable. "A colleague" shown if null.
    photo_url                   VARCHAR(500),               -- Nullable. Initials avatar used if null.

    -- Period
    award_month                 VARCHAR(20)     NOT NULL,   -- e.g. "Jun 2026"
    award_year                  INTEGER         NOT NULL,   -- e.g. 2026

    -- Golden Ticket (as-and-when, no timing constraint)
    golden_ticket               BOOLEAN         NOT NULL DEFAULT false,
    golden_ticket_occasion      VARCHAR(100),               -- Optional label e.g. "Q1 2026" — admin fills if desired
    golden_ticket_ceo_message   TEXT,                       -- Personalised CEO closing paragraph — written by admin before trigger
    golden_ticket_triggered_at  TIMESTAMP WITH TIME ZONE,  -- When email/PDF was triggered
    golden_ticket_triggered_by  VARCHAR(200),               -- Admin user who triggered it

    -- Annual Top 5 flags
    is_top_five                 BOOLEAN         NOT NULL DEFAULT false,
    top_five_rank               INTEGER         CHECK (top_five_rank BETWEEN 1 AND 5),
    top_five_year               INTEGER,

    -- Record status
    status                      VARCHAR(50)     NOT NULL DEFAULT 'PUBLISHED',
    -- Values: PUBLISHED, ARCHIVED, REMOVED
    removed_reason              TEXT,                       -- Required when status = REMOVED

    -- Audit
    created_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by                  VARCHAR(200)    NOT NULL,   -- Entra ID email of admin who entered the record
    updated_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by                  VARCHAR(200)                -- Entra ID email of last admin to edit
);

COMMENT ON TABLE  winners IS 'All award entries. Entry and display system only — vetting and approval happen offline.';
COMMENT ON COLUMN winners.award_type IS 'Values: CHARTER_CHAMPION, INSTANT_IMPACT, TEAM_AWARD, TOP_5';
COMMENT ON COLUMN winners.subcategory IS 'Denormalised at entry time. Preserves historical accuracy if sub-categories are renamed later.';
COMMENT ON COLUMN winners.charter_pillar IS 'Denormalised at entry time for same reason.';
COMMENT ON COLUMN winners.company_value IS 'Denormalised at entry time for same reason.';
COMMENT ON COLUMN winners.nominated_by IS 'Nullable. If null, Hall of Fame displays "A colleague". For Instant Impact, this is the manager name.';
COMMENT ON COLUMN winners.photo_url IS 'Relative URL path: /api/v1/photos/{id}.{ext}. Null = use initials avatar.';
COMMENT ON COLUMN winners.golden_ticket IS 'No uniqueness constraint per period. CEO decides timing. Multiple concurrent Golden Tickets are technically possible — admin process prevents this.';
COMMENT ON COLUMN winners.golden_ticket_occasion IS 'Optional free-text label shown on Hall of Fame card and email subject. E.g. "Q1 2026".';
COMMENT ON COLUMN winners.golden_ticket_ceo_message IS 'Personalised CEO closing paragraph. Written by admin in the trigger flow. Required before Golden Ticket email can be sent.';
COMMENT ON COLUMN winners.status IS 'PUBLISHED: visible on Hall of Fame. ARCHIVED: hidden from main view, visible in admin archive. REMOVED: hidden everywhere, retained in DB with reason.';
COMMENT ON COLUMN winners.removed_reason IS 'Mandatory when status = REMOVED. Used for disciplinary or sensitive removals. Leavers stay PUBLISHED permanently.';

-- ── INDEXES ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_winners_award_type       ON winners (award_type);
CREATE INDEX IF NOT EXISTS idx_winners_award_month      ON winners (award_month);
CREATE INDEX IF NOT EXISTS idx_winners_award_year       ON winners (award_year);
CREATE INDEX IF NOT EXISTS idx_winners_status           ON winners (status);
CREATE INDEX IF NOT EXISTS idx_winners_golden_ticket    ON winners (golden_ticket) WHERE golden_ticket = true;
CREATE INDEX IF NOT EXISTS idx_winners_type_month       ON winners (award_type, award_month, status);

-- ── UPDATED_AT TRIGGERS ───────────────────────────────────────────────────────

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

-- ── SEED DATA: CHARTER PILLARS ────────────────────────────────────────────────
-- 8 pillars — final, confirmed by CCCO

INSERT INTO config_pillars (name, sort_order, active) VALUES
    ('Professionalism & Respect',                           1, true),
    ('Empathy, Listening & Understanding',                  2, true),
    ('Effective & Transparent Communication',               3, true),
    ('Proactive Problem Solving, Urgency & Ownership',      4, true),
    ('Customer Centricity & Insights Driven',               5, true),
    ('Accountability',                                      6, true),
    ('Innovation',                                          7, true),
    ('Continuous Improvement',                              8, true)
ON CONFLICT DO NOTHING;

-- ── SEED DATA: COMPANY VALUES ─────────────────────────────────────────────────
-- 5 values — final, confirmed by CCCO

INSERT INTO config_values (name, sort_order, active) VALUES
    ('Customer',        1, true),
    ('Team',            2, true),
    ('Integrity',       3, true),
    ('Respect',         4, true),
    ('Accountability',  5, true)
ON CONFLICT DO NOTHING;

-- ── SEED DATA: SUB-CATEGORIES ─────────────────────────────────────────────────
-- 10 sub-categories (5 per award type) — original 6 final/confirmed by CCCO;
-- Outstanding Team Player and Leadership in Action added 2026-08-20 to both award types.

INSERT INTO config_subcategories (award_type, name, sort_order, active) VALUES
    ('CHARTER_CHAMPION', 'Collaboration Catalyst',      1, true),
    ('CHARTER_CHAMPION', 'Empathy Anchor',              2, true),
    ('CHARTER_CHAMPION', 'Knowledge Sharer',            3, true),
    ('CHARTER_CHAMPION', 'Outstanding Team Player',     4, true),
    ('CHARTER_CHAMPION', 'Leadership in Action',        5, true),
    ('INSTANT_IMPACT',   'Service Recovery Excellence', 1, true),
    ('INSTANT_IMPACT',   'Innovative Efficiency',       2, true),
    ('INSTANT_IMPACT',   'Integrity Under Pressure',    3, true),
    ('INSTANT_IMPACT',   'Outstanding Team Player',     4, true),
    ('INSTANT_IMPACT',   'Leadership in Action',        5, true)
ON CONFLICT DO NOTHING;

-- ── SEED DATA: CONFIG SETTINGS ────────────────────────────────────────────────

INSERT INTO config_settings (key, value, description) VALUES
    ('ceo_name',
     'Naadir Hassan',
     'CEO full name — appears on emails and Golden Ticket certificate'),

    ('ceo_title',
     'Chief Executive Officer',
     'CEO title — appears on emails and Golden Ticket certificate'),

    ('ccco_name',
     'Maria Pouponneau',
     'CCCO full name — appears on Golden Ticket certificate'),

    ('ccco_title',
     'Chief Customer Centric Officer',
     'CCCO title — appears on Golden Ticket certificate'),

    ('chief_pc_name',
     '',
     'Chief P&C Officer name — optional third signatory on Golden Ticket certificate. Leave blank to omit.'),

    ('chief_pc_title',
     'Chief People & Culture Officer',
     'Chief P&C title — used if chief_pc_name is set'),

    ('hall_of_fame_url',
     'https://pulse.cwsey.com',
     'URL included in email footers linking to the Hall of Fame'),

    ('hall_of_fame_intro',
     '',
     'Hero section introductory text on both Hall of Fame pages. Edit to set the programme welcome message.'),

    ('programme_launch_month',
     'Jun 2026',
     'Controls the archive floor — months before this are not shown in the month filter'),

    ('email_from_address',
     'noreply@cwseychelles.com',
     'From address for all platform emails sent via SMTP relay'),

    ('golden_ticket_message_template',
     'To [Name]: thank you. Not just for what you did, but for how you did it. You reminded every one of us what it means to be part of Cable & Wireless Seychelles. To the rest of the team — these stories are not the exception. They are the standard we are building together. Keep nominating the people around you who make a difference. Living the Charter. Leading the Techco.',
     'Default CEO closing paragraph pre-populated in the Golden Ticket trigger flow. Admin edits before each send to personalise.')

ON CONFLICT (key) DO NOTHING;

-- ── END OF SCHEMA ─────────────────────────────────────────────────────────────
