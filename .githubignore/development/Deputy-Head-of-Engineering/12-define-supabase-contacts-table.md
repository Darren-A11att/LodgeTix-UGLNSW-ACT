**Title:** Define Supabase Migration for Contacts Table

**Description:** Create the SQL migration script to define the `Contacts` table in Supabase.

**Instructions:**

1.  Create a new SQL migration file (e.g., `supabase/migrations/YYYYMMDDHHMMSS_create_contacts.sql`).
2.  Add SQL `CREATE TABLE` statement for `public.Contacts`:
    ```sql
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
        createdAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updatedAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );
    -- Add comment
    COMMENT ON TABLE public.Contacts IS 'Stores core contact information for individuals and organisations.';
    -- Enable RLS
    ALTER TABLE public.Contacts ENABLE ROW LEVEL SECURITY;
    -- Add policies as needed later
    ```
3.  Use the Supabase dashboard or CLI to apply this migration, or prepare to call `mcp_supabase_apply_migration` tool with the SQL content and a suitable name (e.g., `create_contacts_table`). 