/*
  # Add Code Field to Master Data Tables

  ## Overview
  Adds the `code` field to master data tables that don't have it yet,
  to support automatic code generation.

  ## Changes
  1. Add `code` column to:
    - `academic_levels`
    - `educational_institutions`
    - `fields_of_study`
    - `employment_types`
  
  2. Create unique indexes on company_id + code

  ## Notes
  - Existing data will have NULL codes initially
  - New records will use automatic code generation
*/

-- Add code column to academic_levels
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'academic_levels' AND column_name = 'code'
  ) THEN
    ALTER TABLE academic_levels ADD COLUMN code text;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_academic_levels_company_code ON academic_levels(company_id, code);
  END IF;
END $$;

-- Add code column to educational_institutions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'educational_institutions' AND column_name = 'code'
  ) THEN
    ALTER TABLE educational_institutions ADD COLUMN code text;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_educational_institutions_company_code ON educational_institutions(company_id, code);
  END IF;
END $$;

-- Add code column to fields_of_study
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fields_of_study' AND column_name = 'code'
  ) THEN
    ALTER TABLE fields_of_study ADD COLUMN code text;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_fields_of_study_company_code ON fields_of_study(company_id, code);
  END IF;
END $$;

-- Add code column to employment_types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employment_types' AND column_name = 'code'
  ) THEN
    ALTER TABLE employment_types ADD COLUMN code text;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_employment_types_company_code ON employment_types(company_id, code);
  END IF;
END $$;