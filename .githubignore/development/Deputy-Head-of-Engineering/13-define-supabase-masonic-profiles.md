**Title:** Define Supabase Migration for MasonicProfiles Table

**Description:** Create the SQL migration script to define the `MasonicProfiles` table, linking to `Contacts`.

**Instructions:**

1.  Create a new SQL migration file (e.g., `supabase/migrations/YYYYMMDDHHMMSS_create_masonic_profiles.sql`).
2.  Add SQL `CREATE TABLE` statement for `public.MasonicProfiles`:
    ```sql
    CREATE TABLE public.MasonicProfiles (
        masonicProfileId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        contactId UUID NOT NULL UNIQUE REFERENCES public.Contacts(contactId) ON DELETE CASCADE, -- 1:1 link
        masonicTitle VARCHAR(50) NULL, -- Distinct from contact title if needed
        rank VARCHAR(50) NULL,
        grandRank VARCHAR(50) NULL,
        grandOfficer VARCHAR(50) NULL, -- Status: Past, Current
        grandOffice VARCHAR(100) NULL, -- Specific office name
        lodgeId UUID NULL, -- FK constraint added after Organisations/Lodges table exists
        -- Add other Masonic details if needed
        createdAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updatedAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );
    COMMENT ON TABLE public.MasonicProfiles IS 'Stores reusable Masonic details linked to a Contact.';
    ALTER TABLE public.MasonicProfiles ENABLE ROW LEVEL SECURITY;
    -- Add foreign key to Lodges/Organisations in a later migration
    -- ALTER TABLE public.MasonicProfiles ADD CONSTRAINT fk_masonicprofiles_lodge FOREIGN KEY (lodgeId) REFERENCES public.Organisations(organisationId); -- Or public.Lodges(id)
    -- Add policies later
    ```
3.  Use the Supabase dashboard or CLI to apply this migration, or prepare to call `mcp_supabase_apply_migration` tool with the SQL content and a suitable name (e.g., `create_masonic_profiles_table`). 