**Title:** Define Supabase Migration for OrganisationMemberships Table

**Description:** Create the SQL migration script to define the `OrganisationMemberships` link table, connecting `Contacts` to `Organisations`.

**Instructions:**

1.  Create a new SQL migration file (e.g., `supabase/migrations/YYYYMMDDHHMMSS_create_org_memberships.sql`).
2.  Add SQL `CREATE TABLE` statement for `public.OrganisationMemberships`:
    ```sql
    CREATE TABLE public.OrganisationMemberships (
        membershipId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        contactId UUID NOT NULL REFERENCES public.Contacts(contactId) ON DELETE CASCADE,
        organisationId UUID NOT NULL REFERENCES public.Organisations(organisationId) ON DELETE CASCADE,
        roleInOrg VARCHAR(100) NULL, -- e.g., Secretary, Member, Primary Contact
        isPrimaryContact BOOLEAN DEFAULT false, -- Flag if this contact is the main one for the Org
        createdAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updatedAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        UNIQUE (contactId, organisationId) -- Prevent duplicate memberships
    );
    COMMENT ON TABLE public.OrganisationMemberships IS 'Links Contacts to Organisations, defining their role/relationship.';
    ALTER TABLE public.OrganisationMemberships ENABLE ROW LEVEL SECURITY;
    -- Add policies later
    ```
3.  Use the Supabase dashboard or CLI to apply this migration, or prepare to call `mcp_supabase_apply_migration` tool with the SQL content and a suitable name (e.g., `create_org_memberships_table`). 