**Title:** Define Supabase Migration for Attendees Table

**Description:** Create the SQL migration script to define the core `Attendees` table, linking registrations to contacts and capturing event-specific roles/details.

**Instructions:**

1.  Create a new SQL migration file (e.g., `supabase/migrations/YYYYMMDDHHMMSS_create_attendees.sql`).
2.  Add SQL `CREATE TABLE` statement for `public.Attendees`:
    ```sql
    CREATE TYPE public.attendee_type AS ENUM (
        'Mason',
        'Guest',
        'LadyPartner',
        'GuestPartner'
    );

    CREATE TYPE public.attendee_contact_preference AS ENUM (
        'Directly',
        'PrimaryAttendee',
        'Mason', -- Refers to the related Mason attendee
        'Guest', -- Refers to the related Guest attendee
        'ProvideLater'
    );

    CREATE TABLE public.Attendees (
        attendeeId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        registrationId UUID NOT NULL REFERENCES public.Registrations(registrationId) ON DELETE CASCADE, -- Link to registration
        contactId UUID NOT NULL REFERENCES public.Contacts(contactId) ON DELETE RESTRICT, -- Link to the core person
        attendeeType public.attendee_type NOT NULL,
        -- Event-specific overrides or persona fields
        eventTitle VARCHAR(100) NULL, -- Use if different from Contacts.title
        dietaryRequirements TEXT NULL, -- Store event-specific dietary here
        specialNeeds TEXT NULL,      -- Store event-specific needs here

        contactPreference public.attendee_contact_preference NOT NULL,
        delegatedContactId UUID NULL REFERENCES public.Contacts(contactId) ON DELETE SET NULL, -- Who receives comms if not 'Directly'

        relatedAttendeeId UUID NULL REFERENCES public.Attendees(attendeeId) ON DELETE SET NULL, -- Self-ref link Partner -> Mason/Guest
        relationship VARCHAR(50) NULL, -- 'Wife', 'Partner', etc. (Only for partners)

        createdAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updatedAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );
    COMMENT ON TABLE public.Attendees IS 'Represents an individual''s participation in a specific registration/event.';
    ALTER TABLE public.Attendees ENABLE ROW LEVEL SECURITY;
    -- Add index on registrationId for faster lookups
    CREATE INDEX idx_attendees_registration_id ON public.Attendees(registrationId);
    -- Add index on contactId
    CREATE INDEX idx_attendees_contact_id ON public.Attendees(contactId);

    -- Now add the primaryAttendeeId FK to Registrations (can only be done after Attendees exists)
    ALTER TABLE public.Registrations
        ADD COLUMN IF NOT EXISTS primaryAttendeeId UUID NULL REFERENCES public.Attendees(attendeeId) ON DELETE SET NULL;

    -- Add policies later
    ```
3.  Use the Supabase dashboard or CLI to apply this migration, or prepare to call `mcp_supabase_apply_migration` tool with the SQL content and a suitable name (e.g., `create_attendees_table`). 