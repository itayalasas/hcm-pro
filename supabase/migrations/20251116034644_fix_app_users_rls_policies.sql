/*
  # Fix RLS Policies for app_users Table

  ## Problem
  Users cannot view the app_users list because RLS policies require them to already 
  be an admin in user_companies table. This creates a chicken-and-egg problem for 
  users synced from external authentication.

  ## Solution
  Allow authenticated users to read all app_users records so they can assign companies.
  Keep write operations restricted to service role (via edge functions).

  ## Changes
  1. Drop restrictive read policies
  2. Add simple policy allowing all authenticated users to read app_users
  3. Prevent direct modifications (INSERT/UPDATE/DELETE) from client
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Usuarios pueden ver su propio registro" ON app_users;
DROP POLICY IF EXISTS "Administradores pueden ver todos los usuarios" ON app_users;

-- Allow all authenticated users to read app_users
-- This is safe because:
-- 1. It's read-only (SELECT)
-- 2. Users need to see the list to assign companies
-- 3. Sensitive data like passwords are not stored here
CREATE POLICY "Authenticated users can view all users"
  ON app_users FOR SELECT
  TO authenticated
  USING (true);

-- Prevent direct INSERT/UPDATE/DELETE from client
-- These operations should only happen via edge functions using service role
CREATE POLICY "Prevent direct insert"
  ON app_users FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "Prevent direct update"
  ON app_users FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Prevent direct delete"
  ON app_users FOR DELETE
  TO authenticated
  USING (false);
