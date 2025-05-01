-- Update Events table migration (20250501152917)

-- First, make sure we have the events columns configured correctly
-- Add event_start/event_end if they don't exist yet (they might already be added in a migration not shown in our search)
ALTER TABLE public.events 
    ADD COLUMN IF NOT EXISTS event_start TIMESTAMP WITH TIME ZONE, 
    ADD COLUMN IF NOT EXISTS event_end TIMESTAMP WITH TIME ZONE;

-- Set event_start based on date and start_time if it's NULL
UPDATE public.events
SET event_start = (date::text || ' ' || COALESCE(start_time::text, '00:00:00'))::TIMESTAMP WITH TIME ZONE
WHERE event_start IS NULL AND date IS NOT NULL;

-- Set event_end based on end_date (or date) and end_time if it's NULL
UPDATE public.events
SET event_end = (COALESCE(end_date::text, date::text) || ' ' || COALESCE(end_time::text, '23:59:59'))::TIMESTAMP WITH TIME ZONE
WHERE event_end IS NULL AND (end_date IS NOT NULL OR date IS NOT NULL);

-- Remove fields that are calculated or better handled elsewhere
ALTER TABLE public.events
    DROP COLUMN IF EXISTS price, -- Price is handled by Tickets/Stripe Prices
    DROP COLUMN IF EXISTS currentAttendees,
    DROP COLUMN IF EXISTS remainingTickets;

-- Now that data has been migrated, drop the old date/time columns
ALTER TABLE public.events
    DROP COLUMN IF EXISTS date,
    DROP COLUMN IF EXISTS day,
    DROP COLUMN IF EXISTS time,
    DROP COLUMN IF EXISTS end_date,
    DROP COLUMN IF EXISTS start_time,
    DROP COLUMN IF EXISTS end_time;

-- Add locationId column for linking to the new Locations table
ALTER TABLE public.events
    ADD COLUMN IF NOT EXISTS locationId UUID NULL REFERENCES public.Locations(locationId) ON DELETE SET NULL;

-- Add link to the organising entity
ALTER TABLE public.events
    ADD COLUMN IF NOT EXISTS organiserOrganisationId UUID NULL REFERENCES public.Organisations(organisationId) ON DELETE SET NULL;

-- Ensure correct data types
ALTER TABLE public.events
    ALTER COLUMN event_start TYPE TIMESTAMP WITH TIME ZONE,
    ALTER COLUMN event_end TYPE TIMESTAMP WITH TIME ZONE;

-- Update is_multi_day to be computed based on event_start and event_end
UPDATE public.events
SET is_multi_day = (
    EXTRACT(DAY FROM event_end) > EXTRACT(DAY FROM event_start) OR
    EXTRACT(MONTH FROM event_end) > EXTRACT(MONTH FROM event_start) OR
    EXTRACT(YEAR FROM event_end) > EXTRACT(YEAR FROM event_start)
)
WHERE event_start IS NOT NULL AND event_end IS NOT NULL;

-- Create a trigger function to automatically update is_multi_day
CREATE OR REPLACE FUNCTION update_event_is_multi_day()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.event_start IS NOT NULL AND NEW.event_end IS NOT NULL THEN
        NEW.is_multi_day := (
            EXTRACT(DAY FROM NEW.event_end) > EXTRACT(DAY FROM NEW.event_start) OR
            EXTRACT(MONTH FROM NEW.event_end) > EXTRACT(MONTH FROM NEW.event_start) OR
            EXTRACT(YEAR FROM NEW.event_end) > EXTRACT(YEAR FROM NEW.event_start)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS event_multi_day_trigger ON public.events;
CREATE TRIGGER event_multi_day_trigger
BEFORE INSERT OR UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION update_event_is_multi_day();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_event_start ON public.events(event_start);
CREATE INDEX IF NOT EXISTS idx_events_event_end ON public.events(event_end);
CREATE INDEX IF NOT EXISTS idx_events_location_id ON public.events(locationId);
CREATE INDEX IF NOT EXISTS idx_events_organiser_org_id ON public.events(organiserOrganisationId);

-- Update comments
COMMENT ON TABLE public.events IS 'Stores details about parent events and sub-events/sessions.';
COMMENT ON COLUMN public.events.event_start IS 'Start date and time of the event as a timestamp with timezone.';
COMMENT ON COLUMN public.events.event_end IS 'End date and time of the event as a timestamp with timezone.';
COMMENT ON COLUMN public.events.is_multi_day IS 'Flag indicating whether the event spans multiple days. Automatically calculated based on event_start and event_end.';
COMMENT ON COLUMN public.events.locationId IS 'Reference to the location where the event takes place.';
COMMENT ON COLUMN public.events.organiserOrganisationId IS 'Reference to the organisation that is organising this event.';