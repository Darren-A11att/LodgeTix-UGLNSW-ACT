-- Update Registrations table migration (20250501153402)
-- This updates the Registrations table to work with the new schema structure

-- Rename primary key for consistency
ALTER TABLE public.registrations RENAME COLUMN id TO registrationId;

-- Update foreign key to parent_event_id to use UUID type
ALTER TABLE public.registrations
    ALTER COLUMN parent_event_id TYPE UUID USING parent_event_id::UUID;

-- Add customer relationship
ALTER TABLE public.registrations
    ADD COLUMN IF NOT EXISTS customerId UUID NOT NULL REFERENCES public.Customers(customerId) ON DELETE RESTRICT;

-- Remove billing fields now that they're in the Customers table
ALTER TABLE public.registrations
    DROP COLUMN IF EXISTS billing_first_name,
    DROP COLUMN IF EXISTS billing_last_name,
    DROP COLUMN IF EXISTS billing_business_name,
    DROP COLUMN IF EXISTS billing_email,
    DROP COLUMN IF EXISTS billing_phone,
    DROP COLUMN IF EXISTS billing_address_line1,
    DROP COLUMN IF EXISTS billing_address_line2,
    DROP COLUMN IF EXISTS billing_city,
    DROP COLUMN IF EXISTS billing_state,
    DROP COLUMN IF EXISTS billing_postal_code,
    DROP COLUMN IF EXISTS billing_country;

-- Remove user_id since auth linking is now handled in Contacts table
ALTER TABLE public.registrations
    DROP COLUMN IF EXISTS user_id;

-- Add updated_at column
ALTER TABLE public.registrations
    ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Add comments
COMMENT ON TABLE public.registrations IS 'Stores registrations for events, connecting customers to events.';
COMMENT ON COLUMN public.registrations.registrationId IS 'Primary key and unique identifier for the registration.';
COMMENT ON COLUMN public.registrations.parent_event_id IS 'Reference to the parent event this registration is for.';
COMMENT ON COLUMN public.registrations.customerId IS 'Reference to the customer making this registration.';
COMMENT ON COLUMN public.registrations.registration_type IS 'Type of registration (e.g., Individual, Group, etc.).';
COMMENT ON COLUMN public.registrations.total_price_paid IS 'Total amount paid for this registration.';
COMMENT ON COLUMN public.registrations.payment_status IS 'Current payment status (e.g., pending, paid, etc.).';
COMMENT ON COLUMN public.registrations.stripe_payment_intent_id IS 'Stripe payment intent ID for this registration.';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_registrations_customer_id ON public.registrations(customerId);
CREATE INDEX IF NOT EXISTS idx_registrations_payment_status ON public.registrations(payment_status);

-- Create a trigger for automatically updating the updatedAt timestamp
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_registrations_updated_at ON public.registrations;
CREATE TRIGGER set_registrations_updated_at
BEFORE UPDATE ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- Enable Row Level Security
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own registrations"
ON public.registrations
FOR SELECT
USING (
    customerId IN (
        SELECT c.customerId 
        FROM public.Customers c
        JOIN public.Contacts contact ON c.contactId = contact.contactId
        WHERE contact.authUserId = auth.uid()
    )
);

CREATE POLICY "Users can create registrations linked to their customer account"
ON public.registrations
FOR INSERT
WITH CHECK (
    customerId IN (
        SELECT c.customerId 
        FROM public.Customers c
        JOIN public.Contacts contact ON c.contactId = contact.contactId
        WHERE contact.authUserId = auth.uid()
    )
);

CREATE POLICY "Users can update their own registrations"
ON public.registrations
FOR UPDATE
USING (
    customerId IN (
        SELECT c.customerId 
        FROM public.Customers c
        JOIN public.Contacts contact ON c.contactId = contact.contactId
        WHERE contact.authUserId = auth.uid()
    )
);

CREATE POLICY "Service roles have full access to registrations"
ON public.registrations
USING (auth.role() = 'service_role');