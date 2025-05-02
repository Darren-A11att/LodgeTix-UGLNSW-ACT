**Title:** Define Supabase Migration for Locations Table

**Description:** Create the SQL migration script to define the `Locations` table for storing event venue details.

**Instructions:**

1.  Create a new SQL migration file (e.g., `supabase/migrations/YYYYMMDDHHMMSS_create_locations.sql`).
2.  Add SQL `CREATE TABLE` statement for `public.Locations`:
    ```sql
    CREATE TABLE public.Locations (
        locationId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        roomOrArea VARCHAR(255) NULL, -- e.g., Grand Hall, Room 5
        placeName VARCHAR(255) NOT NULL, -- e.g., Sydney Masonic Centre
        streetAddress VARCHAR(255) NULL,
        suburb VARCHAR(100) NULL,
        state VARCHAR(100) NULL,
        postalCode VARCHAR(20) NULL,
        country VARCHAR(100) NULL,
        latitude NUMERIC(9, 6) NULL,
        longitude NUMERIC(9, 6) NULL,
        capacity INTEGER NULL,
        createdAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updatedAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );
    COMMENT ON TABLE public.Locations IS 'Stores details about physical event locations/venues.';
    ALTER TABLE public.Locations ENABLE ROW LEVEL SECURITY;
    -- Add link back from Events table in the events migration (Task 17)
    -- Add policies later
    ```
3.  Use the Supabase dashboard or CLI to apply this migration, or prepare to call `mcp_supabase_apply_migration` tool with the SQL content and a suitable name (e.g., `create_locations_table`). 