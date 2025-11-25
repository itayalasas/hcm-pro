/*
  # Add Missing Columns to Payroll Periods
  
  1. Changes
    - Add `period_type` column to store monthly, biweekly, weekly, etc.
    - Add `notes` column for additional information
    - Add `total_contributions` column for employer contributions
  
  2. Security
    - Maintain existing RLS policies
*/

-- Add missing columns to payroll_periods table
DO $$ 
BEGIN
  -- Add period_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payroll_periods' AND column_name = 'period_type'
  ) THEN
    ALTER TABLE payroll_periods 
    ADD COLUMN period_type VARCHAR(50) DEFAULT 'monthly';
  END IF;

  -- Add notes column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payroll_periods' AND column_name = 'notes'
  ) THEN
    ALTER TABLE payroll_periods 
    ADD COLUMN notes TEXT;
  END IF;

  -- Add total_contributions column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payroll_periods' AND column_name = 'total_contributions'
  ) THEN
    ALTER TABLE payroll_periods 
    ADD COLUMN total_contributions NUMERIC(12, 2) DEFAULT 0;
  END IF;
END $$;

-- Add check constraint for period_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'payroll_periods_period_type_check'
  ) THEN
    ALTER TABLE payroll_periods 
    ADD CONSTRAINT payroll_periods_period_type_check 
    CHECK (period_type IN ('weekly', 'biweekly', 'monthly', 'bimonthly', 'custom'));
  END IF;
END $$;
