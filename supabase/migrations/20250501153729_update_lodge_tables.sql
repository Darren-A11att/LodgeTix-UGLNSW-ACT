-- Update Lodge tables migration (20250501153729)
-- Consolidates the existing Lodges and GrandLodges tables into the Organisations table

-- Step 1: Add temporary columns to Organisations to hold legacy IDs for mapping
ALTER TABLE public.Organisations ADD COLUMN IF NOT EXISTS legacyLodgeId UUID;
ALTER TABLE public.Organisations ADD COLUMN IF NOT EXISTS legacyGrandLodgeId UUID;
CREATE INDEX IF NOT EXISTS idx_org_legacy_lodge_id ON public.Organisations(legacyLodgeId);
CREATE INDEX IF NOT EXISTS idx_org_legacy_gl_id ON public.Organisations(legacyGrandLodgeId);

-- Step 2: Insert Grand Lodges into Organisations
INSERT INTO public.Organisations (
    name, 
    type, 
    legacyGrandLodgeId, 
    abbreviation, 
    country
)
SELECT 
    name, 
    'GrandLodge'::public.organisation_type, 
    id, 
    abbreviation, 
    country
FROM public.grand_lodges
ON CONFLICT (name) DO NOTHING; -- Avoid duplicates based on name

-- Step 3: Insert Lodges into Organisations
-- First, we need to get the parent organisation ID (Grand Lodge) for each lodge
INSERT INTO public.Organisations (
    name, 
    type, 
    legacyLodgeId, 
    number, 
    displayName, 
    parentOrganisationId
)
SELECT 
    l.name, 
    'Lodge'::public.organisation_type, 
    l.id, 
    l.number, 
    l.display_name,
    (SELECT o.organisationId FROM public.Organisations o WHERE o.legacyGrandLodgeId = l.grand_lodge_id)
FROM public.lodges l
ON CONFLICT (name) DO NOTHING; -- Avoid duplicates based on name

-- Step 4: Update FK in MasonicProfiles to point to new Organisation records
ALTER TABLE public.MasonicProfiles DROP CONSTRAINT IF EXISTS masonicprofiles_lodgeid_fkey; -- Drop old constraint if exists

-- Update lodgeId in MasonicProfiles to point to the new Organisations records
UPDATE public.MasonicProfiles mp
SET lodgeId = (
    SELECT o.organisationId
    FROM public.Organisations o
    WHERE o.legacyLodgeId = mp.lodgeId
)
WHERE EXISTS (
    SELECT 1
    FROM public.Organisations o
    WHERE o.legacyLodgeId = mp.lodgeId
);

-- Update grandLodgeId in MasonicProfiles to point to the new Organisations records
ALTER TABLE public.MasonicProfiles ADD COLUMN IF NOT EXISTS grandLodgeOrgId UUID REFERENCES public.Organisations(organisationId) ON DELETE SET NULL;

UPDATE public.MasonicProfiles mp
SET grandLodgeOrgId = (
    SELECT o.organisationId
    FROM public.Organisations o
    WHERE o.legacyGrandLodgeId = mp.grandLodgeId
)
WHERE mp.grandLodgeId IS NOT NULL;

-- Add the new FK constraint to Organisations table
ALTER TABLE public.MasonicProfiles
  ADD CONSTRAINT fk_masonicprofiles_organisation
  FOREIGN KEY (lodgeId) REFERENCES public.Organisations(organisationId) ON DELETE SET NULL;

ALTER TABLE public.MasonicProfiles
  ADD CONSTRAINT fk_masonicprofiles_grandlodge_organisation
  FOREIGN KEY (grandLodgeOrgId) REFERENCES public.Organisations(organisationId) ON DELETE SET NULL;

-- Step 5: Update the Events table to reference Organisations instead of the old lodge tables
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS organisationId UUID REFERENCES public.Organisations(organisationId) ON DELETE SET NULL;

-- Step 6: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organisations_type ON public.Organisations(type);
CREATE INDEX IF NOT EXISTS idx_organisations_parent ON public.Organisations(parentOrganisationId);

-- The temporary columns (legacyLodgeId and legacyGrandLodgeId) will be kept
-- until the data migration is complete, and then removed in Task 23
-- when the old tables are dropped.

-- Add comments about the mapping
COMMENT ON COLUMN public.Organisations.legacyLodgeId IS 'Temporary column to map to old Lodges table. Will be removed after migration.';
COMMENT ON COLUMN public.Organisations.legacyGrandLodgeId IS 'Temporary column to map to old GrandLodges table. Will be removed after migration.';