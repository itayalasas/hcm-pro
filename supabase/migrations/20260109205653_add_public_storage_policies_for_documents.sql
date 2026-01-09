/*
  # Add Public Storage Policies for Documents Bucket

  ## Changes
    - Add public policies for documents bucket (similar to employee-documents)
    - This is needed because the app uses external authentication
    - Allow public users to upload, view, update and delete documents

  ## Security
    - Policies apply to the documents bucket only
    - Application-level security controls access through document_permissions table
*/

-- Create public storage policies for documents bucket

-- Allow public to view/download documents
CREATE POLICY "Allow public reads on documents"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'documents');

-- Allow public to upload documents
CREATE POLICY "Allow public uploads on documents"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'documents');

-- Allow public to update documents
CREATE POLICY "Allow public updates on documents"
  ON storage.objects FOR UPDATE
  TO public
  USING (bucket_id = 'documents')
  WITH CHECK (bucket_id = 'documents');

-- Allow public to delete documents
CREATE POLICY "Allow public deletes on documents"
  ON storage.objects FOR DELETE
  TO public
  USING (bucket_id = 'documents');