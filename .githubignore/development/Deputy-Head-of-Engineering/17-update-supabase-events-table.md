**Title:** Update Supabase Events Table Schema

**Description:** Modify the existing `Events` table to align with the new structure, removing redundant fields and potentially adding new links.

**Instructions:**

1.  Create a new SQL migration file (e.g., `supabase/migrations/YYYYMMDDHHMMSS_update_events.sql`).
2.  Add SQL `ALTER TABLE` statements for `public.Events`:
    ```sql
    -- Rename PK for consistency if desired (check constraints first)
    -- ALTER TABLE public.Events RENAME COLUMN id TO eventId;

    -- Remove fields that are calculated or better handled elsewhere
    ALTER TABLE public.Events
        DROP COLUMN IF EXISTS price, -- Price is handled by Tickets/Stripe Prices
        DROP COLUMN IF EXISTS currentAttendees,
        DROP COLUMN IF EXISTS remainingTickets;

    -- Add/ensure FK to Location table
    ALTER TABLE public.Events
        ADD COLUMN IF NOT EXISTS locationId UUID NULL REFERENCES public.Locations(locationId) ON DELETE SET NULL;

    -- Ensure FKs to registration_availabilities and display_scopes exist (already present based on schema dump)
    -- Re-add if dropped or ensure they are correct
    -- ALTER TABLE public.Events ADD CONSTRAINT events_registration_availability_id_fkey FOREIGN KEY (registration_availability_id) REFERENCES public.registration_availabilities(id);
    -- ALTER TABLE public.Events ADD CONSTRAINT events_display_scope_id_fkey FOREIGN KEY (display_scope_id) REFERENCES public.display_scopes(id);

    -- Add link to the organising entity
    ALTER TABLE public.Events
        ADD COLUMN IF NOT EXISTS organiserOrganisationId UUID NULL REFERENCES public.Organisations(organisationId) ON DELETE SET NULL;

    -- Ensure correct data types (e.g., timestamps)
    ALTER TABLE public.Events
        ALTER COLUMN event_start TYPE TIMESTAMP WITH TIME ZONE USING event_start::timestamp with time zone,
        ALTER COLUMN event_end TYPE TIMESTAMP WITH TIME ZONE USING event_end::timestamp with time zone;

    COMMENT ON TABLE public.Events IS 'Stores details about parent events and sub-events/sessions.';
    -- Add other necessary ALTER statements based on final design decisions
    ```
3.  Use the Supabase dashboard or CLI to apply this migration, or prepare to call `mcp_supabase_apply_migration` tool with the SQL content and a suitable name (e.g., `update_events_table`). 