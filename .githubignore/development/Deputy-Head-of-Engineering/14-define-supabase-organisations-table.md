**Title:** Define Supabase Migration for Organisations Table

**Description:** Create the SQL migration script to define the `Organisations` table in Supabase, which will store details about entities like Lodges, Grand Lodges, Companies, etc.

**Instructions:**

1.  Create a new SQL migration file (e.g., `supabase/migrations/YYYYMMDDHHMMSS_create_organisations.sql`).
2.  Add SQL `CREATE TABLE` statement for `public.Organisations`:
    ```sql
    CREATE TYPE public.organisation_type AS ENUM (
        'Lodge',
        'GrandLodge',
        'MasonicOrder', -- e.g., Royal Arch, Scottish Rite
        'Company',
        'Other'
    );

    CREATE TABLE public.Organisations (
        organisationId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        type public.organisation_type NOT NULL,
        -- Add address fields if organisations have distinct addresses from contacts
        streetAddress VARCHAR(255) NULL,
        city VARCHAR(100) NULL,
        state VARCHAR(100) NULL,
        postalCode VARCHAR(20) NULL,
        country VARCHAR(100) NULL,
        website VARCHAR(255) NULL,
        -- primaryContactId UUID NULL REFERENCES public.Contacts(contactId) ON DELETE SET NULL, -- Add FK in Membership table instead
        createdAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updatedAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );
    COMMENT ON TABLE public.Organisations IS 'Stores details about various organisations like Lodges, Grand Lodges, Companies.';
    ALTER TABLE public.Organisations ENABLE ROW LEVEL SECURITY;
    -- Add policies later
    ```
3.  Use the Supabase dashboard or CLI to apply this migration, or prepare to call `mcp_supabase_apply_migration` tool with the SQL content and a suitable name (e.g., `create_organisations_table`). 