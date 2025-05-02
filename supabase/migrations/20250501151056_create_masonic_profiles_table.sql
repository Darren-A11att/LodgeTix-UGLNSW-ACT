-- Migration: Create MasonicProfiles Table
-- Description: Creates the MasonicProfiles table to store Masonic-specific details linked to a Contact

CREATE TABLE public.MasonicProfiles (
    masonicProfileId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contactId UUID NOT NULL UNIQUE REFERENCES public.Contacts(contactId) ON DELETE CASCADE, -- 1:1 link
    masonicTitle VARCHAR(50) NULL, -- Distinct from contact title if needed (e.g., "Bro", "RW Bro", etc.)
    rank VARCHAR(50) NULL, -- E.g., "EAF", "FC", "MM"
    grandRank VARCHAR(50) NULL, -- If they hold a Grand Rank
    grandOfficer VARCHAR(50) NULL, -- Status: "Past", "Current"
    grandOffice VARCHAR(100) NULL, -- Specific office name
    grandOfficeOther TEXT NULL, -- For "Other" grand office option
    lodgeId UUID NULL, -- FK constraint added after Organisations/Lodges table exists
    grandLodgeId VARCHAR(100) NULL, -- FK constraint added after Organisations table exists
    sameLodgeAsPrimary BOOLEAN DEFAULT false,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add comments
COMMENT ON TABLE public.MasonicProfiles IS 'Stores reusable Masonic details linked to a Contact.';
COMMENT ON COLUMN public.MasonicProfiles.masonicTitle IS 'Masonic title such as "Bro", "W Bro", "RW Bro", etc.';
COMMENT ON COLUMN public.MasonicProfiles.rank IS 'Masonic rank like EAF (Entered Apprentice Freemason), FC (Fellow Craft), MM (Master Mason), etc.';
COMMENT ON COLUMN public.MasonicProfiles.grandRank IS 'Grand Rank, if held by the Mason.';
COMMENT ON COLUMN public.MasonicProfiles.grandOfficer IS 'Whether the Mason is a "Past" or "Current" Grand Officer.';
COMMENT ON COLUMN public.MasonicProfiles.grandOffice IS 'The specific Grand Office held, if applicable.';
COMMENT ON COLUMN public.MasonicProfiles.grandOfficeOther IS 'Description for other Grand Office not in standard list.';
COMMENT ON COLUMN public.MasonicProfiles.lodgeId IS 'Reference to the Lodge the Mason belongs to, will be linked in a later migration.';
COMMENT ON COLUMN public.MasonicProfiles.grandLodgeId IS 'Reference to the Grand Lodge the Mason belongs to, will be linked in a later migration.';
COMMENT ON COLUMN public.MasonicProfiles.sameLodgeAsPrimary IS 'Flag to indicate if this Mason belongs to the same Lodge as the primary Mason in a registration.';

-- Apply updated_at trigger 
DROP TRIGGER IF EXISTS update_masonic_profiles_updated_at ON public.MasonicProfiles;
CREATE TRIGGER update_masonic_profiles_updated_at
BEFORE UPDATE ON public.MasonicProfiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.MasonicProfiles ENABLE ROW LEVEL SECURITY;

-- Create index on foreign key for performance
CREATE INDEX idx_masonic_profiles_contact ON public.MasonicProfiles (contactId);
CREATE INDEX idx_masonic_profiles_lodge ON public.MasonicProfiles (lodgeId);
CREATE INDEX idx_masonic_profiles_grand_lodge ON public.MasonicProfiles (grandLodgeId);

-- Add policies
CREATE POLICY "MasonicProfiles are viewable by everyone" 
ON public.MasonicProfiles FOR SELECT 
USING (true);

CREATE POLICY "MasonicProfiles can be updated by authenticated users with linked contacts" 
ON public.MasonicProfiles FOR UPDATE 
USING (auth.role() = 'authenticated' AND (
    -- User can update their own linked masonic profile via contact
    EXISTS (
        SELECT 1 FROM public.Contacts
        WHERE contactId = MasonicProfiles.contactId
        AND authUserId = auth.uid()
    ) OR 
    -- Admin can update all (can be expanded with proper admin check)
    auth.role() = 'service_role'
));

CREATE POLICY "MasonicProfiles can be inserted by authenticated users" 
ON public.MasonicProfiles FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "MasonicProfiles can be deleted by authenticated users with linked contacts" 
ON public.MasonicProfiles FOR DELETE 
USING (auth.role() = 'authenticated' AND (
    -- User can delete their own linked masonic profile via contact
    EXISTS (
        SELECT 1 FROM public.Contacts
        WHERE contactId = MasonicProfiles.contactId
        AND authUserId = auth.uid()
    ) OR 
    -- Admin can delete all (can be expanded with proper admin check)
    auth.role() = 'service_role'
));