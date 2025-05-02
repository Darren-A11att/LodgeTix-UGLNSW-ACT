-- Migration: Create Contacts Table
-- Description: Creates the core contacts table to store individual and organization contact information

CREATE TABLE public.Contacts (
    contactId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firstName VARCHAR(100) NOT NULL,
    lastName VARCHAR(100) NOT NULL,
    title VARCHAR(50) NULL,
    suffix VARCHAR(50) NULL,
    primaryPhone VARCHAR(50) NULL,
    primaryEmail VARCHAR(255) NULL, -- Consider adding UNIQUE constraint later if used for login
    streetAddress VARCHAR(255) NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    postalCode VARCHAR(20) NULL,
    country VARCHAR(100) NULL,
    authUserId UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL, -- Link to auth user
    isOrganisation BOOLEAN NOT NULL DEFAULT false, -- Flag for Org vs Individual Contact
    dietaryRequirements TEXT NULL, -- Added to match frontend data structure
    specialNeeds TEXT NULL, -- Added to match frontend data structure
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add comment
COMMENT ON TABLE public.Contacts IS 'Stores core contact information for individuals and organisations.';

-- Add comments on specific columns
COMMENT ON COLUMN public.Contacts.dietaryRequirements IS 'Dietary requirements or restrictions for the contact.';
COMMENT ON COLUMN public.Contacts.specialNeeds IS 'Special needs or accessibility requirements for the contact.';

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to Contacts table
DROP TRIGGER IF EXISTS update_contacts_updated_at ON public.Contacts;
CREATE TRIGGER update_contacts_updated_at
BEFORE UPDATE ON public.Contacts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.Contacts ENABLE ROW LEVEL SECURITY;

-- Create index on primary fields for performance
CREATE INDEX idx_contacts_names ON public.Contacts (lastName, firstName);
CREATE INDEX idx_contacts_email ON public.Contacts (primaryEmail);
CREATE INDEX idx_contacts_auth_user ON public.Contacts (authUserId);

-- Add policies (can be extended later)
CREATE POLICY "Contacts are viewable by everyone" 
ON public.Contacts FOR SELECT 
USING (true);

CREATE POLICY "Contacts can be updated by authenticated users with linked auth accounts" 
ON public.Contacts FOR UPDATE 
USING (auth.role() = 'authenticated' AND (
    -- User can update their own linked contact
    authUserId = auth.uid() OR 
    -- Admin can update all (can be expanded with proper admin check)
    auth.role() = 'service_role'
));

CREATE POLICY "Contacts can be inserted by authenticated users" 
ON public.Contacts FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Contacts can be deleted by authenticated users with linked auth accounts" 
ON public.Contacts FOR DELETE 
USING (auth.role() = 'authenticated' AND (
    -- User can delete their own linked contact
    authUserId = auth.uid() OR 
    -- Admin can delete all (can be expanded with proper admin check)
    auth.role() = 'service_role'
));