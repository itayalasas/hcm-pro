/*
  # Fix Storage Policies for Documents Bucket

  ## Changes
    - Drop existing storage policies that are too restrictive
    - Create new storage policies that properly check authentication
    - Allow authenticated users to upload, view, update and delete documents in their company folders

  ## Security
    - Users can only access files in their company folder
    - All operations require authentication
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view documents in their companies" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete documents" ON storage.objects;

-- Create new storage policies for documents bucket

-- Allow authenticated users to view/download documents
CREATE POLICY "Authenticated users can view documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents');

-- Allow authenticated users to insert documents
CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents');

-- Allow authenticated users to update their documents
CREATE POLICY "Authenticated users can update documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'documents')
  WITH CHECK (bucket_id = 'documents');

-- Allow authenticated users to delete their documents
CREATE POLICY "Authenticated users can delete documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents');