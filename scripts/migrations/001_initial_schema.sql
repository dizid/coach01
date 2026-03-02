-- CoachFinder initial schema
-- Creates coaches table and collection_runs audit table

CREATE TABLE IF NOT EXISTS coaches (
  id                SERIAL PRIMARY KEY,
  name              TEXT NOT NULL,
  specialties       TEXT[] DEFAULT '{}',
  bio               TEXT,
  experience        INTEGER,
  location          TEXT,
  city              TEXT,
  province          TEXT,
  latitude          DOUBLE PRECISION,
  longitude         DOUBLE PRECISION,
  rating            NUMERIC(2,1),
  review_count      INTEGER DEFAULT 0,
  price             INTEGER,
  price_type        TEXT DEFAULT 'per sessie',
  image             TEXT,
  certifications    TEXT[] DEFAULT '{}',
  approach          TEXT,
  sessions_completed INTEGER DEFAULT 0,
  response_time     TEXT,
  languages         TEXT[] DEFAULT '{Nederlands}',
  availability      TEXT,
  commission_rate   INTEGER DEFAULT 15,
  -- Source tracking
  website           TEXT,
  email             TEXT,
  phone             TEXT,
  google_place_id   TEXT UNIQUE,
  source            TEXT NOT NULL,
  source_url        TEXT,
  enriched          BOOLEAN DEFAULT FALSE,
  active            BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coaches_google_place_id ON coaches(google_place_id);
CREATE INDEX IF NOT EXISTS idx_coaches_name_city ON coaches(name, city);
CREATE INDEX IF NOT EXISTS idx_coaches_source ON coaches(source);
CREATE INDEX IF NOT EXISTS idx_coaches_active ON coaches(active);

CREATE TABLE IF NOT EXISTS collection_runs (
  id              SERIAL PRIMARY KEY,
  source          TEXT NOT NULL,
  search_term     TEXT,
  city            TEXT,
  coaches_found   INTEGER DEFAULT 0,
  coaches_new     INTEGER DEFAULT 0,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  status          TEXT DEFAULT 'running'
);
