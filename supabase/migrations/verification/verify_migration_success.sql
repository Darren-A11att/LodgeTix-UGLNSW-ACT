-- Comprehensive Verification Queries for Database Schema Migration
-- Use these queries to verify the entire migration was successful

-- Create a temporary table for verification results
CREATE TEMPORARY TABLE verification_results (
  check_id SERIAL PRIMARY KEY,
  check_name TEXT NOT NULL,
  phase TEXT NOT NULL,
  status TEXT NOT NULL,
  details TEXT
);

-- Phase 1: Function Parameter Standardization Verification
-- Check 1.1: Verify the reserve_tickets function with standardized parameters
DO $$
DECLARE
  v_function_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM pg_proc 
    WHERE proname = 'reserve_tickets'
    AND pg_get_function_arguments(oid) LIKE '%p_ticket_definition_id uuid%'
  ) INTO v_function_exists;
  
  IF v_function_exists THEN
    INSERT INTO verification_results (check_name, phase, status, details)
    VALUES ('Reserve Tickets Function Parameters', 'Phase 1', 'PASS', 
           'reserve_tickets function exists with standardized parameter name');
  ELSE
    INSERT INTO verification_results (check_name, phase, status, details)
    VALUES ('Reserve Tickets Function Parameters', 'Phase 1', 'FAIL', 
           'reserve_tickets function does not exist with standardized parameter name');
  END IF;
END$$;

-- Check 1.2: Verify the get_ticket_availability function with standardized parameters
DO $$
DECLARE
  v_function_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM pg_proc 
    WHERE proname = 'get_ticket_availability'
    AND pg_get_function_arguments(oid) LIKE '%p_ticket_definition_id uuid%'
  ) INTO v_function_exists;
  
  IF v_function_exists THEN
    INSERT INTO verification_results (check_name, phase, status, details)
    VALUES ('Get Ticket Availability Function Parameters', 'Phase 1', 'PASS', 
           'get_ticket_availability function exists with standardized parameter name');
  ELSE
    INSERT INTO verification_results (check_name, phase, status, details)
    VALUES ('Get Ticket Availability Function Parameters', 'Phase 1', 'FAIL', 
           'get_ticket_availability function does not exist with standardized parameter name');
  END IF;
END$$;

-- Phase 2: Table Name Standardization Verification
-- Check 2.1: Verify tables are using PascalCase naming
DO $$
DECLARE
  v_non_pascal_count INTEGER;
  v_tables_list TEXT := '';
BEGIN
  -- Count tables that don't follow PascalCase convention (excluding system tables and migration_log)
  SELECT COUNT(*) INTO v_non_pascal_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name !~ '^[A-Z][a-zA-Z0-9]*$'  -- PascalCase pattern
  AND table_name NOT IN ('migration_log');  -- Exclude utility tables
  
  -- If any non-PascalCase tables are found, list them
  IF v_non_pascal_count > 0 THEN
    SELECT string_agg(table_name, ', ') INTO v_tables_list
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name !~ '^[A-Z][a-zA-Z0-9]*$'  -- Not PascalCase
    AND table_name NOT IN ('migration_log');  -- Exclude utility tables
  END IF;
  
  IF v_non_pascal_count = 0 THEN
    INSERT INTO verification_results (check_name, phase, status, details)
    VALUES ('Table Name Standardization', 'Phase 2', 'PASS', 
           'All tables follow PascalCase naming convention');
  ELSE
    INSERT INTO verification_results (check_name, phase, status, details)
    VALUES ('Table Name Standardization', 'Phase 2', 'FAIL', 
           v_non_pascal_count || ' tables do not follow PascalCase naming: ' || v_tables_list);
  END IF;
END$$;

-- Check 2.2: Verify critical tables exist with proper names
DO $$
DECLARE
  v_missing_tables TEXT := '';
  v_all_exist BOOLEAN := TRUE;
BEGIN
  -- Check for Events table
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Events') THEN
    v_missing_tables := v_missing_tables || 'Events, ';
    v_all_exist := FALSE;
  END IF;
  
  -- Check for Tickets table
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Tickets') THEN
    v_missing_tables := v_missing_tables || 'Tickets, ';
    v_all_exist := FALSE;
  END IF;
  
  -- Check for Registrations table
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Registrations') THEN
    v_missing_tables := v_missing_tables || 'Registrations, ';
    v_all_exist := FALSE;
  END IF;
  
  -- Check for TicketDefinitions table
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'TicketDefinitions') THEN
    v_missing_tables := v_missing_tables || 'TicketDefinitions, ';
    v_all_exist := FALSE;
  END IF;
  
  IF v_all_exist THEN
    INSERT INTO verification_results (check_name, phase, status, details)
    VALUES ('Critical Tables Existence', 'Phase 2', 'PASS', 
           'All critical tables exist with proper names');
  ELSE
    INSERT INTO verification_results (check_name, phase, status, details)
    VALUES ('Critical Tables Existence', 'Phase 2', 'FAIL', 
           'Missing critical tables: ' || v_missing_tables);
  END IF;
END$$;

-- Phase 3: Column Name Standardization Verification
-- Check 3.1: Verify columns in Events table are using camelCase
DO $$
DECLARE
  v_non_camel_count INTEGER;
  v_columns_list TEXT := '';
BEGIN
  -- Check if Events table exists first
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Events') THEN
    -- Count columns that don't follow camelCase convention (excluding system columns)
    SELECT COUNT(*) INTO v_non_camel_count
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Events'
    AND column_name !~ '^[a-z][a-zA-Z0-9]*$'  -- camelCase pattern
    AND column_name NOT LIKE 'pg_%';  -- Exclude system columns
    
    -- If any non-camelCase columns are found, list them
    IF v_non_camel_count > 0 THEN
      SELECT string_agg(column_name, ', ') INTO v_columns_list
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Events'
      AND column_name !~ '^[a-z][a-zA-Z0-9]*$'  -- Not camelCase
      AND column_name NOT LIKE 'pg_%';  -- Exclude system columns
    END IF;
    
    IF v_non_camel_count = 0 THEN
      INSERT INTO verification_results (check_name, phase, status, details)
      VALUES ('Events Table Column Names', 'Phase 3', 'PASS', 
             'All columns in Events table follow camelCase naming convention');
    ELSE
      INSERT INTO verification_results (check_name, phase, status, details)
      VALUES ('Events Table Column Names', 'Phase 3', 'FAIL', 
             v_non_camel_count || ' columns do not follow camelCase naming: ' || v_columns_list);
    END IF;
  ELSE
    INSERT INTO verification_results (check_name, phase, status, details)
    VALUES ('Events Table Column Names', 'Phase 3', 'SKIP', 
           'Events table does not exist, cannot check column names');
  END IF;
END$$;

-- Check 3.2: Verify columns in Tickets table are using camelCase
DO $$
DECLARE
  v_non_camel_count INTEGER;
  v_columns_list TEXT := '';
BEGIN
  -- Check if Tickets table exists first
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Tickets') THEN
    -- Count columns that don't follow camelCase convention (excluding system columns)
    SELECT COUNT(*) INTO v_non_camel_count
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Tickets'
    AND column_name !~ '^[a-z][a-zA-Z0-9]*$'  -- camelCase pattern
    AND column_name NOT LIKE 'pg_%';  -- Exclude system columns
    
    -- If any non-camelCase columns are found, list them
    IF v_non_camel_count > 0 THEN
      SELECT string_agg(column_name, ', ') INTO v_columns_list
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Tickets'
      AND column_name !~ '^[a-z][a-zA-Z0-9]*$'  -- Not camelCase
      AND column_name NOT LIKE 'pg_%';  -- Exclude system columns
    END IF;
    
    IF v_non_camel_count = 0 THEN
      INSERT INTO verification_results (check_name, phase, status, details)
      VALUES ('Tickets Table Column Names', 'Phase 3', 'PASS', 
             'All columns in Tickets table follow camelCase naming convention');
    ELSE
      INSERT INTO verification_results (check_name, phase, status, details)
      VALUES ('Tickets Table Column Names', 'Phase 3', 'FAIL', 
             v_non_camel_count || ' columns do not follow camelCase naming: ' || v_columns_list);
    END IF;
  ELSE
    INSERT INTO verification_results (check_name, phase, status, details)
    VALUES ('Tickets Table Column Names', 'Phase 3', 'SKIP', 
           'Tickets table does not exist, cannot check column names');
  END IF;
END$$;

-- Check 3.3: Verify specific column name changes in Tickets table
DO $$
DECLARE
  v_column_exists BOOLEAN;
BEGIN
  -- Check if Tickets table exists first
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Tickets') THEN
    -- Check for ticketId column (was ticketid)
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Tickets'
      AND column_name = 'ticketId'
    ) INTO v_column_exists;
    
    IF v_column_exists THEN
      INSERT INTO verification_results (check_name, phase, status, details)
      VALUES ('Specific Column Name Change (ticketId)', 'Phase 3', 'PASS', 
             'ticketId column exists in Tickets table');
    ELSE
      INSERT INTO verification_results (check_name, phase, status, details)
      VALUES ('Specific Column Name Change (ticketId)', 'Phase 3', 'FAIL', 
             'ticketId column does not exist in Tickets table (still using old name?)');
    END IF;
    
    -- Check for reservationId column (was reservation_id)
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Tickets'
      AND column_name = 'reservationId'
    ) INTO v_column_exists;
    
    IF v_column_exists THEN
      INSERT INTO verification_results (check_name, phase, status, details)
      VALUES ('Specific Column Name Change (reservationId)', 'Phase 3', 'PASS', 
             'reservationId column exists in Tickets table');
    ELSE
      INSERT INTO verification_results (check_name, phase, status, details)
      VALUES ('Specific Column Name Change (reservationId)', 'Phase 3', 'FAIL', 
             'reservationId column does not exist in Tickets table (still using old name?)');
    END IF;
  ELSE
    INSERT INTO verification_results (check_name, phase, status, details)
    VALUES ('Specific Column Name Changes', 'Phase 3', 'SKIP', 
           'Tickets table does not exist, cannot check specific column names');
  END IF;
END$$;

-- Phase 4: Schema Consolidation Verification
-- Check 4.1: Verify no duplicate tables exist
DO $$
DECLARE
  v_duplicate_count INTEGER;
  v_duplicates_list TEXT := '';
BEGIN
  -- Find tables that differ only by case (potential duplicates)
  SELECT COUNT(*) INTO v_duplicate_count
  FROM (
    SELECT LOWER(table_name) AS lower_name, COUNT(*) AS count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    GROUP BY LOWER(table_name)
    HAVING COUNT(*) > 1
  ) AS duplicates;
  
  -- If duplicates found, list them
  IF v_duplicate_count > 0 THEN
    SELECT string_agg(lower_name, ', ') INTO v_duplicates_list
    FROM (
      SELECT LOWER(table_name) AS lower_name, COUNT(*) AS count
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      GROUP BY LOWER(table_name)
      HAVING COUNT(*) > 1
    ) AS duplicates;
  END IF;
  
  IF v_duplicate_count = 0 THEN
    INSERT INTO verification_results (check_name, phase, status, details)
    VALUES ('No Duplicate Tables', 'Phase 4', 'PASS', 
           'No duplicate tables found in the database');
  ELSE
    INSERT INTO verification_results (check_name, phase, status, details)
    VALUES ('No Duplicate Tables', 'Phase 4', 'FAIL', 
           v_duplicate_count || ' duplicate tables found: ' || v_duplicates_list);
  END IF;
END$$;

-- Check 4.2: Verify foreign key relationships are intact
DO $$
DECLARE
  v_broken_fks_count INTEGER;
  v_broken_fks_list TEXT := '';
BEGIN
  -- Find broken foreign key relationships
  SELECT COUNT(*) INTO v_broken_fks_count
  FROM (
    SELECT 
      tc.constraint_name,
      tc.table_name AS source_table,
      kcu.column_name AS source_column,
      ccu.table_name AS target_table,
      ccu.column_name AS target_column
    FROM 
      information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    WHERE 
      tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = ccu.table_name
      )
  ) AS broken_fks;
  
  -- If broken FKs found, list them
  IF v_broken_fks_count > 0 THEN
    SELECT string_agg(source_table || '.' || source_column || ' -> ' || target_table || '.' || target_column, ', ') 
    INTO v_broken_fks_list
    FROM (
      SELECT 
        tc.constraint_name,
        tc.table_name AS source_table,
        kcu.column_name AS source_column,
        ccu.table_name AS target_table,
        ccu.column_name AS target_column
      FROM 
        information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE 
        tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND NOT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = ccu.table_name
        )
    ) AS broken_fks;
  END IF;
  
  IF v_broken_fks_count = 0 THEN
    INSERT INTO verification_results (check_name, phase, status, details)
    VALUES ('Foreign Key Integrity', 'Phase 4', 'PASS', 
           'All foreign key relationships are intact');
  ELSE
    INSERT INTO verification_results (check_name, phase, status, details)
    VALUES ('Foreign Key Integrity', 'Phase 4', 'FAIL', 
           v_broken_fks_count || ' broken foreign key relationships found: ' || v_broken_fks_list);
  END IF;
END$$;

-- Check 4.3: Verify data integrity in key tables
DO $$
DECLARE
  v_orphaned_tickets INTEGER;
  v_orphaned_attendees INTEGER;
BEGIN
  -- Check for orphaned tickets (tickets without valid attendees)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Tickets')
     AND EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Attendees') THEN
    SELECT COUNT(*) INTO v_orphaned_tickets
    FROM public.Tickets t
    LEFT JOIN public.Attendees a ON t.attendeeId = a.attendeeId
    WHERE t.attendeeId IS NOT NULL AND a.attendeeId IS NULL;
    
    IF v_orphaned_tickets = 0 THEN
      INSERT INTO verification_results (check_name, phase, status, details)
      VALUES ('Ticket-Attendee Relationships', 'Phase 4', 'PASS', 
             'All tickets have valid attendee references');
    ELSE
      INSERT INTO verification_results (check_name, phase, status, details)
      VALUES ('Ticket-Attendee Relationships', 'Phase 4', 'FAIL', 
             v_orphaned_tickets || ' tickets have invalid attendee references');
    END IF;
  ELSE
    INSERT INTO verification_results (check_name, phase, status, details)
    VALUES ('Ticket-Attendee Relationships', 'Phase 4', 'SKIP', 
           'Required tables do not exist, cannot check relationships');
  END IF;
  
  -- Check for orphaned attendees (attendees without valid registrations)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Attendees')
     AND EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Registrations') THEN
    SELECT COUNT(*) INTO v_orphaned_attendees
    FROM public.Attendees a
    LEFT JOIN public.Registrations r ON a.registrationId = r.registrationId
    WHERE r.registrationId IS NULL;
    
    IF v_orphaned_attendees = 0 THEN
      INSERT INTO verification_results (check_name, phase, status, details)
      VALUES ('Attendee-Registration Relationships', 'Phase 4', 'PASS', 
             'All attendees have valid registration references');
    ELSE
      INSERT INTO verification_results (check_name, phase, status, details)
      VALUES ('Attendee-Registration Relationships', 'Phase 4', 'FAIL', 
             v_orphaned_attendees || ' attendees have invalid registration references');
    END IF;
  ELSE
    INSERT INTO verification_results (check_name, phase, status, details)
    VALUES ('Attendee-Registration Relationships', 'Phase 4', 'SKIP', 
           'Required tables do not exist, cannot check relationships');
  END IF;
END$$;

-- Create a summary view of all verification results
DO $$
DECLARE
  v_total_checks INTEGER;
  v_passed_checks INTEGER;
  v_failed_checks INTEGER;
  v_skipped_checks INTEGER;
  v_success_rate NUMERIC;
BEGIN
  -- Count total checks
  SELECT COUNT(*) INTO v_total_checks FROM verification_results;
  
  -- Count passed checks
  SELECT COUNT(*) INTO v_passed_checks FROM verification_results WHERE status = 'PASS';
  
  -- Count failed checks
  SELECT COUNT(*) INTO v_failed_checks FROM verification_results WHERE status = 'FAIL';
  
  -- Count skipped checks
  SELECT COUNT(*) INTO v_skipped_checks FROM verification_results WHERE status = 'SKIP';
  
  -- Calculate success rate
  IF (v_total_checks - v_skipped_checks) > 0 THEN
    v_success_rate := (v_passed_checks::NUMERIC / (v_total_checks - v_skipped_checks)::NUMERIC) * 100;
  ELSE
    v_success_rate := 0;
  END IF;
  
  -- Insert summary record
  INSERT INTO verification_results (check_name, phase, status, details)
  VALUES ('VERIFICATION SUMMARY', 'ALL PHASES', 
         CASE WHEN v_failed_checks = 0 THEN 'PASS' ELSE 'FAIL' END,
         'Total Checks: ' || v_total_checks || 
         ', Passed: ' || v_passed_checks || 
         ', Failed: ' || v_failed_checks || 
         ', Skipped: ' || v_skipped_checks || 
         ', Success Rate: ' || ROUND(v_success_rate, 2) || '%');
END$$;

-- Display all verification results
SELECT * FROM verification_results ORDER BY phase, check_id;

-- Clean up
-- DROP TABLE verification_results; -- Uncomment this line to clean up the temporary table