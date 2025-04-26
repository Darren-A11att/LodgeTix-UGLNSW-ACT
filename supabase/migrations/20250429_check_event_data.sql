-- Migration to check existing event data
-- This won't make changes, just select data for inspection

-- First, lets see all events in the database
DO $$
DECLARE
  event_rec RECORD;
  event_count INTEGER;
BEGIN
  -- Count total events
  SELECT COUNT(*) INTO event_count FROM events;
  RAISE NOTICE 'Total events in database: %', event_count;
  
  -- Check for specific IDs
  FOR event_rec IN 
    SELECT id, title, date FROM events
    ORDER BY date
  LOOP
    RAISE NOTICE 'Event: % (ID: %), Date: %', event_rec.title, event_rec.id, event_rec.date;
  END LOOP;
  
  -- Check for any events with grand proclamation in the name
  RAISE NOTICE '---------------------------------------------';
  RAISE NOTICE 'Events containing "proclamation" in title or ID:';
  FOR event_rec IN 
    SELECT id, title FROM events 
    WHERE lower(title) LIKE '%proclamation%' OR lower(id) LIKE '%proclamation%'
  LOOP
    RAISE NOTICE 'Match found: % (ID: %)', event_rec.title, event_rec.id;
  END LOOP;

  -- Check table schema - what columns do we have
  RAISE NOTICE '---------------------------------------------';
  RAISE NOTICE 'Events table columns:';
  FOR event_rec IN 
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'events'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE 'Column: %, Type: %', event_rec.column_name, event_rec.data_type;
  END LOOP;
END $$; 