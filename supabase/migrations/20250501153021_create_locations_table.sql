-- Create Locations table migration (20250501153021)
-- Stores details about physical event locations/venues

CREATE TABLE public.Locations (
    locationId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roomOrArea VARCHAR(255) NULL, -- e.g., Grand Hall, Room 5
    placeName VARCHAR(255) NOT NULL, -- e.g., Sydney Masonic Centre
    streetAddress VARCHAR(255) NULL,
    suburb VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    postalCode VARCHAR(20) NULL,
    country VARCHAR(100) NULL DEFAULT 'Australia',
    latitude NUMERIC(9, 6) NULL,
    longitude NUMERIC(9, 6) NULL,
    capacity INTEGER NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add table comment
COMMENT ON TABLE public.Locations IS 'Stores details about physical event locations/venues.';

-- Add column comments
COMMENT ON COLUMN public.Locations.locationId IS 'Primary key and unique identifier for the location.';
COMMENT ON COLUMN public.Locations.roomOrArea IS 'Specific room, hall, or area within the venue.';
COMMENT ON COLUMN public.Locations.placeName IS 'Name of the venue or place.';
COMMENT ON COLUMN public.Locations.streetAddress IS 'Street address of the location.';
COMMENT ON COLUMN public.Locations.suburb IS 'Suburb or city where the location is situated.';
COMMENT ON COLUMN public.Locations.state IS 'State or province of the location.';
COMMENT ON COLUMN public.Locations.postalCode IS 'Postal or zip code of the location.';
COMMENT ON COLUMN public.Locations.country IS 'Country of the location, defaults to Australia.';
COMMENT ON COLUMN public.Locations.latitude IS 'Geographic latitude coordinate.';
COMMENT ON COLUMN public.Locations.longitude IS 'Geographic longitude coordinate.';
COMMENT ON COLUMN public.Locations.capacity IS 'Maximum capacity of the venue or room.';
COMMENT ON COLUMN public.Locations.createdAt IS 'Timestamp when the location record was created.';
COMMENT ON COLUMN public.Locations.updatedAt IS 'Timestamp when the location record was last updated.';

-- Create a function for automatically updating the updatedAt timestamp
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger for automatically updating the updatedAt timestamp
DROP TRIGGER IF EXISTS set_locations_updated_at ON public.Locations;
CREATE TRIGGER set_locations_updated_at
BEFORE UPDATE ON public.Locations
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- Create indexes for better performance
CREATE INDEX idx_locations_place_name ON public.Locations(placeName);
CREATE INDEX idx_locations_state ON public.Locations(state);
CREATE INDEX idx_locations_country ON public.Locations(country);
CREATE INDEX idx_locations_coordinates ON public.Locations(latitude, longitude);

-- Enable Row Level Security
ALTER TABLE public.Locations ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for selecting locations (accessible to all authenticated users)
CREATE POLICY "All users can view locations"
ON public.Locations
FOR SELECT
USING (true);

-- Create RLS policy for inserting locations (restricted to authenticated users with service_role)
CREATE POLICY "Only service role can add locations"
ON public.Locations
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Create RLS policy for updating locations (restricted to authenticated users with service_role)
CREATE POLICY "Only service role can update locations"
ON public.Locations
FOR UPDATE
USING (auth.role() = 'service_role');

-- Create RLS policy for deleting locations (restricted to authenticated users with service_role)
CREATE POLICY "Only service role can delete locations"
ON public.Locations
FOR DELETE
USING (auth.role() = 'service_role');