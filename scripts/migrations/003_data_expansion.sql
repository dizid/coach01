-- Data expansion: quality scoring, multi-source tracking, KvK integration
-- Run this before using expanded pipeline

-- Quality tracking
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS quality_score SMALLINT DEFAULT 0;
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS data_sources TEXT[] DEFAULT '{}';

-- KvK integration
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS kvk_number TEXT;
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS sbi_code TEXT;

-- Fuzzy dedup support
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS name_normalized TEXT;

-- New indexes
CREATE INDEX IF NOT EXISTS idx_coaches_kvk_number ON coaches(kvk_number) WHERE kvk_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_coaches_quality_score ON coaches(quality_score);
CREATE INDEX IF NOT EXISTS idx_coaches_name_normalized ON coaches(name_normalized);

-- Audit improvements
ALTER TABLE collection_runs ADD COLUMN IF NOT EXISTS duration_ms INTEGER;
ALTER TABLE collection_runs ADD COLUMN IF NOT EXISTS errors INTEGER DEFAULT 0;

-- Backfill data_sources from existing source column
UPDATE coaches SET data_sources = ARRAY[source] WHERE array_length(data_sources, 1) IS NULL AND source IS NOT NULL;
