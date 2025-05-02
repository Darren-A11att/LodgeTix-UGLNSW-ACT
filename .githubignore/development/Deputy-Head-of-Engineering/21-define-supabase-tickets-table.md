**Title:** Define Supabase Migration for Tickets Table

**Description:** Create the SQL migration script to define a `Tickets` (or `AttendeeEvents`) table linking attendees to specific child events/sessions they are registered for.

**Instructions:**

1.  Create a new SQL migration file (e.g., `supabase/migrations/YYYYMMDDHHMMSS_create_tickets.sql`).
2.  Add SQL `CREATE TABLE` statement for `public.Tickets` (using this name):
    ```sql
    CREATE TABLE public.Tickets (
        ticketId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        attendeeId UUID NOT NULL REFERENCES public.Attendees(attendeeId) ON DELETE CASCADE,
        eventId UUID NOT NULL REFERENCES public.Events(id) ON DELETE CASCADE, -- Link to specific child event/session (assuming Event PK is id)
        ticketDefinitionId UUID NULL REFERENCES public.TicketDefinitions(id) ON DELETE SET NULL, -- Optional: Link to the type of ticket bought
        pricePaid NUMERIC(10, 2) NOT NULL, -- Actual price paid for this specific event ticket
        seatInfo VARCHAR(100) NULL,
        status VARCHAR(50) DEFAULT 'Active' NOT NULL, -- e.g., Active, Cancelled
        checkedInAt TIMESTAMP WITH TIME ZONE NULL,
        createdAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updatedAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        UNIQUE (attendeeId, eventId) -- Prevent double-booking for the same event/session
    );
    COMMENT ON TABLE public.Tickets IS 'Links an Attendee to a specific sub-event/session they are registered for.';
    ALTER TABLE public.Tickets ENABLE ROW LEVEL SECURITY;
    CREATE INDEX idx_tickets_attendee_id ON public.Tickets(attendeeId);
    CREATE INDEX idx_tickets_event_id ON public.Tickets(eventId);
    -- Add policies later
    ```
3.  Use the Supabase dashboard or CLI to apply this migration, or prepare to call `mcp_supabase_apply_migration` tool with the SQL content and a suitable name (e.g., `create_tickets_table`). 