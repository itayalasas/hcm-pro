/*
  # Create Banks and Account Types Tables

  ## Overview
  Creates master data tables for banks and bank account types to support payroll banking information
  across LATAM countries (Uruguay, Chile, Colombia, Argentina, Peru, Mexico, etc.)

  ## New Tables

  ### `banks`
  Stores bank information for different countries
  - `id` (uuid, primary key) - Unique identifier
  - `company_id` (uuid, foreign key) - References companies table
  - `code` (text) - Bank code (e.g., "001", "002")
  - `name` (text) - Bank name (e.g., "Banco de Chile", "BBVA")
  - `country` (text) - Country ISO code (UY, CL, CO, AR, PE, MX)
  - `swift_code` (text, optional) - International SWIFT/BIC code
  - `is_active` (boolean) - Whether the bank is active
  - `created_at` (timestamptz) - Creation timestamp
  - `created_by` (uuid, optional) - User who created the record
  - `updated_at` (timestamptz) - Last update timestamp
  - `updated_by` (uuid, optional) - User who last updated the record

  ### `bank_account_types`
  Stores bank account types (savings, checking, payroll, etc.)
  - `id` (uuid, primary key) - Unique identifier
  - `company_id` (uuid, foreign key) - References companies table
  - `code` (text) - Account type code
  - `name` (text) - Account type name
  - `description` (text, optional) - Account type description
  - `is_active` (boolean) - Whether the type is active
  - `created_at` (timestamptz) - Creation timestamp
  - `created_by` (uuid, optional) - User who created the record
  - `updated_at` (timestamptz) - Last update timestamp
  - `updated_by` (uuid, optional) - User who last updated the record

  ## Table Modifications

  ### `employees`
  - Updates `bank_name` to `bank_id` (uuid, foreign key to banks)
  - Updates `bank_account_type` to `bank_account_type_id` (uuid, foreign key to bank_account_types)

  ## Security
  - Enable RLS on both new tables
  - Add policies for authenticated users to read their company's data
  - Add policies for authenticated users to manage their company's data

  ## Important Notes
  1. Banks are organized by country for easy filtering
  2. SWIFT codes are optional but useful for international transfers
  3. Account types are standardized across countries
  4. Both tables support multi-tenancy via company_id
*/

-- Create banks table
CREATE TABLE IF NOT EXISTS banks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  country text NOT NULL,
  swift_code text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES app_users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES app_users(id),
  UNIQUE(company_id, code, country)
);

-- Create bank_account_types table
CREATE TABLE IF NOT EXISTS bank_account_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES app_users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES app_users(id),
  UNIQUE(company_id, code)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_banks_company_country ON banks(company_id, country) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_banks_name ON banks(name);
CREATE INDEX IF NOT EXISTS idx_bank_account_types_company ON bank_account_types(company_id) WHERE is_active = true;

-- Enable RLS
ALTER TABLE banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_account_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies for banks
CREATE POLICY "Users can view banks in their company"
  ON banks FOR SELECT
  TO authenticated
  USING (company_id IN (
    SELECT company_id FROM user_companies WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert banks in their company"
  ON banks FOR INSERT
  TO authenticated
  WITH CHECK (company_id IN (
    SELECT company_id FROM user_companies WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update banks in their company"
  ON banks FOR UPDATE
  TO authenticated
  USING (company_id IN (
    SELECT company_id FROM user_companies WHERE user_id = auth.uid()
  ))
  WITH CHECK (company_id IN (
    SELECT company_id FROM user_companies WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete banks in their company"
  ON banks FOR DELETE
  TO authenticated
  USING (company_id IN (
    SELECT company_id FROM user_companies WHERE user_id = auth.uid()
  ));

-- RLS Policies for bank_account_types
CREATE POLICY "Users can view account types in their company"
  ON bank_account_types FOR SELECT
  TO authenticated
  USING (company_id IN (
    SELECT company_id FROM user_companies WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert account types in their company"
  ON bank_account_types FOR INSERT
  TO authenticated
  WITH CHECK (company_id IN (
    SELECT company_id FROM user_companies WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update account types in their company"
  ON bank_account_types FOR UPDATE
  TO authenticated
  USING (company_id IN (
    SELECT company_id FROM user_companies WHERE user_id = auth.uid()
  ))
  WITH CHECK (company_id IN (
    SELECT company_id FROM user_companies WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete account types in their company"
  ON bank_account_types FOR DELETE
  TO authenticated
  USING (company_id IN (
    SELECT company_id FROM user_companies WHERE user_id = auth.uid()
  ));

-- Add new columns to employees table
DO $$
BEGIN
  -- Add bank_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'bank_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN bank_id uuid REFERENCES banks(id);
  END IF;

  -- Add bank_account_type_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'bank_account_type_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN bank_account_type_id uuid REFERENCES bank_account_types(id);
  END IF;
END $$;

-- Create indexes on new foreign keys
CREATE INDEX IF NOT EXISTS idx_employees_bank_id ON employees(bank_id);
CREATE INDEX IF NOT EXISTS idx_employees_bank_account_type_id ON employees(bank_account_type_id);