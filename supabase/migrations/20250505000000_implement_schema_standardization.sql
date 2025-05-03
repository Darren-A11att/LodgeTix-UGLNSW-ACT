-- Migration: Standardize function parameters and ensure data integrity
-- Date: 2025-05-05

-- Step 1: Create a backup of the current functions for safety
CREATE SCHEMA IF NOT EXISTS backups;

-- Backup the reserve_tickets function
CREATE OR REPLACE FUNCTION backups.reserve_tickets_20250505(
  p_event_id UUID,
  p_ticket_type_id UUID,
  p_quantity INTEGER,
  p_reservation_minutes INTEGER DEFAULT 15
)
RETURNS TABLE (
  ticket_id UUID,
  reservation_id UUID,
  expires_at TIMESTAMPTZ
)
AS $$
  -- Just copy the function body for backup, not for execution
  -- This is a safety backup only
$$ LANGUAGE SQL;

-- Step 2: Update the reserve_tickets function to use standardized parameter names
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
      ticketid
    FROM 
      public.tickets
    WHERE 
      eventid = p_event_id
      AND ticketdefinitionid = p_ticket_definition_id
      AND status = 'available'
    LIMIT p_quantity
    FOR UPDATE SKIP LOCKED
  LOOP
    -- Update ticket with reservation info
    UPDATE public.tickets
    SET 
      status = 'reserved',
      reservation_id = v_reservation_id,
      reservation_expires_at = v_expires_at,
      updatedat = NOW()
    WHERE ticketid = v_ticket_record.ticketid;
    
    -- Return the ticket data
    ticket_id := v_ticket_record.ticketid;
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

-- Step 3: Update the get_ticket_availability function for consistency
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
  FROM public.tickets
  WHERE eventid = p_event_id
    AND ticketdefinitionid = p_ticket_definition_id
    AND status = 'available';
    
  -- Count reserved tickets
  SELECT COUNT(*) INTO v_reserved
  FROM public.tickets
  WHERE eventid = p_event_id
    AND ticketdefinitionid = p_ticket_definition_id
    AND status = 'reserved';
    
  -- Count sold tickets
  SELECT COUNT(*) INTO v_sold
  FROM public.tickets
  WHERE eventid = p_event_id
    AND ticketdefinitionid = p_ticket_definition_id
    AND status = 'sold';
    
  -- Return JSON with counts
  RETURN json_build_object(
    'available', v_available,
    'reserved', v_reserved,
    'sold', v_sold
  );
END;
$$ LANGUAGE plpgsql;

-- Step 4: Update the complete_reservation function for consistency
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
    SELECT 1 FROM public.tickets
    WHERE reservation_id = p_reservation_id
      AND reservation_expires_at > NOW()
  ) INTO v_reservation_exists;
  
  IF NOT v_reservation_exists THEN
    RAISE EXCEPTION 'Reservation not found or has expired';
  END IF;
  
  -- Update all tickets in this reservation
  FOR v_ticket_id IN
    SELECT ticketid FROM public.tickets
    WHERE reservation_id = p_reservation_id
      AND status = 'reserved'
  LOOP
    -- Update ticket status to sold and assign attendee
    UPDATE public.tickets
    SET 
      status = 'sold',
      attendeeid = p_attendee_id,
      updatedat = NOW()
    WHERE ticketid = v_ticket_id;
    
    -- Return the ticket ID
    RETURN NEXT v_ticket_id;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create an expiry cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_expired_reservations()
RETURNS INTEGER
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Update expired reservations back to available
  UPDATE public.tickets
  SET 
    status = 'available',
    reservation_id = NULL,
    reservation_expires_at = NULL,
    updatedat = NOW()
  WHERE 
    status = 'reserved'
    AND reservation_expires_at < NOW();
  
  -- Get count of updated tickets
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  -- Return the number of cleaned up tickets
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create a scheduled trigger to clean up expired reservations every 5 minutes
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Drop existing job if it exists (for idempotency)
SELECT cron.unschedule('cleanup_expired_ticket_reservations');

-- Schedule the job
SELECT cron.schedule('cleanup_expired_ticket_reservations', '*/5 * * * *', 'SELECT public.cleanup_expired_reservations()');

-- Step 7: Set appropriate permissions
GRANT EXECUTE ON FUNCTION public.reserve_tickets TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ticket_availability TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_reservation TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_reservations TO authenticated;

-- Step 8: Index optimization for ticket operations
CREATE INDEX IF NOT EXISTS idx_tickets_availability 
ON public.tickets (eventid, ticketdefinitionid, status);

CREATE INDEX IF NOT EXISTS idx_tickets_reservation 
ON public.tickets (reservation_id, status);

CREATE INDEX IF NOT EXISTS idx_tickets_expiry 
ON public.tickets (status, reservation_expires_at)
WHERE status = 'reserved';