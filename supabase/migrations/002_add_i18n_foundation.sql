-- Migration: Add i18n foundation for multilingual support
-- This migration sets up the base infrastructure for internationalization:
-- - Creates a languages table to track supported languages
-- - Adds locale preferences to users and clients tables
-- - Establishes English (en) as the default language with French (fr) support

-- ============================================================================
-- 1. Create languages table
-- ============================================================================
-- This table stores all supported languages in the system.
-- The is_default flag ensures only one language can be marked as default.
-- We use a CHECK constraint combined with a UNIQUE partial index to enforce
-- that exactly one language has is_default = true.

CREATE TABLE IF NOT EXISTS public.languages (
  code TEXT PRIMARY KEY CHECK (char_length(code) = 2), -- ISO 639-1 language codes (en, fr, etc.)
  name TEXT NOT NULL, -- Display name of the language (e.g., "English", "Français")
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create a unique partial index to ensure only one language can be default
-- This is more efficient than a CHECK constraint with a function
CREATE UNIQUE INDEX IF NOT EXISTS languages_single_default_idx
  ON public.languages (is_default)
  WHERE is_default = true;

-- Enable RLS on languages table
-- All authenticated users can read languages (needed for language selection)
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: All authenticated users can read languages
CREATE POLICY "Anyone can view languages"
  ON public.languages
  FOR SELECT
  TO authenticated
  USING (true);

-- Grant SELECT permission to authenticated users
GRANT SELECT ON public.languages TO authenticated;

-- ============================================================================
-- 2. Insert initial languages (en as default, fr as secondary)
-- ============================================================================
-- Insert English as the default language first
INSERT INTO public.languages (code, name, is_default)
VALUES ('en', 'English', true)
ON CONFLICT (code) DO NOTHING;

-- Insert French as a secondary language
INSERT INTO public.languages (code, name, is_default)
VALUES ('fr', 'Français', false)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 3. Add locale column to users table
-- ============================================================================
-- This column stores the user's preferred language.
-- It references languages.code and defaults to 'en' (the default language).
-- We use a CHECK constraint to ensure the locale is a valid language code,
-- and we'll add a foreign key once we're sure all existing data is valid.

-- First, add the column with a default value
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'en';

-- Add a CHECK constraint to ensure locale is a valid 2-character code
-- This provides immediate validation without requiring a FK (which would fail
-- if any existing rows have invalid values)
ALTER TABLE public.users
  ADD CONSTRAINT users_locale_format_check
  CHECK (locale IS NULL OR char_length(locale) = 2);

-- Update any NULL values to 'en' (shouldn't happen with DEFAULT, but safe)
UPDATE public.users
SET locale = 'en'
WHERE locale IS NULL;

-- Now add the foreign key constraint
-- This ensures locale references a valid language code
ALTER TABLE public.users
  ADD CONSTRAINT users_locale_fkey
  FOREIGN KEY (locale)
  REFERENCES public.languages(code)
  ON DELETE RESTRICT;

-- ============================================================================
-- 4. Add default_locale column to clients table (if it exists)
-- ============================================================================
-- This column stores the default language preference for a client organization.
-- Similar structure to users.locale, with a default of 'en'.

-- Add the column if the table exists (safe for future migrations)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'clients'
  ) THEN
    -- Add the column with default
    ALTER TABLE public.clients
      ADD COLUMN IF NOT EXISTS default_locale TEXT DEFAULT 'en';

    -- Add CHECK constraint for format
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'clients_default_locale_format_check'
    ) THEN
      ALTER TABLE public.clients
        ADD CONSTRAINT clients_default_locale_format_check
        CHECK (default_locale IS NULL OR char_length(default_locale) = 2);
    END IF;

    -- Update any NULL values to 'en'
    UPDATE public.clients
    SET default_locale = 'en'
    WHERE default_locale IS NULL;

    -- Add foreign key constraint
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'clients_default_locale_fkey'
    ) THEN
      ALTER TABLE public.clients
        ADD CONSTRAINT clients_default_locale_fkey
        FOREIGN KEY (default_locale)
        REFERENCES public.languages(code)
        ON DELETE RESTRICT;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- 5. Add trigger to update updated_at on languages table
-- ============================================================================
-- Reuse the existing update_updated_at_column function from the users migration

CREATE TRIGGER update_languages_updated_at
  BEFORE UPDATE ON public.languages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- FUTURE TRANSLATION TABLE PATTERN
-- ============================================================================
-- When you need to add translations for entities (e.g., projects, tasks, etc.),
-- follow this pattern:
--
-- Example for projects:
--
-- CREATE TABLE IF NOT EXISTS public.project_translations (
--   project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
--   language_code TEXT NOT NULL REFERENCES public.languages(code) ON DELETE RESTRICT,
--   name TEXT NOT NULL,
--   description TEXT,
--   -- Add other translatable fields as needed
--   created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
--   updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
--   PRIMARY KEY (project_id, language_code)
-- );
--
-- -- Enable RLS
-- ALTER TABLE public.project_translations ENABLE ROW LEVEL SECURITY;
--
-- -- RLS Policy: Users can access translations for projects they have access to
-- -- (This should mirror the RLS policies on the main projects table)
-- CREATE POLICY "Users can view project translations for accessible projects"
--   ON public.project_translations
--   FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.projects
--       WHERE projects.id = project_translations.project_id
--       -- Add your project access logic here (e.g., via project_memberships)
--     )
--   );
--
-- -- Grant permissions
-- GRANT SELECT ON public.project_translations TO authenticated;
--
-- -- Add updated_at trigger
-- CREATE TRIGGER update_project_translations_updated_at
--   BEFORE UPDATE ON public.project_translations
--   FOR EACH ROW
--   EXECUTE FUNCTION public.update_updated_at_column();
--
-- Notes:
-- - Keep the main table (projects) with default language fields (name, description)
-- - Use project_translations for all other languages
-- - The composite primary key (project_id, language_code) ensures one translation per language per project
-- - Always mirror RLS policies from the main table to maintain security
-- - Consider adding indexes on language_code for faster lookups

