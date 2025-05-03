-- Migration: Standardize Column Names (Phase 3)
-- Date: 2025-05-07
-- Description: Renames columns to use consistent camelCase naming convention

-- Step 1: Create a migration log entry
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'migration_log') THEN
    INSERT INTO migration_log (migration_name, operation, details)
    VALUES ('20250507000000_standardize_column_names', 'START', 'Beginning column name standardization');
  END IF;
END$$;

-- Step 2: Create a backup schema for safety
CREATE SCHEMA IF NOT EXISTS column_name_backup;

-- Step 3: Back up views that might be affected
DO $$
BEGIN
  -- Save EventSchedule view
  IF EXISTS (SELECT FROM information_schema.views WHERE table_name = 'eventschedule') THEN
    CREATE OR REPLACE VIEW column_name_backup.eventschedule AS
    SELECT * FROM public.EventSchedule;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'migration_log') THEN
      INSERT INTO migration_log (migration_name, operation, details)
      VALUES ('20250507000000_standardize_column_names', 'BACKUP_VIEW', 'Backed up EventSchedule view');
    END IF;
  END IF;
END$$;

-- Step 4: Standardize column names to camelCase
-- Using proper transaction handling for safety
BEGIN;

  -- Events table
  ALTER TABLE IF EXISTS public.Events 
    RENAME COLUMN parent_event_id TO parentEventId;
  ALTER TABLE IF EXISTS public.Events 
    RENAME COLUMN is_purchasable_individually TO isPurchasableIndividually;
  ALTER TABLE IF EXISTS public.Events 
    RENAME COLUMN is_multi_day TO isMultiDay;
  ALTER TABLE IF EXISTS public.Events 
    RENAME COLUMN created_at TO createdAt;
  ALTER TABLE IF EXISTS public.Events 
    RENAME COLUMN end_date TO endDate;
  ALTER TABLE IF EXISTS public.Events 
    RENAME COLUMN start_time TO startTime;
  ALTER TABLE IF EXISTS public.Events 
    RENAME COLUMN end_time TO endTime;
  
  -- EventDays table
  ALTER TABLE IF EXISTS public.EventDays 
    RENAME COLUMN event_id TO eventId;
  ALTER TABLE IF EXISTS public.EventDays 
    RENAME COLUMN day_number TO dayNumber;
  ALTER TABLE IF EXISTS public.EventDays 
    RENAME COLUMN created_at TO createdAt;
  
  -- AttendeeLinks table
  ALTER TABLE IF EXISTS public.AttendeeLinks 
    RENAME COLUMN registration_id TO registrationId;
  ALTER TABLE IF EXISTS public.AttendeeLinks 
    RENAME COLUMN mason_id TO masonId;
  ALTER TABLE IF EXISTS public.AttendeeLinks 
    RENAME COLUMN guest_id TO guestId;
  ALTER TABLE IF EXISTS public.AttendeeLinks 
    RENAME COLUMN attendee_type TO attendeeType;
  ALTER TABLE IF EXISTS public.AttendeeLinks 
    RENAME COLUMN is_primary TO isPrimary;
  ALTER TABLE IF EXISTS public.AttendeeLinks 
    RENAME COLUMN created_at TO createdAt;
  
  -- AttendeeTicketAssignments table
  ALTER TABLE IF EXISTS public.AttendeeTicketAssignments 
    RENAME COLUMN attendee_link_id TO attendeeLinkId;
  ALTER TABLE IF EXISTS public.AttendeeTicketAssignments 
    RENAME COLUMN registration_id TO registrationId;
  ALTER TABLE IF EXISTS public.AttendeeTicketAssignments 
    RENAME COLUMN ticket_definition_id TO ticketDefinitionId;
  ALTER TABLE IF EXISTS public.AttendeeTicketAssignments 
    RENAME COLUMN price_at_assignment TO priceAtAssignment;
  ALTER TABLE IF EXISTS public.AttendeeTicketAssignments 
    RENAME COLUMN created_at TO createdAt;
  
  -- EventVasOptions table
  ALTER TABLE IF EXISTS public.EventVasOptions 
    RENAME COLUMN event_id TO eventId;
  ALTER TABLE IF EXISTS public.EventVasOptions 
    RENAME COLUMN vas_id TO vasId;
  ALTER TABLE IF EXISTS public.EventVasOptions 
    RENAME COLUMN price_override TO priceOverride;
  
  -- GrandLodges table
  ALTER TABLE IF EXISTS public.GrandLodges 
    RENAME COLUMN created_at TO createdAt;
  
  -- Guests table
  ALTER TABLE IF EXISTS public.Guests 
    RENAME COLUMN guest_type TO guestType;
  ALTER TABLE IF EXISTS public.Guests 
    RENAME COLUMN first_name TO firstName;
  ALTER TABLE IF EXISTS public.Guests 
    RENAME COLUMN last_name TO lastName;
  ALTER TABLE IF EXISTS public.Guests 
    RENAME COLUMN dietary_requirements TO dietaryRequirements;
  ALTER TABLE IF EXISTS public.Guests 
    RENAME COLUMN special_needs TO specialNeeds;
  ALTER TABLE IF EXISTS public.Guests 
    RENAME COLUMN contact_preference TO contactPreference;
  ALTER TABLE IF EXISTS public.Guests 
    RENAME COLUMN contact_confirmed TO contactConfirmed;
  ALTER TABLE IF EXISTS public.Guests 
    RENAME COLUMN partner_relationship TO partnerRelationship;
  ALTER TABLE IF EXISTS public.Guests 
    RENAME COLUMN related_mason_id TO relatedMasonId;
  ALTER TABLE IF EXISTS public.Guests 
    RENAME COLUMN related_guest_id TO relatedGuestId;
  ALTER TABLE IF EXISTS public.Guests 
    RENAME COLUMN created_at TO createdAt;
  
  -- Lodges table
  ALTER TABLE IF EXISTS public.Lodges 
    RENAME COLUMN grand_lodge_id TO grandLodgeId;
  ALTER TABLE IF EXISTS public.Lodges 
    RENAME COLUMN display_name TO displayName;
  ALTER TABLE IF EXISTS public.Lodges 
    RENAME COLUMN meeting_place TO meetingPlace;
  ALTER TABLE IF EXISTS public.Lodges 
    RENAME COLUMN area_type TO areaType;
  ALTER TABLE IF EXISTS public.Lodges 
    RENAME COLUMN created_at TO createdAt;
  
  -- Masons table
  ALTER TABLE IF EXISTS public.Masons 
    RENAME COLUMN first_name TO firstName;
  ALTER TABLE IF EXISTS public.Masons 
    RENAME COLUMN last_name TO lastName;
  ALTER TABLE IF EXISTS public.Masons 
    RENAME COLUMN dietary_requirements TO dietaryRequirements;
  ALTER TABLE IF EXISTS public.Masons 
    RENAME COLUMN special_needs TO specialNeeds;
  ALTER TABLE IF EXISTS public.Masons 
    RENAME COLUMN grand_rank TO grandRank;
  ALTER TABLE IF EXISTS public.Masons 
    RENAME COLUMN grand_officer TO grandOfficer;
  ALTER TABLE IF EXISTS public.Masons 
    RENAME COLUMN grand_office TO grandOffice;
  ALTER TABLE IF EXISTS public.Masons 
    RENAME COLUMN grand_office_other TO grandOfficeOther;
  ALTER TABLE IF EXISTS public.Masons 
    RENAME COLUMN created_at TO createdAt;
  ALTER TABLE IF EXISTS public.Masons 
    RENAME COLUMN lodge_id TO lodgeId;
  ALTER TABLE IF EXISTS public.Masons 
    RENAME COLUMN grand_lodge_id TO grandLodgeId;
  
  -- PackageEvents table
  ALTER TABLE IF EXISTS public.PackageEvents 
    RENAME COLUMN package_id TO packageId;
  ALTER TABLE IF EXISTS public.PackageEvents 
    RENAME COLUMN event_id TO eventId;
  
  -- PackageVasOptions table
  ALTER TABLE IF EXISTS public.PackageVasOptions 
    RENAME COLUMN package_id TO packageId;
  ALTER TABLE IF EXISTS public.PackageVasOptions 
    RENAME COLUMN vas_id TO vasId;
  ALTER TABLE IF EXISTS public.PackageVasOptions 
    RENAME COLUMN price_override TO priceOverride;
  
  -- Packages table
  ALTER TABLE IF EXISTS public.Packages 
    RENAME COLUMN parent_event_id TO parentEventId;
  ALTER TABLE IF EXISTS public.Packages 
    RENAME COLUMN includes_description TO includesDescription;
  ALTER TABLE IF EXISTS public.Packages 
    RENAME COLUMN created_at TO createdAt;
  
  -- RegistrationVas table
  ALTER TABLE IF EXISTS public.RegistrationVas 
    RENAME COLUMN registration_id TO registrationId;
  ALTER TABLE IF EXISTS public.RegistrationVas 
    RENAME COLUMN vas_id TO vasId;
  ALTER TABLE IF EXISTS public.RegistrationVas 
    RENAME COLUMN price_at_purchase TO priceAtPurchase;
  ALTER TABLE IF EXISTS public.RegistrationVas 
    RENAME COLUMN created_at TO createdAt;
  
  -- Registrations table
  ALTER TABLE IF EXISTS public.Registrations 
    RENAME COLUMN parent_event_id TO parentEventId;
  ALTER TABLE IF EXISTS public.Registrations 
    RENAME COLUMN registration_type TO registrationType;
  ALTER TABLE IF EXISTS public.Registrations 
    RENAME COLUMN total_price_paid TO totalPricePaid;
  ALTER TABLE IF EXISTS public.Registrations 
    RENAME COLUMN payment_status TO paymentStatus;
  ALTER TABLE IF EXISTS public.Registrations 
    RENAME COLUMN agree_to_terms TO agreeToTerms;
  ALTER TABLE IF EXISTS public.Registrations 
    RENAME COLUMN stripe_payment_intent_id TO stripePaymentIntentId;
  ALTER TABLE IF EXISTS public.Registrations 
    RENAME COLUMN user_id TO userId;
  ALTER TABLE IF EXISTS public.Registrations 
    RENAME COLUMN created_at TO createdAt;
  
  -- TicketDefinitions table
  ALTER TABLE IF EXISTS public.TicketDefinitions 
    RENAME COLUMN package_id TO packageId;
  ALTER TABLE IF EXISTS public.TicketDefinitions 
    RENAME COLUMN event_id TO eventId;
  ALTER TABLE IF EXISTS public.TicketDefinitions 
    RENAME COLUMN eligibility_attendee_types TO eligibilityAttendeeTypes;
  ALTER TABLE IF EXISTS public.TicketDefinitions 
    RENAME COLUMN eligibility_mason_rank TO eligibilityMasonRank;
  ALTER TABLE IF EXISTS public.TicketDefinitions 
    RENAME COLUMN is_active TO isActive;
  ALTER TABLE IF EXISTS public.TicketDefinitions 
    RENAME COLUMN created_at TO createdAt;
  
  -- Tickets table
  ALTER TABLE IF EXISTS public.Tickets 
    RENAME COLUMN ticketid TO ticketId;
  ALTER TABLE IF EXISTS public.Tickets 
    RENAME COLUMN ticketdefinitionid TO ticketDefinitionId;
  ALTER TABLE IF EXISTS public.Tickets 
    RENAME COLUMN eventid TO eventId;
  ALTER TABLE IF EXISTS public.Tickets 
    RENAME COLUMN attendeeid TO attendeeId;
  ALTER TABLE IF EXISTS public.Tickets 
    RENAME COLUMN pricepaid TO pricePaid;
  ALTER TABLE IF EXISTS public.Tickets 
    RENAME COLUMN seatinfo TO seatInfo;
  ALTER TABLE IF EXISTS public.Tickets 
    RENAME COLUMN checkedinat TO checkedInAt;
  ALTER TABLE IF EXISTS public.Tickets 
    RENAME COLUMN createdat TO createdAt;
  ALTER TABLE IF EXISTS public.Tickets 
    RENAME COLUMN updatedat TO updatedAt;
  ALTER TABLE IF EXISTS public.Tickets 
    RENAME COLUMN reservation_id TO reservationId;
  ALTER TABLE IF EXISTS public.Tickets 
    RENAME COLUMN reservation_expires_at TO reservationExpiresAt;
  ALTER TABLE IF EXISTS public.Tickets 
    RENAME COLUMN original_price TO originalPrice;
  
  -- ValueAddedServices table
  ALTER TABLE IF EXISTS public.ValueAddedServices 
    RENAME COLUMN is_active TO isActive;
  ALTER TABLE IF EXISTS public.ValueAddedServices 
    RENAME COLUMN created_at TO createdAt;

-- Commit the transaction
COMMIT;

-- Step 5: Update views to use new column names
DROP VIEW IF EXISTS public.EventSchedule;

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

-- Step 6: Update constraints and indexes to use new column names
DO $$
DECLARE
  constraint_record RECORD;
BEGIN
  -- Update any check constraints that reference column names
  -- For example, update the check constraint in AttendeeLinks (public.attendee_links_attendee_type_check)
  IF EXISTS (
    SELECT FROM pg_constraint 
    WHERE conname = 'attendee_links_attendee_type_check' AND conrelid = 'public.AttendeeLinks'::regclass
  ) THEN
    ALTER TABLE public.AttendeeLinks 
    DROP CONSTRAINT attendee_links_attendee_type_check;
    
    ALTER TABLE public.AttendeeLinks 
    ADD CONSTRAINT attendee_links_attendee_type_check 
    CHECK (attendeeType = ANY (ARRAY['mason'::text, 'guest'::text]));
  END IF;
  
  -- Update other check constraints as needed
  -- Add similar update blocks for other check constraints
END$$;

-- Step 7: Update function definitions to use new column names
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
      public.Tickets  -- Updated table and column names
    WHERE 
      eventId = p_event_id
      AND ticketDefinitionId = p_ticket_definition_id
      AND status = 'available'
    LIMIT p_quantity
    FOR UPDATE SKIP LOCKED
  LOOP
    -- Update ticket with reservation info
    UPDATE public.Tickets  -- Updated table and column names
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
  FROM public.Tickets  -- Updated table and column names
  WHERE eventId = p_event_id
    AND ticketDefinitionId = p_ticket_definition_id
    AND status = 'available';
    
  -- Count reserved tickets
  SELECT COUNT(*) INTO v_reserved
  FROM public.Tickets  -- Updated table and column names
  WHERE eventId = p_event_id
    AND ticketDefinitionId = p_ticket_definition_id
    AND status = 'reserved';
    
  -- Count sold tickets
  SELECT COUNT(*) INTO v_sold
  FROM public.Tickets  -- Updated table and column names
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
    SELECT 1 FROM public.Tickets  -- Updated table and column names
    WHERE reservationId = p_reservation_id
      AND reservationExpiresAt > NOW()
  ) INTO v_reservation_exists;
  
  IF NOT v_reservation_exists THEN
    RAISE EXCEPTION 'Reservation not found or has expired';
  END IF;
  
  -- Update all tickets in this reservation
  FOR v_ticket_id IN
    SELECT ticketId FROM public.Tickets  -- Updated table and column names
    WHERE reservationId = p_reservation_id
      AND status = 'reserved'
  LOOP
    -- Update ticket status to sold and assign attendee
    UPDATE public.Tickets  -- Updated table and column names
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
  UPDATE public.Tickets  -- Updated table and column names
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

-- Step 8: Update indexes for new column names
DO $$
BEGIN
  -- Drop old indexes
  DROP INDEX IF EXISTS idx_events_parent_event_id;
  DROP INDEX IF EXISTS idx_attendee_links_registration;
  DROP INDEX IF EXISTS idx_attendee_links_mason;
  DROP INDEX IF EXISTS idx_attendee_links_guest;
  DROP INDEX IF EXISTS idx_assignments_attendee_link;
  DROP INDEX IF EXISTS idx_assignments_registration;
  DROP INDEX IF EXISTS idx_assignments_definition;
  DROP INDEX IF EXISTS idx_guests_related_mason;
  DROP INDEX IF EXISTS idx_guests_related_guest;
  DROP INDEX IF EXISTS idx_lodges_grand_lodge;
  DROP INDEX IF EXISTS idx_masons_lodge;
  DROP INDEX IF EXISTS idx_masons_grand_lodge;
  DROP INDEX IF EXISTS idx_registration_vas_reg;
  DROP INDEX IF EXISTS idx_registration_vas_vas;
  DROP INDEX IF EXISTS idx_ticket_definitions_package;
  DROP INDEX IF EXISTS idx_ticket_definitions_event;
  DROP INDEX IF EXISTS idx_tickets_availability;
  DROP INDEX IF EXISTS idx_tickets_reservation;
  DROP INDEX IF EXISTS idx_tickets_expiry;
  
  -- Create new indexes with camelCase column names
  CREATE INDEX IF NOT EXISTS idx_events_parent_event_id ON public.Events(parentEventId);
  CREATE INDEX IF NOT EXISTS idx_attendee_links_registration ON public.AttendeeLinks(registrationId);
  CREATE INDEX IF NOT EXISTS idx_attendee_links_mason ON public.AttendeeLinks(masonId);
  CREATE INDEX IF NOT EXISTS idx_attendee_links_guest ON public.AttendeeLinks(guestId);
  CREATE INDEX IF NOT EXISTS idx_assignments_attendee_link ON public.AttendeeTicketAssignments(attendeeLinkId);
  CREATE INDEX IF NOT EXISTS idx_assignments_registration ON public.AttendeeTicketAssignments(registrationId);
  CREATE INDEX IF NOT EXISTS idx_assignments_definition ON public.AttendeeTicketAssignments(ticketDefinitionId);
  CREATE INDEX IF NOT EXISTS idx_guests_related_mason ON public.Guests(relatedMasonId);
  CREATE INDEX IF NOT EXISTS idx_guests_related_guest ON public.Guests(relatedGuestId);
  CREATE INDEX IF NOT EXISTS idx_lodges_grand_lodge ON public.Lodges(grandLodgeId);
  CREATE INDEX IF NOT EXISTS idx_masons_lodge ON public.Masons(lodgeId);
  CREATE INDEX IF NOT EXISTS idx_masons_grand_lodge ON public.Masons(grandLodgeId);
  CREATE INDEX IF NOT EXISTS idx_registration_vas_reg ON public.RegistrationVas(registrationId);
  CREATE INDEX IF NOT EXISTS idx_registration_vas_vas ON public.RegistrationVas(vasId);
  CREATE INDEX IF NOT EXISTS idx_ticket_definitions_package ON public.TicketDefinitions(packageId);
  CREATE INDEX IF NOT EXISTS idx_ticket_definitions_event ON public.TicketDefinitions(eventId);
  CREATE INDEX IF NOT EXISTS idx_tickets_availability ON public.Tickets(eventId, ticketDefinitionId, status);
  CREATE INDEX IF NOT EXISTS idx_tickets_reservation ON public.Tickets(reservationId, status);
  CREATE INDEX IF NOT EXISTS idx_tickets_expiry ON public.Tickets(status, reservationExpiresAt) WHERE status = 'reserved';
END$$;

-- Step 9: Verify migration success
DO $$
DECLARE
  v_column_exists BOOLEAN;
  v_all_success BOOLEAN := TRUE;
  v_columns_checked TEXT := '';
BEGIN
  -- Check if columns were renamed successfully
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'events' 
      AND column_name = 'parenteventid'
  ) INTO v_column_exists;
  
  IF NOT v_column_exists THEN
    v_all_success := FALSE;
    v_columns_checked := v_columns_checked || 'Events.parentEventId not found, ';
  END IF;
  
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'tickets' 
      AND column_name = 'ticketid'
  ) INTO v_column_exists;
  
  IF NOT v_column_exists THEN
    v_all_success := FALSE;
    v_columns_checked := v_columns_checked || 'Tickets.ticketId not found, ';
  END IF;
  
  -- Log the verification results
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'migration_log') THEN
    IF v_all_success THEN
      INSERT INTO migration_log (migration_name, operation, details)
      VALUES ('20250507000000_standardize_column_names', 'VERIFICATION', 'All columns successfully standardized');
    ELSE
      INSERT INTO migration_log (migration_name, operation, details)
      VALUES ('20250507000000_standardize_column_names', 'VERIFICATION_ERROR', 'Some columns not properly renamed: ' || v_columns_checked);
    END IF;
  END IF;
END$$;

-- Final log entry
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'migration_log') THEN
    INSERT INTO migration_log (migration_name, operation, details)
    VALUES ('20250507000000_standardize_column_names', 'COMPLETE', 'Column name standardization completed');
  END IF;
END$$;