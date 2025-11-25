/*
  # Fix RLS Policies for Payroll Concepts with External Auth
  
  1. Changes
    - Update policies to use current_setting for external auth compatibility
    - Use app.current_user_id instead of auth.uid()
  
  2. Security
    - Maintain RLS enabled
    - Users can only access concepts for their companies
    - Compatible with external authentication system
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view concepts for their companies" ON payroll_concepts;
DROP POLICY IF EXISTS "Users can create concepts for their companies" ON payroll_concepts;
DROP POLICY IF EXISTS "Users can update concepts for their companies" ON payroll_concepts;
DROP POLICY IF EXISTS "Users can delete concepts for their companies" ON payroll_concepts;

-- Helper function to get current user ID (works with external auth)
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  user_id_text text;
BEGIN
  -- Try to get from session config first (external auth)
  user_id_text := current_setting('app.current_user_id', true);
  
  IF user_id_text IS NOT NULL AND user_id_text != '' THEN
    RETURN user_id_text::uuid;
  END IF;
  
  -- Fallback to auth.uid() for regular Supabase auth
  RETURN auth.uid();
END;
$$;

-- Create new policies using the helper function

-- SELECT policy
CREATE POLICY "Users can view concepts for their companies"
  ON payroll_concepts FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = get_current_user_id()
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
      WHERE user_id = get_current_user_id()
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
CREATE POLICY "Users can delete concepts for their companies"
  ON payroll_concepts FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = get_current_user_id()
    )
  );
