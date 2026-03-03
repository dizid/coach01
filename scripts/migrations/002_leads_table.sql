-- Migration 002: Create leads table for pay-per-lead monetization
-- Run in Neon console or via: psql $DATABASE_URL -f scripts/migrations/002_leads_table.sql

CREATE TABLE IF NOT EXISTS leads (
  id                SERIAL PRIMARY KEY,
  lead_token        UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  user_name         TEXT NOT NULL,
  user_email        TEXT NOT NULL,
  user_phone        TEXT,
  coach_id          INT REFERENCES coaches(id),
  coach_name        TEXT,
  session_type      TEXT,
  preferred_date    DATE,
  message           TEXT,
  -- Full questionnaire context (7 sliders + goal + timeline + location + budget)
  questionnaire     JSONB,
  -- Lead lifecycle: submitted → viewed → started → invoiced → paid
  status            TEXT NOT NULL DEFAULT 'submitted',
  -- Follow-up scheduling: send email 14 days after submission
  follow_up_at      TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '14 days',
  follow_up_sent_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_coach_id    ON leads(coach_id);
CREATE INDEX IF NOT EXISTS idx_leads_user_email  ON leads(user_email);
CREATE INDEX IF NOT EXISTS idx_leads_status      ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_follow_up   ON leads(follow_up_at) WHERE follow_up_sent_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_lead_token  ON leads(lead_token);
