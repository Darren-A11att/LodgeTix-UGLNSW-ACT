-- Migration: Feature change for improved data management
-- Description: Adds new tables and relationships for feature X

-- Create a new table for feature
CREATE TABLE IF NOT EXISTS features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add an index for performance on commonly queried fields
CREATE INDEX IF NOT EXISTS features_name_idx ON features (name);
CREATE INDEX IF NOT EXISTS features_is_active_idx ON features (is_active);

-- Create a related table for feature metadata
CREATE TABLE IF NOT EXISTS feature_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint to prevent duplicate metadata keys per feature
ALTER TABLE feature_metadata 
  ADD CONSTRAINT unique_feature_metadata_key 
  UNIQUE (feature_id, key);

-- Setup Row Level Security
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_metadata ENABLE ROW LEVEL SECURITY;

-- Create policies for features table
CREATE POLICY "Features are viewable by everyone" 
  ON features FOR SELECT 
  USING (true);

CREATE POLICY "Features are editable by authenticated users" 
  ON features FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Features can be inserted by authenticated users" 
  ON features FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Create trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER features_updated_at
  BEFORE UPDATE ON features
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();
