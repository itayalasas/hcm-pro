/*
  # Allow Employee Self Registration
  
  Adds RLS policy to allow authenticated users to create their own employee record
  during signup process.
*/

-- Allow users to insert their own employee record
CREATE POLICY "Users can create own employee record"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow users to update their own employee record  
CREATE POLICY "Users can update own employee record"
  ON employees FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());