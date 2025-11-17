/*
  # Add location to companies

  1. Changes
    - Add `location_id` column to `companies` table
    - Add foreign key constraint to `work_locations` table
    - Update existing companies to have null location (optional)

  2. Notes
    - Location is optional for companies
    - When a location is deleted, company location_id will be set to null
*/

-- Add location_id column to companies table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'location_id'
  ) THEN
    ALTER TABLE companies ADD COLUMN location_id uuid;
  END IF;
END $$;

-- Add foreign key constraint to work_locations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'companies_location_id_fkey'
  ) THEN
    ALTER TABLE companies
      ADD CONSTRAINT companies_location_id_fkey
      FOREIGN KEY (location_id)
      REFERENCES work_locations(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS companies_location_id_idx ON companies(location_id);