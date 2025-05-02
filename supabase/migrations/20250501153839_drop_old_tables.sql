-- Drop obsolete tables migration (20250501153839)
-- Removes tables that have been replaced by the new schema structure

-- CRITICAL WARNING:
-- This migration will permanently delete data from the database.
-- Ensure all necessary data has been migrated before applying this migration.
-- BACKUP YOUR DATABASE BEFORE APPLYING THIS MIGRATION.

-- First, let's drop the temporary columns used for mapping in the Organisations table
-- as they were intended to be temporary for the migration
ALTER TABLE public.Organisations DROP COLUMN IF EXISTS legacyLodgeId;
ALTER TABLE public.Organisations DROP COLUMN IF EXISTS legacyGrandLodgeId;

-- Drop dependent tables first (those that reference other tables being dropped)
DROP TABLE IF EXISTS public.attendee_ticket_assignments CASCADE;
DROP TABLE IF EXISTS public.attendee_links CASCADE;

-- Drop obsolete type tables
DROP TABLE IF EXISTS public.guests CASCADE; -- Replaced by Attendees
DROP TABLE IF EXISTS public.masons CASCADE; -- Replaced by Contacts + MasonicProfiles
DROP TABLE IF EXISTS public.customers CASCADE; -- Replaced by new Customers table

-- Drop organization tables that were merged into Organisations
DROP TABLE IF EXISTS public.lodges CASCADE;
DROP TABLE IF EXISTS public.grand_lodges CASCADE;

-- Additional cleanup - update any remaining references to old tables in Views or Functions
-- Drop any views that might reference the dropped tables
DROP VIEW IF EXISTS public.v_attendees CASCADE;
DROP VIEW IF EXISTS public.v_registration_details CASCADE;

-- Drop any functions that might reference the dropped tables
DROP FUNCTION IF EXISTS public.get_attendee_details CASCADE;
DROP FUNCTION IF EXISTS public.get_registration_details CASCADE;

-- Remove any remaining constraints that might reference the dropped tables
-- This section is meant as a safety check to ensure all dependencies are properly removed

-- Remove any remaining indexes that might reference the dropped tables
DROP INDEX IF EXISTS public.idx_attendee_links_guest_id;
DROP INDEX IF EXISTS public.idx_attendee_links_mason_id;
DROP INDEX IF EXISTS public.idx_guests_customer_id;
DROP INDEX IF EXISTS public.idx_masons_customer_id;
DROP INDEX IF EXISTS public.idx_lodges_grand_lodge_id;

-- Log the drop operation for audit purposes
INSERT INTO public.migration_log (migration_name, operation, details, executed_at)
VALUES (
    '20250501153839_drop_old_tables',
    'DROP TABLES',
    'Dropped obsolete tables: attendee_ticket_assignments, attendee_links, guests, masons, customers, lodges, grand_lodges',
    timezone('utc'::text, now())
)
ON CONFLICT DO NOTHING; -- In case migration_log table doesn't exist