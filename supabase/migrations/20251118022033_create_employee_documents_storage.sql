/*
  # Create Employee Documents Storage

  1. Storage Setup
    - Create `employee-documents` bucket for storing employee files
    - Enable public access for authenticated users only
    
  2. Security
    - RLS policies for upload (authenticated users can upload to their company)
    - RLS policies for download (authenticated users can download from their company)
    - RLS policies for delete (authenticated users can delete from their company)
    
  3. Important Notes
    - Files are organized by company_id/employee_id/filename structure
    - Maximum file size: 10MB per file
    - Allowed file types: PDF, DOC, DOCX, JPG, PNG, TXT
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'employee-documents',
  'employee-documents',
  false,
  10485760,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload documents for their company
CREATE POLICY "Users can upload employee documents for their company"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'employee-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT company_id::text 
    FROM user_companies 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Allow authenticated users to view documents from their company
CREATE POLICY "Users can view employee documents from their company"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'employee-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT company_id::text 
    FROM user_companies 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Allow authenticated users to update documents from their company
CREATE POLICY "Users can update employee documents from their company"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'employee-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT company_id::text 
    FROM user_companies 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'employee-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT company_id::text 
    FROM user_companies 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Allow authenticated users to delete documents from their company
CREATE POLICY "Users can delete employee documents from their company"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'employee-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT company_id::text 
    FROM user_companies 
    WHERE user_id = auth.uid()
  )
);