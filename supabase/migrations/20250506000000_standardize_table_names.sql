-- Migration: Standardize Table Names (Phase 2)
-- Date: 2025-05-06
-- Description: Renames tables to use consistent PascalCase naming convention

-- Step 1: Create a migration log entry
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'migration_log') THEN
    INSERT INTO migration_log (migration_name, operation, details)
    VALUES ('20250506000000_standardize_table_names', 'START', 'Beginning table name standardization');
  END IF;
END$$;

-- Step 2: Create a backup schema for safety
CREATE SCHEMA IF NOT EXISTS table_name_backup;

-- Step 3: Backup dependencies (views, triggers) that might be affected
DO $$
BEGIN
  -- Save event_schedule view
  IF EXISTS (SELECT FROM information_schema.views WHERE table_name = 'event_schedule') THEN
    CREATE OR REPLACE VIEW table_name_backup.event_schedule AS
    SELECT * FROM public.event_schedule;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'migration_log') THEN
      INSERT INTO migration_log (migration_name, operation, details)
      VALUES ('20250506000000_standardize_table_names', 'BACKUP_VIEW', 'Backed up event_schedule view');
    END IF;
  END IF;
END$$;

-- Step 4: Standardize table names to PascalCase
-- Using proper transaction handling for safety
BEGIN;

  -- events -> Events
  ALTER TABLE IF EXISTS public.events RENAME TO Events;
  
  -- event_days -> EventDays
  ALTER TABLE IF EXISTS public.event_days RENAME TO EventDays;
  
  -- attendee_links -> AttendeeLinks
  ALTER TABLE IF EXISTS public.attendee_links RENAME TO AttendeeLinks;
  
  -- attendee_ticket_assignments -> AttendeeTicketAssignments
  ALTER TABLE IF EXISTS public.attendee_ticket_assignments RENAME TO AttendeeTicketAssignments;
  
  -- event_vas_options -> EventVasOptions
  ALTER TABLE IF EXISTS public.event_vas_options RENAME TO EventVasOptions;
  
  -- grand_lodges -> GrandLodges
  ALTER TABLE IF EXISTS public.grand_lodges RENAME TO GrandLodges;
  
  -- guests -> Guests
  ALTER TABLE IF EXISTS public.guests RENAME TO Guests;
  
  -- lodges -> Lodges
  ALTER TABLE IF EXISTS public.lodges RENAME TO Lodges;
  
  -- masons -> Masons
  ALTER TABLE IF EXISTS public.masons RENAME TO Masons;
  
  -- package_events -> PackageEvents
  ALTER TABLE IF EXISTS public.package_events RENAME TO PackageEvents;
  
  -- package_vas_options -> PackageVasOptions
  ALTER TABLE IF EXISTS public.package_vas_options RENAME TO PackageVasOptions;
  
  -- packages -> Packages
  ALTER TABLE IF EXISTS public.packages RENAME TO Packages;
  
  -- registration_vas -> RegistrationVas
  ALTER TABLE IF EXISTS public.registration_vas RENAME TO RegistrationVas;
  
  -- registrations -> Registrations (if lowercase version exists)
  DO $$
  BEGIN
    IF EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'registrations'
      AND table_name <> 'Registrations'
    ) THEN
      ALTER TABLE public.registrations RENAME TO Registrations;
    END IF;
  END$$;
  
  -- ticket_definitions -> TicketDefinitions
  ALTER TABLE IF EXISTS public.ticket_definitions RENAME TO TicketDefinitions;
  
  -- tickets -> Tickets
  ALTER TABLE IF EXISTS public.tickets RENAME TO Tickets;
  
  -- value_added_services -> ValueAddedServices
  ALTER TABLE IF EXISTS public.value_added_services RENAME TO ValueAddedServices;

-- Commit the transaction
COMMIT;

-- Step 5: Recreate views to use new table names
DROP VIEW IF EXISTS public.event_schedule;

CREATE OR REPLACE VIEW public.EventSchedule AS
SELECT
  e.eventId,
  e.title,
  e.description,
  e.date,
  e.startTime,
  e.endTime,
  e.location,
  e.type,
  d.id AS dayId,
  d.dayNumber,
  d.name AS dayName,
  p.eventId AS parentId,
  p.title AS parentTitle,
  p.isMultiDay
FROM 
  public.Events e
JOIN 
  public.Events p ON e.parentEventId = p.eventId
LEFT JOIN 
  public.EventDays d ON e.parentEventId = d.eventId AND e.date = d.date
ORDER BY 
  p.eventId, e.date, e.startTime;

-- Step 6: Update function definitions to use new table names
CREATE OR REPLACE FUNCTION public.reserve_tickets(
  p_event_id UUID,
  p_ticket_definition_id UUID,
  p_quantity INTEGER,
  p_reservation_minutes INTEGER DEFAULT 15
)
RETURNS TABLE (
  ticket_id UUID,
  reservation_id UUID,
  expires_at TIMESTAMPTZ
)
SECURITY DEFINER
AS $$
DECLARE
  v_reservation_id UUID := gen_random_uuid();
  v_expires_at TIMESTAMPTZ := now() + (p_reservation_minutes * interval '1 minute');
  v_auth_id UUID;
  v_ticket_record RECORD;
  v_reserved_count INTEGER := 0;
BEGIN
  -- Get authenticated user ID
  v_auth_id := auth.uid();
  
  -- Ensure user is authenticated (anonymous or registered)
  IF v_auth_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to reserve tickets';
  END IF;
  
  -- Generate a single reservation ID for all tickets
  -- Create a transaction for atomicity
  FOR v_ticket_record IN 
    SELECT 
      ticketId
    FROM 
      public.Tickets  -- Updated table name
    WHERE 
      eventId = p_event_id
      AND ticketDefinitionId = p_ticket_definition_id
      AND status = 'available'
    LIMIT p_quantity
    FOR UPDATE SKIP LOCKED
  LOOP
    -- Update ticket with reservation info
    UPDATE public.Tickets  -- Updated table name
    SET 
      status = 'reserved',
      reservationId = v_reservation_id,
      reservationExpiresAt = v_expires_at,
      updatedAt = NOW()
    WHERE ticketId = v_ticket_record.ticketId;
    
    -- Return the ticket data
    ticket_id := v_ticket_record.ticketId;
    reservation_id := v_reservation_id;
    expires_at := v_expires_at;
    
    -- Increment counter
    v_reserved_count := v_reserved_count + 1;
    
    RETURN NEXT;
  END LOOP;
  
  -- Check if we've reserved enough tickets
  IF v_reserved_count < p_quantity THEN
    -- Roll back changes if we couldn't reserve enough tickets
    RAISE EXCEPTION 'Could not reserve all requested tickets (% available of % requested)', 
                    v_reserved_count, p_quantity;
  END IF;
  
  -- Broadcast availability update
  PERFORM pg_notify(
    'ticket_system_status',
    json_build_object(
      'type', 'availability_update',
      'eventId', p_event_id,
      'ticketDefinitionId', p_ticket_definition_id,
      'message', 'Tickets have been reserved',
      'timestamp', extract(epoch from now())
    )::text
  );
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Update get_ticket_availability function
CREATE OR REPLACE FUNCTION public.get_ticket_availability(
  p_event_id UUID,
  p_ticket_definition_id UUID
)
RETURNS json
SECURITY DEFINER
AS $$
DECLARE
  v_available INTEGER;
  v_reserved INTEGER;
  v_sold INTEGER;
BEGIN
  -- Count available tickets
  SELECT COUNT(*) INTO v_available
  FROM public.Tickets  -- Updated table name
  WHERE eventId = p_event_id
    AND ticketDefinitionId = p_ticket_definition_id
    AND status = 'available';
    
  -- Count reserved tickets
  SELECT COUNT(*) INTO v_reserved
  FROM public.Tickets  -- Updated table name
  WHERE eventId = p_event_id
    AND ticketDefinitionId = p_ticket_definition_id
    AND status = 'reserved';
    
  -- Count sold tickets
  SELECT COUNT(*) INTO v_sold
  FROM public.Tickets  -- Updated table name
  WHERE eventId = p_event_id
    AND ticketDefinitionId = p_ticket_definition_id
    AND status = 'sold';
    
  -- Return JSON with counts
  RETURN json_build_object(
    'available', v_available,
    'reserved', v_reserved,
    'sold', v_sold
  );
END;
$$ LANGUAGE plpgsql;

-- Update complete_reservation function
CREATE OR REPLACE FUNCTION public.complete_reservation(
  p_reservation_id UUID,
  p_attendee_id UUID
)
RETURNS SETOF UUID
SECURITY DEFINER
AS $$
DECLARE
  v_ticket_id UUID;
  v_auth_id UUID;
  v_reservation_exists BOOLEAN;
BEGIN
  -- Get authenticated user ID
  v_auth_id := auth.uid();
  
  -- Ensure user is authenticated
  IF v_auth_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to complete reservation';
  END IF;
  
  -- Check if reservation exists and is valid
  SELECT EXISTS (
    SELECT 1 FROM public.Tickets  -- Updated table name
    WHERE reservationId = p_reservation_id
      AND reservationExpiresAt > NOW()
  ) INTO v_reservation_exists;
  
  IF NOT v_reservation_exists THEN
    RAISE EXCEPTION 'Reservation not found or has expired';
  END IF;
  
  -- Update all tickets in this reservation
  FOR v_ticket_id IN
    SELECT ticketId FROM public.Tickets  -- Updated table name
    WHERE reservationId = p_reservation_id
      AND status = 'reserved'
  LOOP
    -- Update ticket status to sold and assign attendee
    UPDATE public.Tickets  -- Updated table name
    SET 
      status = 'sold',
      attendeeId = p_attendee_id,
      updatedAt = NOW()
    WHERE ticketId = v_ticket_id;
    
    -- Return the ticket ID
    RETURN NEXT v_ticket_id;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Update cleanup_expired_reservations function
CREATE OR REPLACE FUNCTION public.cleanup_expired_reservations()
RETURNS INTEGER
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Update expired reservations back to available
  UPDATE public.Tickets  -- Updated table name
  SET 
    status = 'available',
    reservationId = NULL,
    reservationExpiresAt = NULL,
    updatedAt = NOW()
  WHERE 
    status = 'reserved'
    AND reservationExpiresAt < NOW();
  
  -- Get count of updated tickets
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  -- Return the number of cleaned up tickets
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Update scheduled jobs if needed
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Update cron job to use new table names (if needed)
    PERFORM cron.unschedule('cleanup_expired_ticket_reservations');
    PERFORM cron.schedule('cleanup_expired_ticket_reservations', '*/5 * * * *', 'SELECT public.cleanup_expired_reservations()');
  END IF;
END$$;

-- Step 8: Verify migration success
DO $$
DECLARE
  v_table_exists BOOLEAN;
  v_all_success BOOLEAN := TRUE;
  v_tables_checked TEXT := '';
BEGIN
  -- Check if tables were renamed successfully
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Events') INTO v_table_exists;
  IF NOT v_table_exists THEN
    v_all_success := FALSE;
    v_tables_checked := v_tables_checked || 'Events not found, ';
  END IF;
  
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Tickets') INTO v_table_exists;
  IF NOT v_table_exists THEN
    v_all_success := FALSE;
    v_tables_checked := v_tables_checked || 'Tickets not found, ';
  END IF;
  
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'TicketDefinitions') INTO v_table_exists;
  IF NOT v_table_exists THEN
    v_all_success := FALSE;
    v_tables_checked := v_tables_checked || 'TicketDefinitions not found, ';
  END IF;
  
  -- Check if views were updated successfully
  SELECT EXISTS (SELECT FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'EventSchedule') INTO v_table_exists;
  IF NOT v_table_exists THEN
    v_all_success := FALSE;
    v_tables_checked := v_tables_checked || 'EventSchedule view not found';
  END IF;
  
  -- Log the verification results
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'migration_log') THEN
    IF v_all_success THEN
      INSERT INTO migration_log (migration_name, operation, details)
      VALUES ('20250506000000_standardize_table_names', 'VERIFICATION', 'All tables and views successfully standardized');
    ELSE
      INSERT INTO migration_log (migration_name, operation, details)
      VALUES ('20250506000000_standardize_table_names', 'VERIFICATION_ERROR', 'Some tables not properly renamed: ' || v_tables_checked);
    END IF;
  END IF;
END$$;

-- Final log entry
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'migration_log') THEN
    INSERT INTO migration_log (migration_name, operation, details)
    VALUES ('20250506000000_standardize_table_names', 'COMPLETE', 'Table name standardization completed');
  END IF;
END$$;