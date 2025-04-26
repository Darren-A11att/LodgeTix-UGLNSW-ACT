-- Migration: Setup Multi-Day Events
-- Description: Updates events to establish parent-child relationships

-- Temporarily disable the trigger that's causing conflicts
ALTER TABLE events DISABLE TRIGGER event_date_range_trigger;

-- First, clear any existing event_days records that might cause conflicts
DELETE FROM event_days WHERE event_id = 'grand-proclamation-2025';

-- Set up the main "Grand Proclamation 2025" as the parent event
UPDATE events
SET is_multi_day = TRUE
WHERE id = 'grand-proclamation-2025';

-- Then update all other events to reference the parent event
UPDATE events
SET parent_event_id = 'grand-proclamation-2025'
WHERE id != 'grand-proclamation-2025' AND id IN (
  'welcome-reception',
  'registration-desk',
  'ladies-program',
  'grand-officers-meeting',
  'grand-proclamation-ceremony',
  'gala-dinner',
  'farewell-lunch',
  'thanksgiving-service'
);

-- Manually create event days records instead of using the trigger
DO $$
DECLARE
  event_date DATE;        -- Renamed from 'current_date' to avoid conflict with SQL's CURRENT_DATE function
  parent_id TEXT := 'grand-proclamation-2025';
  day_counter INTEGER := 1;
  day_name TEXT;
BEGIN
  -- For each distinct date in child events, create a day record
  FOR event_date IN 
    SELECT DISTINCT date FROM events 
    WHERE parent_event_id = parent_id
    ORDER BY date
  LOOP
    -- Create day name based on day number and date
    day_name := 'Day ' || day_counter || ' - ' || to_char(event_date, 'FMDay, FMMonth DD');
    
    -- Insert the day using the correct variable name
    INSERT INTO event_days (event_id, date, day_number, name)
    VALUES (parent_id, event_date, day_counter, day_name);
    
    day_counter := day_counter + 1;
  END LOOP;
  
  -- Also update the parent event date range
  UPDATE events
  SET 
    end_date = (SELECT MAX(date) FROM events WHERE parent_event_id = parent_id),
    is_multi_day = true
  WHERE id = parent_id;
END $$;

-- Re-enable the trigger for future operations
ALTER TABLE events ENABLE TRIGGER event_date_range_trigger; 