**Title:** Drop Obsolete Supabase Tables

**Description:** Remove tables that have been fully replaced by the new schema structure after data migration (if any) is complete.

**Instructions:**

1.  **CRITICAL:** Ensure all necessary data from these tables has been migrated or is no longer needed before proceeding. **Backup your database before applying this migration.**
2.  Create a new SQL migration file (e.g., `supabase/migrations/YYYYMMDDHHMMSS_drop_old_tables.sql`).
3.  Add SQL `DROP TABLE` statements for obsolete tables. Check foreign key constraints before dropping.
    ```sql
    -- Drop dependent tables first or use CASCADE carefully
    DROP TABLE IF EXISTS public.attendee_ticket_assignments CASCADE;
    DROP TABLE IF EXISTS public.attendee_links CASCADE;
    DROP TABLE IF EXISTS public.guests CASCADE; -- Replaced by Attendees
    DROP TABLE IF EXISTS public.masons CASCADE; -- Replaced by Contacts + MasonicProfiles
    DROP TABLE IF EXISTS public.customers CASCADE; -- Replaced by new Customers table definition in Task 16

    -- Drop Lodges/GrandLodges ONLY if you chose Option A (Merge) in Task 22
    DROP TABLE IF EXISTS public.Lodges CASCADE;
    DROP TABLE IF EXISTS public.GrandLodges CASCADE;

    -- Drop other potentially obsolete tables identified during analysis
    -- DROP TABLE IF EXISTS public.registration_vas CASCADE; -- If VAS handling changed
    -- etc.
    ```
4.  Use the Supabase dashboard or CLI to apply this migration, or prepare to call `mcp_supabase_apply_migration` tool with the SQL content and a suitable name (e.g., `drop_obsolete_tables`). **Apply with extreme caution.** 