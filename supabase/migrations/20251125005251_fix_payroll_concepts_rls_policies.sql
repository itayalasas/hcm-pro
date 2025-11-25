/*
  # Fix RLS Policies for Payroll Concepts
  
  1. Changes
    - Drop existing restrictive policies
    - Create new permissive policies for external auth
    - Allow operations based on company_id in user_companies table
  
  2. Security
    - Maintain RLS enabled
    - Users can only access concepts for their companies
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view payroll concepts for their company" ON payroll_concepts;
DROP POLICY IF EXISTS "Users can create payroll concepts for their company" ON payroll_concepts;
DROP POLICY IF EXISTS "Users can update payroll concepts for their company" ON payroll_concepts;
DROP POLICY IF EXISTS "Users can delete payroll concepts for their company" ON payroll_concepts;

-- Create new permissive policies for external auth compatibility

-- SELECT policy
CREATE POLICY "Users can view concepts for their companies"
  ON payroll_concepts FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );

-- INSERT policy
CREATE POLICY "Users can create concepts for their companies"
  ON payroll_concepts FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );

-- UPDATE policy
CREATE POLICY "Users can update concepts for their companies"
  ON payroll_concepts FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );

-- DELETE policy
CREATE POLICY "Users can delete concepts for their companies"
  ON payroll_concepts FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );
