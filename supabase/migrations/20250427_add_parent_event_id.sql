-- Migration: Add parent_event_id column
-- Description: Adds a column to the events table to create parent-child relationships for multi-day events

-- Add parent_event_id column with a foreign key reference back to the events table
ALTER TABLE events 
  ADD COLUMN IF NOT EXISTS parent_event_id TEXT REFERENCES events(id) ON DELETE CASCADE;

-- Add index for better query performance when filtering by parent_event_id
CREATE INDEX IF NOT EXISTS idx_events_parent_event_id ON events(parent_event_id);

-- Add RLS policy to allow reading events with parent-child relationships
-- First check if the policy already exists to avoid errors
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'Anyone can view events with parent-child relationships'
        AND polrelid = 'events'::regclass
    ) THEN
        CREATE POLICY "Anyone can view events with parent-child relationships" 
            ON events FOR SELECT 
            USING (true);
    END IF;
END
$$; 