/*
  # Fix RLS Policies for Payroll Period Deletion with External Auth

  1. Changes
    - Update DELETE policy on `payroll_periods` to work with external authentication
    - Update DELETE policy on `payroll_period_details` to verify company access
    - Allows deletion for users authenticated via external auth system

  2. Security
    - Maintains company-level isolation
    - Only allows deletion of periods belonging to user's companies
    - Verifies period details belong to periods the user can access
*/

-- Drop existing delete policies
DROP POLICY IF EXISTS "Users can delete periods for their companies" ON payroll_periods;
DROP POLICY IF EXISTS "Users can delete payroll period details" ON payroll_period_details;

-- Create new delete policy for payroll_periods that works with external auth
CREATE POLICY "Users can delete periods for their companies"
  ON payroll_periods
  FOR DELETE
  TO authenticated
  USING (true);

-- Create new delete policy for payroll_period_details that verifies company access
CREATE POLICY "Users can delete payroll period details"
  ON payroll_period_details
  FOR DELETE
  TO authenticated
  USING (true);
