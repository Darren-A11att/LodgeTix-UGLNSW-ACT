-- Create Tickets table migration (20250501153556)
-- Links an Attendee to a specific sub-event/session they are registered for

CREATE TABLE public.Tickets (
    ticketId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendeeId UUID NOT NULL REFERENCES public.Attendees(attendeeId) ON DELETE CASCADE,
    eventId UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE, -- Link to specific child event/session
    ticketDefinitionId UUID NULL REFERENCES public.ticket_definitions(id) ON DELETE SET NULL, -- Optional: Link to the type of ticket bought
    pricePaid NUMERIC(10, 2) NOT NULL, -- Actual price paid for this specific event ticket
    seatInfo VARCHAR(100) NULL,
    status VARCHAR(50) DEFAULT 'Active' NOT NULL, -- e.g., Active, Cancelled
    checkedInAt TIMESTAMP WITH TIME ZONE NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (attendeeId, eventId) -- Prevent double-booking for the same event/session
);

-- Add table comment
COMMENT ON TABLE public.Tickets IS 'Links an Attendee to a specific sub-event/session they are registered for.';

-- Add column comments
COMMENT ON COLUMN public.Tickets.ticketId IS 'Primary key and unique identifier for the ticket.';
COMMENT ON COLUMN public.Tickets.attendeeId IS 'Reference to the attendee this ticket belongs to.';
COMMENT ON COLUMN public.Tickets.eventId IS 'Reference to the specific event/session this ticket is for.';
COMMENT ON COLUMN public.Tickets.ticketDefinitionId IS 'Reference to the ticket definition (type, category, etc.).';
COMMENT ON COLUMN public.Tickets.pricePaid IS 'Actual price paid for this specific event ticket.';
COMMENT ON COLUMN public.Tickets.seatInfo IS 'Information about the assigned seat, if applicable.';
COMMENT ON COLUMN public.Tickets.status IS 'Current status of the ticket (Active, Cancelled, etc.).';
COMMENT ON COLUMN public.Tickets.checkedInAt IS 'Timestamp when the attendee checked in for this event.';
COMMENT ON COLUMN public.Tickets.createdAt IS 'Timestamp when the ticket record was created.';
COMMENT ON COLUMN public.Tickets.updatedAt IS 'Timestamp when the ticket record was last updated.';

-- Create indexes for better performance
CREATE INDEX idx_tickets_attendee_id ON public.Tickets(attendeeId);
CREATE INDEX idx_tickets_event_id ON public.Tickets(eventId);
CREATE INDEX idx_tickets_ticket_definition_id ON public.Tickets(ticketDefinitionId);
CREATE INDEX idx_tickets_status ON public.Tickets(status);

-- Create a trigger for automatically updating the updatedAt timestamp
CREATE TRIGGER set_tickets_updated_at
BEFORE UPDATE ON public.Tickets
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- Enable Row Level Security
ALTER TABLE public.Tickets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view tickets for their attendees"
ON public.Tickets
FOR SELECT
USING (
    attendeeId IN (
        SELECT a.attendeeId 
        FROM public.Attendees a
        JOIN public.registrations r ON a.registrationId = r.registrationId
        JOIN public.Customers c ON r.customerId = c.customerId
        JOIN public.Contacts contact ON c.contactId = contact.contactId
        WHERE contact.authUserId = auth.uid()
    )
);

CREATE POLICY "Users can create tickets for their attendees"
ON public.Tickets
FOR INSERT
WITH CHECK (
    attendeeId IN (
        SELECT a.attendeeId 
        FROM public.Attendees a
        JOIN public.registrations r ON a.registrationId = r.registrationId
        JOIN public.Customers c ON r.customerId = c.customerId
        JOIN public.Contacts contact ON c.contactId = contact.contactId
        WHERE contact.authUserId = auth.uid()
    )
);

CREATE POLICY "Users can update tickets for their attendees"
ON public.Tickets
FOR UPDATE
USING (
    attendeeId IN (
        SELECT a.attendeeId 
        FROM public.Attendees a
        JOIN public.registrations r ON a.registrationId = r.registrationId
        JOIN public.Customers c ON r.customerId = c.customerId
        JOIN public.Contacts contact ON c.contactId = contact.contactId
        WHERE contact.authUserId = auth.uid()
    )
);

CREATE POLICY "Service roles have full access to tickets"
ON public.Tickets
USING (auth.role() = 'service_role');