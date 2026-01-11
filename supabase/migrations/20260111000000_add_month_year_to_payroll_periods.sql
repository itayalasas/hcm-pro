/*
  # Add Month and Year Columns to Payroll Periods

  1. Changes
    - Add `month` column (INTEGER) to store the month number (1-12)
    - Add `year` column (INTEGER) to store the year
    - These columns enable easier filtering and reporting by period
    - Auto-populate existing records based on start_date

  2. Security
    - Maintain existing RLS policies
*/

-- Add month and year columns to payroll_periods table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payroll_periods' AND column_name = 'month'
  ) THEN
    ALTER TABLE payroll_periods
    ADD COLUMN month INTEGER;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payroll_periods' AND column_name = 'year'
  ) THEN
    ALTER TABLE payroll_periods
    ADD COLUMN year INTEGER;
  END IF;
END $$;

-- Populate month and year from existing start_date values
UPDATE payroll_periods
SET
  month = EXTRACT(MONTH FROM start_date),
  year = EXTRACT(YEAR FROM start_date)
WHERE month IS NULL OR year IS NULL;

-- Add check constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payroll_periods_month_check'
  ) THEN
    ALTER TABLE payroll_periods
    ADD CONSTRAINT payroll_periods_month_check
    CHECK (month >= 1 AND month <= 12);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payroll_periods_year_check'
  ) THEN
    ALTER TABLE payroll_periods
    ADD CONSTRAINT payroll_periods_year_check
    CHECK (year >= 2000 AND year <= 2100);
  END IF;
END $$;
