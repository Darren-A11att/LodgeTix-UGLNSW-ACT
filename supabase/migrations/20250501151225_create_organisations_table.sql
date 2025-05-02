-- Migration: Create Organisations Table
-- Description: Creates the Organisations table to store details about various types of organizations

-- Create organization type enum
CREATE TYPE public.organisation_type AS ENUM (
    'Lodge',
    'GrandLodge',
    'MasonicOrder', -- e.g., Royal Arch, Scottish Rite
    'Company',
    'Other'
);

-- Create the main Organisations table
CREATE TABLE public.Organisations (
    organisationId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type public.organisation_type NOT NULL,
    abbreviation VARCHAR(50) NULL, -- For short forms like "UGLNSW&ACT"
    identifier VARCHAR(100) NULL, -- For unique identifiers like lodge numbers etc.
    displayName VARCHAR(255) NULL, -- Combined form like "Lodge XYZ No. 123"
    -- Address fields
    streetAddress VARCHAR(255) NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    postalCode VARCHAR(20) NULL,
    country VARCHAR(100) NULL,
    -- Contact information
    website VARCHAR(255) NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    -- Lodge-specific fields
    district VARCHAR(100) NULL, -- For Lodges only
    meetingPlace VARCHAR(200) NULL, -- For Lodges only
    areaType VARCHAR(100) NULL, -- For Lodges only
    -- Parent organization relationship
    parentOrganisationId UUID NULL REFERENCES public.Organisations(organisationId) ON DELETE SET NULL,
    -- Timestamps
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add comments 
COMMENT ON TABLE public.Organisations IS 'Stores details about various organizations like Lodges, Grand Lodges, Companies.';
COMMENT ON COLUMN public.Organisations.type IS 'The type of organization - Lodge, GrandLodge, MasonicOrder, Company, or Other.';
COMMENT ON COLUMN public.Organisations.abbreviation IS 'Short form abbreviation for the organization.';
COMMENT ON COLUMN public.Organisations.identifier IS 'Unique identifier like lodge number, company registration etc.';
COMMENT ON COLUMN public.Organisations.displayName IS 'A formatted display name which may combine name and identifier.';
COMMENT ON COLUMN public.Organisations.district IS 'For Lodges only - the district/region they belong to.';
COMMENT ON COLUMN public.Organisations.meetingPlace IS 'For Lodges only - where the lodge typically meets.';
COMMENT ON COLUMN public.Organisations.areaType IS 'For Lodges only - area type classification.';
COMMENT ON COLUMN public.Organisations.parentOrganisationId IS 'Reference to parent organization (e.g., Grand Lodge for a Lodge).';

-- Apply updated_at trigger 
DROP TRIGGER IF EXISTS update_organisations_updated_at ON public.Organisations;
CREATE TRIGGER update_organisations_updated_at
BEFORE UPDATE ON public.Organisations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.Organisations ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_organisations_name ON public.Organisations (name);
CREATE INDEX idx_organisations_type ON public.Organisations (type);
CREATE INDEX idx_organisations_parent ON public.Organisations (parentOrganisationId);

-- Add policies
CREATE POLICY "Organisations are viewable by everyone" 
ON public.Organisations FOR SELECT 
USING (true);

CREATE POLICY "Organisations can be updated by authenticated users" 
ON public.Organisations FOR UPDATE 
USING (auth.role() = 'authenticated' AND (
    -- Allow for owners/authorized users (will be implemented with memberships)
    -- For now, rely on service_role for admin operations
    auth.role() = 'service_role'
));

CREATE POLICY "Organisations can be inserted by authenticated users" 
ON public.Organisations FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Organisations can be deleted by authenticated users" 
ON public.Organisations FOR DELETE 
USING (auth.role() = 'authenticated' AND (
    -- Allow for owners/authorized users (will be implemented with memberships)
    -- For now, rely on service_role for admin operations
    auth.role() = 'service_role'
));