-- Migration: Create OrganisationMemberships Table
-- Description: Creates the OrganisationMemberships link table, connecting Contacts to Organisations

-- Create role type enum for organizational roles
CREATE TYPE public.organisation_role AS ENUM (
    'Member',
    'Secretary',
    'Treasurer',
    'President',
    'Chairman',
    'Director',
    'Administrator',
    'Primary Contact',
    'Other'
);

-- Create the OrganisationMemberships table
CREATE TABLE public.OrganisationMemberships (
    membershipId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contactId UUID NOT NULL REFERENCES public.Contacts(contactId) ON DELETE CASCADE,
    organisationId UUID NOT NULL REFERENCES public.Organisations(organisationId) ON DELETE CASCADE,
    role public.organisation_role DEFAULT 'Member',
    roleDescription VARCHAR(100) NULL, -- For 'Other' role or additional details
    isPrimaryContact BOOLEAN DEFAULT false, -- Flag if this contact is the main one for the Org
    startDate DATE NULL, -- When this membership started
    endDate DATE NULL, -- When this membership ended (if applicable)
    status VARCHAR(50) DEFAULT 'Active', -- Status like 'Active', 'Inactive', 'Suspended'
    notes TEXT NULL, -- Additional notes about the membership
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (contactId, organisationId, role) -- Prevent duplicate memberships with the same role
);

-- Add comments
COMMENT ON TABLE public.OrganisationMemberships IS 'Links Contacts to Organisations, defining their role/relationship.';
COMMENT ON COLUMN public.OrganisationMemberships.role IS 'The role the contact holds in the organization.';
COMMENT ON COLUMN public.OrganisationMemberships.roleDescription IS 'Additional description for the role, especially when role is "Other".';
COMMENT ON COLUMN public.OrganisationMemberships.isPrimaryContact IS 'Indicates if this contact is the primary contact for the organization.';
COMMENT ON COLUMN public.OrganisationMemberships.startDate IS 'When the contact started this role in the organization.';
COMMENT ON COLUMN public.OrganisationMemberships.endDate IS 'When the contact ended this role in the organization (if applicable).';
COMMENT ON COLUMN public.OrganisationMemberships.status IS 'Current status of the membership: Active, Inactive, Suspended, etc.';

-- Apply updated_at trigger 
DROP TRIGGER IF EXISTS update_org_memberships_updated_at ON public.OrganisationMemberships;
CREATE TRIGGER update_org_memberships_updated_at
BEFORE UPDATE ON public.OrganisationMemberships
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.OrganisationMemberships ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_org_memberships_contact ON public.OrganisationMemberships (contactId);
CREATE INDEX idx_org_memberships_organisation ON public.OrganisationMemberships (organisationId);
CREATE INDEX idx_org_memberships_primary ON public.OrganisationMemberships (organisationId, isPrimaryContact);
CREATE INDEX idx_org_memberships_status ON public.OrganisationMemberships (status);

-- Create a function to ensure only one primary contact per organization
CREATE OR REPLACE FUNCTION check_primary_contact_constraint()
RETURNS TRIGGER AS $$
BEGIN
    -- If the new row is trying to set isPrimaryContact to true
    IF NEW.isPrimaryContact = true THEN
        -- Update any existing primary contacts for this organization to false
        UPDATE public.OrganisationMemberships
        SET isPrimaryContact = false
        WHERE organisationId = NEW.organisationId
        AND isPrimaryContact = true
        AND membershipId != NEW.membershipId;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce primary contact constraint
DROP TRIGGER IF EXISTS ensure_single_primary_contact ON public.OrganisationMemberships;
CREATE TRIGGER ensure_single_primary_contact
BEFORE INSERT OR UPDATE ON public.OrganisationMemberships
FOR EACH ROW
EXECUTE FUNCTION check_primary_contact_constraint();

-- Add policies
CREATE POLICY "OrganisationMemberships are viewable by authenticated users" 
ON public.OrganisationMemberships FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "OrganisationMemberships can be updated by contact owner" 
ON public.OrganisationMemberships FOR UPDATE 
USING (auth.role() = 'authenticated' AND (
    -- Contact owner can update
    EXISTS (
        SELECT 1 FROM public.Contacts
        WHERE contactId = OrganisationMemberships.contactId
        AND authUserId = auth.uid()
    ) OR
    -- Organization admin can update (will need to be expanded)
    auth.role() = 'service_role'
));

CREATE POLICY "OrganisationMemberships can be inserted by authenticated users" 
ON public.OrganisationMemberships FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "OrganisationMemberships can be deleted by contact owner" 
ON public.OrganisationMemberships FOR DELETE 
USING (auth.role() = 'authenticated' AND (
    -- Contact owner can delete
    EXISTS (
        SELECT 1 FROM public.Contacts
        WHERE contactId = OrganisationMemberships.contactId
        AND authUserId = auth.uid()
    ) OR
    -- Organization admin can delete (will need to be expanded)
    auth.role() = 'service_role'
));