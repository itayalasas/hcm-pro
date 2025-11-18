/*
  # Fix Storage Policies for External Auth

  1. Changes
    - Drop existing storage policies that use auth.uid()
    - Create new policies that work with external authentication
    - Use current_setting to get external_user_id
    
  2. Security
    - Maintain same security model but compatible with external auth
    - Users can only access documents from their companies
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload employee documents for their company" ON storage.objects;
DROP POLICY IF EXISTS "Users can view employee documents from their company" ON storage.objects;
DROP POLICY IF EXISTS "Users can update employee documents from their company" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete employee documents from their company" ON storage.objects;

-- Policy: Allow users to upload documents for their company (external auth)
CREATE POLICY "Users can upload employee documents for their company"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'employee-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT company_id::text 
    FROM user_companies 
    WHERE user_id = current_setting('app.current_user_id', true)::uuid
  )
);

-- Policy: Allow users to view documents from their company (external auth)
CREATE POLICY "Users can view employee documents from their company"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'employee-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT company_id::text 
    FROM user_companies 
    WHERE user_id = current_setting('app.current_user_id', true)::uuid
  )
);

-- Policy: Allow users to update documents from their company (external auth)
CREATE POLICY "Users can update employee documents from their company"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'employee-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT company_id::text 
    FROM user_companies 
    WHERE user_id = current_setting('app.current_user_id', true)::uuid
  )
)
WITH CHECK (
  bucket_id = 'employee-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT company_id::text 
    FROM user_companies 
    WHERE user_id = current_setting('app.current_user_id', true)::uuid
  )
);

-- Policy: Allow users to delete documents from their company (external auth)
CREATE POLICY "Users can delete employee documents from their company"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'employee-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT company_id::text 
    FROM user_companies 
    WHERE user_id = current_setting('app.current_user_id', true)::uuid
  )
);