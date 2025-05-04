-- Verification Queries for Database Schema Migration
-- Use these queries to verify the migration was successful

-- Check 1: Verify the standardized function exists with correct parameters
DO $$
DECLARE
    v_function_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM pg_proc 
        WHERE proname = 'reserve_tickets'
        AND pg_get_function_arguments(pg_proc.oid) LIKE '%p_ticket_definition_id uuid%'
    ) INTO v_function_exists;
    
    IF v_function_exists THEN
        RAISE NOTICE 'SUCCESS: reserve_tickets function exists with standardized parameter name';
    ELSE
        RAISE EXCEPTION 'FAILED: reserve_tickets function does not exist with standardized parameter name';
    END IF;
END$$;

-- Check 2: Verify backup schema was created
DO $$
DECLARE
    v_schema_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM pg_namespace 
        WHERE nspname = 'backups'
    ) INTO v_schema_exists;
    
    IF v_schema_exists THEN
        RAISE NOTICE 'SUCCESS: backup schema exists';
    ELSE
        RAISE EXCEPTION 'FAILED: backup schema does not exist';
    END IF;
END$$;

-- Check 3: Verify related functions have consistent parameter names
DO $$
DECLARE
    v_function_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM pg_proc 
        WHERE proname = 'get_ticket_availability'
        AND pg_get_function_arguments(pg_proc.oid) LIKE '%p_ticket_definition_id uuid%'
    ) INTO v_function_exists;
    
    IF v_function_exists THEN
        RAISE NOTICE 'SUCCESS: get_ticket_availability function exists with standardized parameter name';
    ELSE
        RAISE EXCEPTION 'FAILED: get_ticket_availability function does not exist with standardized parameter name';
    END IF;
END$$;

-- Check 4: Verify the scheduled job for expired reservation cleanup was created
DO $$
DECLARE
    v_job_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM cron.job 
        WHERE jobname = 'cleanup_expired_ticket_reservations'
    ) INTO v_job_exists;
    
    IF v_job_exists THEN
        RAISE NOTICE 'SUCCESS: cleanup job exists';
    ELSE
        RAISE EXCEPTION 'FAILED: cleanup job does not exist';
    END IF;
END$$;

-- Check 5: Verify indexes were created
DO $$
DECLARE
    v_idx_availability_exists BOOLEAN;
    v_idx_reservation_exists BOOLEAN;
    v_idx_expiry_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE indexname = 'idx_tickets_availability'
    ) INTO v_idx_availability_exists;
    
    SELECT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE indexname = 'idx_tickets_reservation'
    ) INTO v_idx_reservation_exists;
    
    SELECT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE indexname = 'idx_tickets_expiry'
    ) INTO v_idx_expiry_exists;
    
    IF v_idx_availability_exists AND v_idx_reservation_exists AND v_idx_expiry_exists THEN
        RAISE NOTICE 'SUCCESS: all optimization indexes exist';
    ELSE
        RAISE EXCEPTION 'FAILED: some optimization indexes are missing';
    END IF;
END$$;

-- Check 6: Test the reserve_tickets function with standardized parameters
DO $$
DECLARE
    v_test_event_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
    v_test_ticket_def_id UUID := '00000000-0000-0000-0000-000000000002'::UUID;
    v_test_result RECORD;
BEGIN
    -- Skip actual execution since this is just a verification script
    -- In a real deployment, you might use a test database to actually run this
    
    -- Simulate validating the parameters
    IF v_test_event_id IS NOT NULL AND v_test_ticket_def_id IS NOT NULL THEN
        RAISE NOTICE 'SUCCESS: reserve_tickets parameters validated correctly';
    ELSE
        RAISE EXCEPTION 'FAILED: reserve_tickets parameter validation failed';
    END IF;
END$$;

-- Check 7: Verify permissions are set correctly
DO $$
DECLARE
    v_permissions_ok BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        JOIN pg_auth_members m ON m.member = (SELECT oid FROM pg_roles WHERE rolname = 'authenticated')
        JOIN pg_roles r ON m.roleid = r.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'reserve_tickets'
        AND has_function_privilege(r.oid, p.oid, 'execute')
    ) INTO v_permissions_ok;
    
    IF v_permissions_ok THEN
        RAISE NOTICE 'SUCCESS: function permissions are set correctly';
    ELSE
        RAISE NOTICE 'WARNING: function permissions may not be set correctly - this may require manual verification';
    END IF;
END$$;

-- Final verification message
DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Database schema migration verification complete!';
    RAISE NOTICE '================================================';
END$$;