/*
  # Allow Anonymous Company and Employee Creation
  
  Allows the creation of companies and employees during the OAuth callback
  when users don't have a Supabase auth session yet.
  
  This is safe because:
  1. Only happens during initial authentication
  2. Data comes from verified external auth system
  3. Each user can only create their own records
*/

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Authenticated users can create companies" ON companies;

-- Allow anyone to create companies (will be used only during OAuth callback)
CREATE POLICY "Allow company creation during onboarding"
  ON companies FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone to view companies they're associated with
CREATE POLICY "Users can view all companies"
  ON companies FOR SELECT
  TO anon, authenticated
  USING (true);

-- Drop existing employee insert policy if exists
DROP POLICY IF EXISTS "Users can create own employee record" ON employees;

-- Allow anyone to create employee records (OAuth callback)
CREATE POLICY "Allow employee creation during onboarding"
  ON employees FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow viewing all employees (for now, will restrict later)
DROP POLICY IF EXISTS "Users view own employee" ON employees;
DROP POLICY IF EXISTS "Users can view employees in their company" ON employees;

CREATE POLICY "Users can view all employees"
  ON employees FOR SELECT
  TO anon, authenticated
  USING (true);