-- Migration: Improve RLS Policies for Security
-- Description: Strengthens Row Level Security policies across critical tables

-- Verify if the user has admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user has admin role in auth.users or a related admin table
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_app_meta_data->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify if the user owns a contact
CREATE OR REPLACE FUNCTION public.owns_contact(contact_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.Contacts
    WHERE contactId = contact_id
    AND authUserId = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify if the user is associated with a registration
CREATE OR REPLACE FUNCTION public.is_associated_with_registration(registration_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.registrations r
    JOIN public.Customers c ON r.customerId = c.customerId
    JOIN public.Contacts contact ON c.contactId = contact.contactId
    WHERE r.registrationId = registration_id
    AND contact.authUserId = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify if the user is associated with an attendee
CREATE OR REPLACE FUNCTION public.is_associated_with_attendee(attendee_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.Attendees a
    JOIN public.registrations r ON a.registrationId = r.registrationId
    JOIN public.Customers c ON r.customerId = c.customerId
    JOIN public.Contacts contact ON c.contactId = contact.contactId
    WHERE a.attendeeId = attendee_id
    AND contact.authUserId = auth.uid()
  )
  OR EXISTS (
    -- The attendee might be the user's own contact
    SELECT 1 FROM public.Attendees a
    JOIN public.Contacts c ON a.contactId = c.contactId
    WHERE a.attendeeId = attendee_id
    AND c.authUserId = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

----------------------
-- CONTACTS TABLE
----------------------

-- Drop existing policies
DROP POLICY IF EXISTS "Contacts are viewable by everyone" ON public.Contacts;
DROP POLICY IF EXISTS "Contacts can be updated by authenticated users with linked auth accounts" ON public.Contacts;
DROP POLICY IF EXISTS "Contacts can be inserted by authenticated users" ON public.Contacts;
DROP POLICY IF EXISTS "Contacts can be deleted by authenticated users with linked auth accounts" ON public.Contacts;

-- Create more restrictive policies
-- Users can view only their own contacts and those associated with their registrations
CREATE POLICY "Users can view their own contacts"
ON public.Contacts
FOR SELECT
USING (
  -- User's own contact
  authUserId = auth.uid() 
  OR 
  -- Contacts in registrations the user has made
  contactId IN (
    SELECT a.contactId
    FROM public.Attendees a
    JOIN public.registrations r ON a.registrationId = r.registrationId
    JOIN public.Customers c ON r.customerId = c.customerId
    JOIN public.Contacts contact ON c.contactId = contact.contactId
    WHERE contact.authUserId = auth.uid()
  )
  OR
  -- Allow admins to view all contacts
  is_admin()
);

-- Users can update only their own contacts
CREATE POLICY "Users can update their own contacts"
ON public.Contacts
FOR UPDATE
USING (
  authUserId = auth.uid()
  OR 
  is_admin()
);

-- Users can insert contacts if they're authenticated
CREATE POLICY "Authenticated users can insert contacts"
ON public.Contacts
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
);

-- Users can only delete their own contacts
CREATE POLICY "Users can delete their own contacts"
ON public.Contacts
FOR DELETE
USING (
  authUserId = auth.uid()
  OR
  is_admin()
);

-- Admin-specific policy for full access
CREATE POLICY "Admins have full access to contacts"
ON public.Contacts
USING (
  is_admin()
);

----------------------
-- CUSTOMERS TABLE
----------------------

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view their own customer records" ON public.Customers;
DROP POLICY IF EXISTS "Authenticated users can create customer records linked to their contacts" ON public.Customers;
DROP POLICY IF EXISTS "Authenticated users can update their own customer records" ON public.Customers;
DROP POLICY IF EXISTS "Service roles have full access to customers" ON public.Customers;

-- Create improved policies
CREATE POLICY "Users can view their own customer records"
ON public.Customers
FOR SELECT
USING (
  -- The customer is linked to the user's contact
  EXISTS (
    SELECT 1 FROM public.Contacts
    WHERE Contacts.contactId = Customers.contactId
    AND Contacts.authUserId = auth.uid()
  )
  OR
  -- The customer is linked to an organization the user is a member of
  EXISTS (
    SELECT 1 FROM public.OrganisationMemberships om
    JOIN public.Contacts c ON om.contactId = c.contactId
    WHERE om.organisationId = Customers.organisationId
    AND c.authUserId = auth.uid()
  )
  OR
  -- Admin access
  is_admin()
);

CREATE POLICY "Users can create customer records linked to their contacts"
ON public.Customers
FOR INSERT
WITH CHECK (
  -- The customer is being linked to the user's contact
  (contactId IS NOT NULL AND
   EXISTS (
     SELECT 1 FROM public.Contacts
     WHERE Contacts.contactId = contactId
     AND Contacts.authUserId = auth.uid()
   ))
  OR
  -- Admin access
  is_admin()
);

CREATE POLICY "Users can update their own customer records"
ON public.Customers
FOR UPDATE
USING (
  -- The customer is linked to the user's contact
  EXISTS (
    SELECT 1 FROM public.Contacts
    WHERE Contacts.contactId = Customers.contactId
    AND Contacts.authUserId = auth.uid()
  )
  OR
  -- The customer is linked to an organization the user is a member of and has update rights
  EXISTS (
    SELECT 1 FROM public.OrganisationMemberships om
    JOIN public.Contacts c ON om.contactId = c.contactId
    WHERE om.organisationId = Customers.organisationId
    AND c.authUserId = auth.uid()
    AND om.role IN ('admin', 'manager') -- Only certain roles can update
  )
  OR
  -- Admin access
  is_admin()
);

CREATE POLICY "Users can delete their own customer records"
ON public.Customers
FOR DELETE
USING (
  -- The customer is linked to the user's contact
  EXISTS (
    SELECT 1 FROM public.Contacts
    WHERE Contacts.contactId = Customers.contactId
    AND Contacts.authUserId = auth.uid()
  )
  OR
  -- Admin access
  is_admin()
);

-- Admin-specific policy
CREATE POLICY "Admins have full access to customers"
ON public.Customers
USING (
  is_admin()
);

----------------------
-- REGISTRATIONS TABLE
----------------------

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own registrations" ON public.registrations;
DROP POLICY IF EXISTS "Users can create registrations linked to their customer account" ON public.registrations;
DROP POLICY IF EXISTS "Users can update their own registrations" ON public.registrations;
DROP POLICY IF EXISTS "Service roles have full access to registrations" ON public.registrations;

-- Create improved policies
CREATE POLICY "Users can view their own registrations"
ON public.registrations
FOR SELECT
USING (
  -- Registration is linked to the user's customer record
  EXISTS (
    SELECT 1 FROM public.Customers c
    JOIN public.Contacts contact ON c.contactId = contact.contactId
    WHERE c.customerId = registrations.customerId
    AND contact.authUserId = auth.uid()
  )
  OR
  -- User is an attendee in this registration
  EXISTS (
    SELECT 1 FROM public.Attendees a
    JOIN public.Contacts c ON a.contactId = c.contactId
    WHERE a.registrationId = registrations.registrationId
    AND c.authUserId = auth.uid()
  )
  OR
  -- Admin access
  is_admin()
);

CREATE POLICY "Users can create registrations linked to their customer account"
ON public.registrations
FOR INSERT
WITH CHECK (
  -- Creating a registration linked to the user's customer record
  EXISTS (
    SELECT 1 FROM public.Customers c
    JOIN public.Contacts contact ON c.contactId = contact.contactId
    WHERE c.customerId = registrations.customerId
    AND contact.authUserId = auth.uid()
  )
  OR
  -- Admin access
  is_admin()
);

CREATE POLICY "Users can update their own registrations"
ON public.registrations
FOR UPDATE
USING (
  -- Updating a registration linked to the user's customer record
  EXISTS (
    SELECT 1 FROM public.Customers c
    JOIN public.Contacts contact ON c.contactId = contact.contactId
    WHERE c.customerId = registrations.customerId
    AND contact.authUserId = auth.uid()
  )
  OR
  -- Admin access
  is_admin()
);

CREATE POLICY "Users can delete their own registrations"
ON public.registrations
FOR DELETE
USING (
  -- Deleting a registration linked to the user's customer record
  EXISTS (
    SELECT 1 FROM public.Customers c
    JOIN public.Contacts contact ON c.contactId = contact.contactId
    WHERE c.customerId = registrations.customerId
    AND contact.authUserId = auth.uid()
  )
  -- Only admins can delete registrations
  AND is_admin()
);

-- Admin-specific policy
CREATE POLICY "Admins have full access to registrations"
ON public.registrations
USING (
  is_admin()
);

----------------------
-- ATTENDEES TABLE
----------------------

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view attendees for their registrations" ON public.Attendees;
DROP POLICY IF EXISTS "Users can create attendees for their registrations" ON public.Attendees;
DROP POLICY IF EXISTS "Users can update attendees for their registrations" ON public.Attendees;
DROP POLICY IF EXISTS "Service roles have full access to attendees" ON public.Attendees;

-- Create improved policies
CREATE POLICY "Users can view attendees for their registrations"
ON public.Attendees
FOR SELECT
USING (
  -- Attendee is part of a registration made by the user
  EXISTS (
    SELECT 1 FROM public.registrations r
    JOIN public.Customers c ON r.customerId = c.customerId
    JOIN public.Contacts contact ON c.contactId = contact.contactId
    WHERE r.registrationId = Attendees.registrationId
    AND contact.authUserId = auth.uid()
  )
  OR
  -- Attendee is the user's contact
  EXISTS (
    SELECT 1 FROM public.Contacts
    WHERE Contacts.contactId = Attendees.contactId
    AND Contacts.authUserId = auth.uid()
  )
  OR
  -- Admin access
  is_admin()
);

CREATE POLICY "Users can create attendees for their registrations"
ON public.Attendees
FOR INSERT
WITH CHECK (
  -- Creating an attendee for a registration made by the user
  EXISTS (
    SELECT 1 FROM public.registrations r
    JOIN public.Customers c ON r.customerId = c.customerId
    JOIN public.Contacts contact ON c.contactId = contact.contactId
    WHERE r.registrationId = Attendees.registrationId
    AND contact.authUserId = auth.uid()
  )
  OR
  -- Admin access
  is_admin()
);

CREATE POLICY "Users can update attendees for their registrations"
ON public.Attendees
FOR UPDATE
USING (
  -- Updating an attendee for a registration made by the user
  EXISTS (
    SELECT 1 FROM public.registrations r
    JOIN public.Customers c ON r.customerId = c.customerId
    JOIN public.Contacts contact ON c.contactId = contact.contactId
    WHERE r.registrationId = Attendees.registrationId
    AND contact.authUserId = auth.uid()
  )
  OR
  -- Updating their own attendee record
  EXISTS (
    SELECT 1 FROM public.Contacts
    WHERE Contacts.contactId = Attendees.contactId
    AND Contacts.authUserId = auth.uid()
  )
  OR
  -- Admin access
  is_admin()
);

CREATE POLICY "Users can delete attendees for their registrations"
ON public.Attendees
FOR DELETE
USING (
  -- Deleting an attendee for a registration made by the user
  EXISTS (
    SELECT 1 FROM public.registrations r
    JOIN public.Customers c ON r.customerId = c.customerId
    JOIN public.Contacts contact ON c.contactId = contact.contactId
    WHERE r.registrationId = Attendees.registrationId
    AND contact.authUserId = auth.uid()
  )
  OR
  -- Admin access
  is_admin()
);

-- Admin-specific policy
CREATE POLICY "Admins have full access to attendees"
ON public.Attendees
USING (
  is_admin()
);

----------------------
-- TICKETS TABLE
----------------------

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view tickets for their attendees" ON public.Tickets;
DROP POLICY IF EXISTS "Users can create tickets for their attendees" ON public.Tickets;
DROP POLICY IF EXISTS "Users can update tickets for their attendees" ON public.Tickets;
DROP POLICY IF EXISTS "Service roles have full access to tickets" ON public.Tickets;

-- Create improved policies
CREATE POLICY "Users can view tickets for their attendees"
ON public.Tickets
FOR SELECT
USING (
  -- Viewing tickets for attendees in registrations made by the user
  EXISTS (
    SELECT 1 FROM public.Attendees a
    JOIN public.registrations r ON a.registrationId = r.registrationId
    JOIN public.Customers c ON r.customerId = c.customerId
    JOIN public.Contacts contact ON c.contactId = contact.contactId
    WHERE a.attendeeId = Tickets.attendeeId
    AND contact.authUserId = auth.uid()
  )
  OR
  -- Viewing tickets for the user's own attendee record
  EXISTS (
    SELECT 1 FROM public.Attendees a
    JOIN public.Contacts c ON a.contactId = c.contactId
    WHERE a.attendeeId = Tickets.attendeeId
    AND c.authUserId = auth.uid()
  )
  OR
  -- Admin access
  is_admin()
);

CREATE POLICY "Users can create tickets for their attendees"
ON public.Tickets
FOR INSERT
WITH CHECK (
  -- Creating tickets for attendees in registrations made by the user
  EXISTS (
    SELECT 1 FROM public.Attendees a
    JOIN public.registrations r ON a.registrationId = r.registrationId
    JOIN public.Customers c ON r.customerId = c.customerId
    JOIN public.Contacts contact ON c.contactId = contact.contactId
    WHERE a.attendeeId = Tickets.attendeeId
    AND contact.authUserId = auth.uid()
  )
  OR
  -- Admin access
  is_admin()
);

CREATE POLICY "Users can update tickets for their attendees"
ON public.Tickets
FOR UPDATE
USING (
  -- Updating tickets for attendees in registrations made by the user
  EXISTS (
    SELECT 1 FROM public.Attendees a
    JOIN public.registrations r ON a.registrationId = r.registrationId
    JOIN public.Customers c ON r.customerId = c.customerId
    JOIN public.Contacts contact ON c.contactId = contact.contactId
    WHERE a.attendeeId = Tickets.attendeeId
    AND contact.authUserId = auth.uid()
  )
  OR
  -- Admin access
  is_admin()
);

CREATE POLICY "Users can delete tickets for their attendees"
ON public.Tickets
FOR DELETE
USING (
  -- Only admins can delete tickets
  is_admin()
);

-- Admin-specific policy
CREATE POLICY "Admins have full access to tickets"
ON public.Tickets
USING (
  is_admin()
);

----------------------
-- MASONIC PROFILES TABLE
----------------------

-- Create policies for MasonicProfiles
CREATE POLICY "Users can view their own masonic profiles"
ON public.MasonicProfiles
FOR SELECT
USING (
  -- User's own masonic profile
  EXISTS (
    SELECT 1 FROM public.Contacts
    WHERE Contacts.contactId = MasonicProfiles.contactId
    AND Contacts.authUserId = auth.uid()
  )
  OR
  -- Profiles of attendees in the user's registrations
  EXISTS (
    SELECT 1 FROM public.Attendees a
    JOIN public.registrations r ON a.registrationId = r.registrationId
    JOIN public.Customers c ON r.customerId = c.customerId
    JOIN public.Contacts contact ON c.contactId = contact.contactId
    WHERE a.contactId = MasonicProfiles.contactId
    AND contact.authUserId = auth.uid()
  )
  OR
  -- Admin access
  is_admin()
);

CREATE POLICY "Users can update their own masonic profiles"
ON public.MasonicProfiles
FOR UPDATE
USING (
  -- Updating the user's own masonic profile
  EXISTS (
    SELECT 1 FROM public.Contacts
    WHERE Contacts.contactId = MasonicProfiles.contactId
    AND Contacts.authUserId = auth.uid()
  )
  OR
  -- Admin access
  is_admin()
);

CREATE POLICY "Users can create their own masonic profiles"
ON public.MasonicProfiles
FOR INSERT
WITH CHECK (
  -- Creating a profile for the user's own contact
  EXISTS (
    SELECT 1 FROM public.Contacts
    WHERE Contacts.contactId = MasonicProfiles.contactId
    AND Contacts.authUserId = auth.uid()
  )
  OR
  -- Creating profiles for attendees in the user's registrations
  EXISTS (
    SELECT 1 FROM public.Attendees a
    JOIN public.registrations r ON a.registrationId = r.registrationId
    JOIN public.Customers c ON r.customerId = c.customerId
    JOIN public.Contacts contact ON c.contactId = contact.contactId
    WHERE a.contactId = MasonicProfiles.contactId
    AND contact.authUserId = auth.uid()
  )
  OR
  -- Admin access
  is_admin()
);

CREATE POLICY "Users can delete their own masonic profiles"
ON public.MasonicProfiles
FOR DELETE
USING (
  -- Deleting the user's own masonic profile
  EXISTS (
    SELECT 1 FROM public.Contacts
    WHERE Contacts.contactId = MasonicProfiles.contactId
    AND Contacts.authUserId = auth.uid()
  )
  OR
  -- Admin access
  is_admin()
);

-- Admin-specific policy
CREATE POLICY "Admins have full access to masonic profiles"
ON public.MasonicProfiles
USING (
  is_admin()
);

----------------------
-- ADD ADMIN ROLE TO AUTH SCHEMA
----------------------

-- Create a trigger function to set admin role in user metadata when new admin is created
CREATE OR REPLACE FUNCTION auth.set_admin_role_on_create()
RETURNS TRIGGER AS $$
BEGIN
  -- If the new user is meant to be an admin, set the role in app_metadata
  IF NEW.raw_app_meta_data ? 'is_admin' AND NEW.raw_app_meta_data->>'is_admin' = 'true' THEN
    -- Set the admin role in the raw_app_meta_data jsonb
    NEW.raw_app_meta_data = jsonb_set(
      COALESCE(NEW.raw_app_meta_data, '{}'::jsonb),
      '{role}',
      '"admin"'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table (this may require elevated privileges)
DROP TRIGGER IF EXISTS set_admin_role_on_create_trigger ON auth.users;
CREATE TRIGGER set_admin_role_on_create_trigger
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION auth.set_admin_role_on_create();

-- Function to promote an existing user to admin
CREATE OR REPLACE FUNCTION auth.promote_to_admin(user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Requires admin privileges to run
  UPDATE auth.users
  SET raw_app_meta_data = jsonb_set(
    COALESCE(raw_app_meta_data, '{}'::jsonb),
    '{role}',
    '"admin"'
  )
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION auth.promote_to_admin TO service_role;