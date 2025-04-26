-- Migration: Automated Multi-Day Event System
-- Description: Adds schema changes, functions, triggers, and views to automatically handle multi-day events

-- 1. Schema Changes to events table
ALTER TABLE events 
  ADD COLUMN IF NOT EXISTS end_date DATE,
  ADD COLUMN IF NOT EXISTS start_time TIME,
  ADD COLUMN IF NOT EXISTS end_time TIME,
  ADD COLUMN IF NOT EXISTS is_multi_day BOOLEAN DEFAULT FALSE;

-- 2. Create event_days table
CREATE TABLE IF NOT EXISTS event_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  day_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE (event_id, date),
  UNIQUE (event_id, day_number)
);

-- Enable RLS on event_days table
ALTER TABLE event_days ENABLE ROW LEVEL SECURITY;

-- Create policy for event_days - anyone can view
CREATE POLICY "Anyone can view event days" ON event_days
  FOR SELECT USING (true);

-- 3. Function to refresh the days table for a parent event
CREATE OR REPLACE FUNCTION refresh_event_days(parent_id TEXT)
RETURNS VOID AS $$
DECLARE
  current_date DATE;
  day_number INTEGER := 1;
  day_name TEXT;
BEGIN
  -- Delete existing days for this event
  DELETE FROM event_days WHERE event_id = parent_id;
  
  -- Only continue if this is a multi-day event
  IF EXISTS (SELECT 1 FROM events WHERE id = parent_id AND is_multi_day = TRUE) THEN
    -- For each distinct date in child events, create a day record
    FOR current_date IN 
      SELECT DISTINCT date FROM events 
      WHERE parent_event_id = parent_id
      ORDER BY date
    LOOP
      -- Create day name based on day number and date
      day_name := 'Day ' || day_number || ' - ' || to_char(current_date, 'FMDay, FMMonth DD');
      
      -- Insert the day
      INSERT INTO event_days (event_id, date, day_number, name)
      VALUES (parent_id, current_date, day_number, day_name);
      
      day_number := day_number + 1;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. Function to update parent event date range based on child events
CREATE OR REPLACE FUNCTION update_parent_event_date_range()
RETURNS TRIGGER AS $$
DECLARE
  min_date DATE;
  max_date DATE;
  day_count INTEGER;
  parent_id TEXT;
BEGIN
  -- Only run for child events with parent_event_id
  IF NEW.parent_event_id IS NOT NULL THEN
    parent_id := NEW.parent_event_id;
    
    -- Calculate min and max dates across all child events
    SELECT MIN(date), MAX(date) 
    INTO min_date, max_date
    FROM events 
    WHERE parent_event_id = parent_id;
    
    -- Count distinct days
    SELECT COUNT(DISTINCT date)
    INTO day_count
    FROM events
    WHERE parent_event_id = parent_id;
    
    -- Update parent event dates and multi-day flag
    UPDATE events
    SET 
      date = min_date,
      end_date = max_date,
      is_multi_day = (day_count > 1)
    WHERE id = parent_id;
    
    -- Ensure days table is updated
    PERFORM refresh_event_days(parent_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger to run the function after insert/update/delete on events
CREATE TRIGGER event_date_range_trigger
AFTER INSERT OR UPDATE OR DELETE ON events
FOR EACH ROW
EXECUTE FUNCTION update_parent_event_date_range();

-- 6. View for getting complete event schedule
CREATE OR REPLACE VIEW event_schedule AS
WITH event_with_days AS (
  SELECT 
    e.*,
    d.id AS day_id,
    d.day_number,
    d.name AS day_name
  FROM 
    events e
  LEFT JOIN 
    event_days d ON e.parent_event_id = d.event_id AND e.date = d.date
  WHERE 
    e.parent_event_id IS NOT NULL
)
SELECT 
  e.id,
  e.title,
  e.description,
  e.date,
  e.start_time,
  e.end_time,
  e.location,
  e.type,
  e.day_id,
  e.day_number,
  e.day_name,
  p.id AS parent_id,
  p.title AS parent_title,
  p.is_multi_day
FROM 
  event_with_days e
JOIN 
  events p ON e.parent_event_id = p.id
ORDER BY 
  p.id, e.date, e.start_time;

-- Grant permissions
GRANT SELECT ON event_schedule TO authenticated, anon; 