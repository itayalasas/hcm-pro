/*
  # Fix RLS Policies for Payroll Periods with External Auth
  
  1. Changes
    - Update policies to use get_current_user_id() helper function
    - Compatible with external authentication system
  
  2. Security
    - Maintain RLS enabled
    - Users can only access periods for their companies
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view payroll periods for their company" ON payroll_periods;
DROP POLICY IF EXISTS "Users can create payroll periods for their company" ON payroll_periods;
DROP POLICY IF EXISTS "Users can update payroll periods for their company" ON payroll_periods;
DROP POLICY IF EXISTS "Users can delete payroll periods for their company" ON payroll_periods;

-- Create new policies using get_current_user_id()

-- SELECT policy
CREATE POLICY "Users can view periods for their companies"
  ON payroll_periods FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = get_current_user_id()
    )
  );

-- INSERT policy
CREATE POLICY "Users can create periods for their companies"
  ON payroll_periods FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = get_current_user_id()
    )
  );

-- UPDATE policy
CREATE POLICY "Users can update periods for their companies"
  ON payroll_periods FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = get_current_user_id()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = get_current_user_id()
    )
  );

-- DELETE policy
CREATE POLICY "Users can delete periods for their companies"
  ON payroll_periods FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = get_current_user_id()
    )
  );
