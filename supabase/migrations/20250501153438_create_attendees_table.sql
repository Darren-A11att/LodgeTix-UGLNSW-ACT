-- Create Attendees table migration (20250501153438)
-- Represents an individual's participation in a specific registration/event

-- Create attendee type enum
CREATE TYPE public.attendee_type AS ENUM (
    'Mason',
    'Guest',
    'LadyPartner',
    'GuestPartner'
);

-- Create attendee contact preference enum
CREATE TYPE public.attendee_contact_preference AS ENUM (
    'Directly',
    'PrimaryAttendee',
    'Mason', -- Refers to the related Mason attendee
    'Guest', -- Refers to the related Guest attendee
    'ProvideLater'
);

-- Create Attendees table
CREATE TABLE public.Attendees (
    attendeeId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registrationId UUID NOT NULL REFERENCES public.registrations(registrationId) ON DELETE CASCADE, -- Link to registration
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

-- Add table comment
COMMENT ON TABLE public.Attendees IS 'Represents an individual''s participation in a specific registration/event.';

-- Add column comments
COMMENT ON COLUMN public.Attendees.attendeeId IS 'Primary key and unique identifier for the attendee.';
COMMENT ON COLUMN public.Attendees.registrationId IS 'Reference to the registration this attendee belongs to.';
COMMENT ON COLUMN public.Attendees.contactId IS 'Reference to the contact person for this attendee.';
COMMENT ON COLUMN public.Attendees.attendeeType IS 'Type of attendee (Mason, Guest, LadyPartner, GuestPartner).';
COMMENT ON COLUMN public.Attendees.eventTitle IS 'Event-specific title that may override the contact title.';
COMMENT ON COLUMN public.Attendees.dietaryRequirements IS 'Event-specific dietary requirements for this attendee.';
COMMENT ON COLUMN public.Attendees.specialNeeds IS 'Event-specific special needs for this attendee.';
COMMENT ON COLUMN public.Attendees.contactPreference IS 'How this attendee should be contacted about the event.';
COMMENT ON COLUMN public.Attendees.delegatedContactId IS 'Contact to receive communications if not contacting directly.';
COMMENT ON COLUMN public.Attendees.relatedAttendeeId IS 'Reference to the related attendee (for partners).';
COMMENT ON COLUMN public.Attendees.relationship IS 'Relationship to the related attendee (e.g., Wife, Partner, etc.).';
COMMENT ON COLUMN public.Attendees.createdAt IS 'Timestamp when the attendee record was created.';
COMMENT ON COLUMN public.Attendees.updatedAt IS 'Timestamp when the attendee record was last updated.';

-- Add indexes for better performance
CREATE INDEX idx_attendees_registration_id ON public.Attendees(registrationId);
CREATE INDEX idx_attendees_contact_id ON public.Attendees(contactId);
CREATE INDEX idx_attendees_attendee_type ON public.Attendees(attendeeType);
CREATE INDEX idx_attendees_related_attendee_id ON public.Attendees(relatedAttendeeId);
CREATE INDEX idx_attendees_delegated_contact_id ON public.Attendees(delegatedContactId);

-- Create a trigger for automatically updating the updatedAt timestamp
CREATE TRIGGER set_attendees_updated_at
BEFORE UPDATE ON public.Attendees
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- Now add the primaryAttendeeId FK to Registrations (can only be done after Attendees exists)
ALTER TABLE public.registrations
    ADD COLUMN IF NOT EXISTS primaryAttendeeId UUID NULL REFERENCES public.Attendees(attendeeId) ON DELETE SET NULL;

-- Add constraint to ensure one primary attendee per registration
ALTER TABLE public.Attendees
    ADD COLUMN isPrimaryAttendee BOOLEAN NOT NULL DEFAULT false;

-- Add unique constraint to ensure only one primary attendee per registration
CREATE UNIQUE INDEX idx_primary_attendee_per_registration 
ON public.Attendees(registrationId) 
WHERE isPrimaryAttendee = true;

-- Create function to ensure only one primary attendee per registration
CREATE OR REPLACE FUNCTION ensure_one_primary_attendee()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is set as a primary attendee
    IF NEW.isPrimaryAttendee = true THEN
        -- Update the registration to point to this attendee
        UPDATE public.registrations
        SET primaryAttendeeId = NEW.attendeeId
        WHERE registrationId = NEW.registrationId;
        
        -- Ensure no other attendees for this registration are primary
        UPDATE public.Attendees
        SET isPrimaryAttendee = false
        WHERE registrationId = NEW.registrationId
        AND attendeeId != NEW.attendeeId
        AND isPrimaryAttendee = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to ensure one primary attendee per registration
CREATE TRIGGER ensure_one_primary_attendee_trigger
AFTER INSERT OR UPDATE OF isPrimaryAttendee ON public.Attendees
FOR EACH ROW
WHEN (NEW.isPrimaryAttendee = true)
EXECUTE FUNCTION ensure_one_primary_attendee();

-- Enable Row Level Security
ALTER TABLE public.Attendees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view attendees for their registrations"
ON public.Attendees
FOR SELECT
USING (
    registrationId IN (
        SELECT r.registrationId 
        FROM public.registrations r
        JOIN public.Customers c ON r.customerId = c.customerId
        JOIN public.Contacts contact ON c.contactId = contact.contactId
        WHERE contact.authUserId = auth.uid()
    )
    OR
    contactId IN (
        SELECT contactId FROM public.Contacts 
        WHERE authUserId = auth.uid()
    )
);

CREATE POLICY "Users can create attendees for their registrations"
ON public.Attendees
FOR INSERT
WITH CHECK (
    registrationId IN (
        SELECT r.registrationId 
        FROM public.registrations r
        JOIN public.Customers c ON r.customerId = c.customerId
        JOIN public.Contacts contact ON c.contactId = contact.contactId
        WHERE contact.authUserId = auth.uid()
    )
);

CREATE POLICY "Users can update attendees for their registrations"
ON public.Attendees
FOR UPDATE
USING (
    registrationId IN (
        SELECT r.registrationId 
        FROM public.registrations r
        JOIN public.Customers c ON r.customerId = c.customerId
        JOIN public.Contacts contact ON c.contactId = contact.contactId
        WHERE contact.authUserId = auth.uid()
    )
);

CREATE POLICY "Service roles have full access to attendees"
ON public.Attendees
USING (auth.role() = 'service_role');