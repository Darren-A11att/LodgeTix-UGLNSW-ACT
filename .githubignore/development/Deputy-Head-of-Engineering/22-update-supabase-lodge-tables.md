**Title:** Update Supabase GrandLodge/Lodge Tables

**Description:** Consolidate or update the existing `Lodges` and `GrandLodges` tables, potentially merging them into the `Organisations` table.

**Instructions:**

1.  **Decision:** Strongly recommend **Option A (Merge)** for simplicity and consistency with the new `Organisations` table handling different types.
2.  Create a new SQL migration file (e.g., `supabase/migrations/YYYYMMDDHHMMSS_update_lodge_tables.sql`).
3.  **Implement Merge Strategy:**
    ```sql
    -- Step 1: Add temporary columns to Organisations to hold legacy IDs for mapping
    ALTER TABLE public.Organisations ADD COLUMN IF NOT EXISTS legacyLodgeId UUID;
    ALTER TABLE public.Organisations ADD COLUMN IF NOT EXISTS legacyGrandLodgeId UUID;
    CREATE INDEX IF NOT EXISTS idx_org_legacy_lodge_id ON public.Organisations(legacyLodgeId);
    CREATE INDEX IF NOT EXISTS idx_org_legacy_gl_id ON public.Organisations(legacyGrandLodgeId);

    -- Step 2: Insert Grand Lodges into Organisations
    INSERT INTO public.Organisations (organisationId, name, type, legacyGrandLodgeId, website) -- Add other relevant fields
    SELECT id, name, 'GrandLodge', id, NULL -- Map fields as needed
    FROM public.GrandLodges
    ON CONFLICT (organisationId) DO NOTHING; -- Or UPDATE if merging duplicates needed

    -- Step 3: Insert Lodges into Organisations
    INSERT INTO public.Organisations (organisationId, name, type, legacyLodgeId, streetAddress, city, state, postalCode, country) -- Map fields
    SELECT id, display_name, 'Lodge', id, meeting_place, NULL, NULL, NULL, NULL -- Extract address parts if possible
    FROM public.Lodges
    ON CONFLICT (organisationId) DO NOTHING;

    -- Step 4: Update FK in MasonicProfiles to point to new Organisation records
    -- Make sure MasonicProfiles migration (Task 13) added the lodgeId column
    ALTER TABLE public.MasonicProfiles DROP CONSTRAINT IF EXISTS fk_masonicprofiles_lodge; -- Drop old constraint if exists

    UPDATE public.MasonicProfiles mp
    SET lodgeId = (
        SELECT o.organisationId
        FROM public.Organisations o
        WHERE o.legacyLodgeId = mp.lodgeId -- Assumes mp.lodgeId holds the *old* Lodge UUID
    )
    WHERE EXISTS (
        SELECT 1
        FROM public.Organisations o
        WHERE o.legacyLodgeId = mp.lodgeId
    );

    -- Add the new FK constraint to Organisations table
    ALTER TABLE public.MasonicProfiles
      ADD CONSTRAINT fk_masonicprofiles_organisation
      FOREIGN KEY (lodgeId) REFERENCES public.Organisations(organisationId) ON DELETE SET NULL;

    -- Step 5: Drop old tables (Done in Task 23) and temporary columns
    ALTER TABLE public.Organisations DROP COLUMN IF EXISTS legacyLodgeId;
    ALTER TABLE public.Organisations DROP COLUMN IF EXISTS legacyGrandLodgeId;
    ```
4.  Use the Supabase dashboard or CLI to apply this migration, or prepare to call `mcp_supabase_apply_migration` tool with the SQL content and a suitable name (e.g., `update_lodge_tables`). 