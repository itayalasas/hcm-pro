/*
  # Allow Company Creation During Authentication
  
  Allows authenticated users to create companies and related records
  when they authenticate for the first time.
*/

-- Allow authenticated users to create companies
CREATE POLICY "Authenticated users can create companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to create business units for their company
CREATE POLICY "Users can create business units"
  ON business_units FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to view business units in their company
CREATE POLICY "Users can view company business units"
  ON business_units FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM employees WHERE user_id = auth.uid()
    )
  );