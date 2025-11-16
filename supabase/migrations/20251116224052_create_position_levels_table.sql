/*
  # Create Position Levels Table

  1. New Tables
    - `position_levels`
      - `id` (uuid, primary key)
      - `company_id` (uuid, references companies)
      - `code` (text, unique per company)
      - `name` (text, name of the position level)
      - `description` (text, optional description)
      - `order_index` (integer, for sorting levels hierarchically)
      - `active` (boolean, default true)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `created_by` (uuid, references app_users)
      - `updated_by` (uuid, references app_users)
  
  2. Security
    - Enable RLS on `position_levels` table
    - Add policies for authenticated users to manage their company's position levels

  3. Indexes
    - Add index on company_id for faster queries
    - Add unique index on (company_id, code) combination
*/

CREATE TABLE IF NOT EXISTS position_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  order_index integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES app_users(id),
  updated_by uuid REFERENCES app_users(id),
  UNIQUE(company_id, code)
);

CREATE INDEX IF NOT EXISTS idx_position_levels_company_id ON position_levels(company_id);
CREATE INDEX IF NOT EXISTS idx_position_levels_active ON position_levels(company_id, active);

ALTER TABLE position_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view position levels from their companies"
  ON position_levels FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert position levels for their companies"
  ON position_levels FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update position levels from their companies"
  ON position_levels FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete position levels from their companies"
  ON position_levels FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE TRIGGER update_position_levels_updated_at
  BEFORE UPDATE ON position_levels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();