-- Create Customers table migration (20250501152327)
-- Represents the paying entity (individual Contact or Organisation) for registrations/orders

CREATE TABLE public.Customers (
    customerId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contactId UUID NULL UNIQUE REFERENCES public.Contacts(contactId) ON DELETE SET NULL, -- Link if customer is an individual contact
    organisationId UUID NULL UNIQUE REFERENCES public.Organisations(organisationId) ON DELETE SET NULL, -- Link if customer is an organisation
    -- Billing address fields (can be distinct from Contact/Org address)
    billingFirstName VARCHAR(100) NULL,
    billingLastName VARCHAR(100) NULL,
    billingOrganisationName VARCHAR(255) NULL,
    billingEmail VARCHAR(255) NULL,
    billingPhone VARCHAR(50) NULL,
    billingStreetAddress VARCHAR(255) NULL,
    billingCity VARCHAR(100) NULL,
    billingState VARCHAR(100) NULL,
    billingPostalCode VARCHAR(20) NULL,
    billingCountry VARCHAR(100) NULL,
    -- Stripe Customer ID Link (assuming you have stripe integration)
    stripeCustomerId VARCHAR(255) NULL UNIQUE,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Ensure either contactId or organisationId is set, but not both
    CONSTRAINT check_customer_link CHECK (
        (contactId IS NOT NULL AND organisationId IS NULL) OR
        (contactId IS NULL AND organisationId IS NOT NULL)
    )
);

-- Add table comment
COMMENT ON TABLE public.Customers IS 'Represents the paying entity (individual Contact or Organisation) for registrations/orders.';

-- Add column comments
COMMENT ON COLUMN public.Customers.customerId IS 'Primary key and unique identifier for the customer.';
COMMENT ON COLUMN public.Customers.contactId IS 'Reference to the Contacts table if the customer is an individual.';
COMMENT ON COLUMN public.Customers.organisationId IS 'Reference to the Organisations table if the customer is an organisation.';
COMMENT ON COLUMN public.Customers.billingFirstName IS 'First name for billing purposes (may differ from contact).';
COMMENT ON COLUMN public.Customers.billingLastName IS 'Last name for billing purposes (may differ from contact).';
COMMENT ON COLUMN public.Customers.billingOrganisationName IS 'Organisation name for billing purposes.';
COMMENT ON COLUMN public.Customers.billingEmail IS 'Email address for billing communications.';
COMMENT ON COLUMN public.Customers.billingPhone IS 'Phone number for billing communications.';
COMMENT ON COLUMN public.Customers.billingStreetAddress IS 'Street address for billing purposes.';
COMMENT ON COLUMN public.Customers.billingCity IS 'City for billing purposes.';
COMMENT ON COLUMN public.Customers.billingState IS 'State/province for billing purposes.';
COMMENT ON COLUMN public.Customers.billingPostalCode IS 'Postal/zip code for billing purposes.';
COMMENT ON COLUMN public.Customers.billingCountry IS 'Country for billing purposes.';
COMMENT ON COLUMN public.Customers.stripeCustomerId IS 'Stripe customer ID for payment processing integration.';
COMMENT ON COLUMN public.Customers.createdAt IS 'Timestamp when the customer record was created.';
COMMENT ON COLUMN public.Customers.updatedAt IS 'Timestamp when the customer record was last updated.';

-- Create index on stripeCustomerId for faster lookups
CREATE INDEX idx_customers_stripe_id ON public.Customers(stripeCustomerId);

-- Create indexes for the foreign keys
CREATE INDEX idx_customers_contact_id ON public.Customers(contactId);
CREATE INDEX idx_customers_organisation_id ON public.Customers(organisationId);

-- Create trigger for updating the updatedAt timestamp
CREATE TRIGGER set_customers_updated_at
BEFORE UPDATE ON public.Customers
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

-- Enable Row Level Security
ALTER TABLE public.Customers ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for the authenticated users
CREATE POLICY "Authenticated users can view their own customer records"
ON public.Customers
FOR SELECT
USING (
    contactId IN (
        SELECT contactId FROM public.Contacts WHERE authUserId = auth.uid()
    )
    OR 
    organisationId IN (
        SELECT om.organisationId 
        FROM public.OrganisationMemberships om
        JOIN public.Contacts c ON om.contactId = c.contactId
        WHERE c.authUserId = auth.uid()
    )
);

-- Create RLS policy for authenticated users to create their own customer records
CREATE POLICY "Authenticated users can create customer records linked to their contacts"
ON public.Customers
FOR INSERT
WITH CHECK (
    contactId IN (
        SELECT contactId FROM public.Contacts WHERE authUserId = auth.uid()
    )
);

-- Create RLS policy for authenticated users to update their own customer records
CREATE POLICY "Authenticated users can update their own customer records"
ON public.Customers
FOR UPDATE
USING (
    contactId IN (
        SELECT contactId FROM public.Contacts WHERE authUserId = auth.uid()
    )
    OR 
    organisationId IN (
        SELECT om.organisationId 
        FROM public.OrganisationMemberships om
        JOIN public.Contacts c ON om.contactId = c.contactId
        WHERE c.authUserId = auth.uid()
    )
);

-- Create RLS policy for service roles/admin access
CREATE POLICY "Service roles have full access to customers"
ON public.Customers
USING (auth.role() = 'service_role');