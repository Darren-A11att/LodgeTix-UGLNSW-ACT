**Title:** Define Supabase Migration for Customers Table

**Description:** Create the SQL migration script to define the `Customers` table, linking to `Contacts` or `Organisations` representing the paying entity.

**Instructions:**

1.  Create a new SQL migration file (e.g., `supabase/migrations/YYYYMMDDHHMMSS_create_customers.sql`).
2.  Add SQL `CREATE TABLE` statement for `public.Customers`:
    ```sql
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
    COMMENT ON TABLE public.Customers IS 'Represents the paying entity (individual Contact or Organisation) for registrations/orders.';
    ALTER TABLE public.Customers ENABLE ROW LEVEL SECURITY;
    -- Add policies later
    ```
3.  Note: The old `public.customers` table (from schema dump) will be dropped later in Task 23.
4.  Use the Supabase dashboard or CLI to apply this migration, or prepare to call `mcp_supabase_apply_migration` tool with the SQL content and a suitable name (e.g., `create_customers_table`). 