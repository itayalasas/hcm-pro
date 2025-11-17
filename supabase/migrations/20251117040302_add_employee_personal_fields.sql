/*
  # Add Employee Personal Information Fields

  1. Changes to employees table
    - Add personal information fields:
      - `phone` (text) - Teléfono fijo del empleado
      - `mobile` (text) - Teléfono móvil del empleado
      - `date_of_birth` (date) - Fecha de nacimiento
      - `national_id` (text) - Documento de identidad nacional (CI, DNI, etc.)
      - `gender` (text) - Género del empleado

  2. Notes
    - All new fields are optional
    - Fields support international formats
*/

-- Add personal information fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'phone'
  ) THEN
    ALTER TABLE employees ADD COLUMN phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'mobile'
  ) THEN
    ALTER TABLE employees ADD COLUMN mobile text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE employees ADD COLUMN date_of_birth date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'national_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN national_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'gender'
  ) THEN
    ALTER TABLE employees ADD COLUMN gender text;
  END IF;
END $$;