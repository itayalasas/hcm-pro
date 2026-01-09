/*
  # Add Document Permissions System

  ## New Tables

  1. **document_permissions**
    - `id` (uuid, primary key)
    - `company_id` (uuid, foreign key to companies)
    - `document_id` (uuid, foreign key to documents)
    - `user_id` (uuid) - Usuario con permisos (null = todos)
    - `employee_id` (uuid) - Empleado con permisos (null = todos)
    - `department_id` (uuid) - Departamento con permisos (null = todos)
    - `permission_type` (text) - Tipo: view, edit, download
    - `created_at` (timestamptz)
    - `created_by` (uuid)

  ## Changes to Storage Policies
    - Update storage policies to check document permissions

  ## Security
    - Enable RLS on document_permissions table
    - Add policies for company-based access control
*/

-- Create document_permissions table
CREATE TABLE IF NOT EXISTS document_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id uuid,
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  permission_type text NOT NULL CHECK (permission_type IN ('view', 'edit', 'download', 'all')),
  created_at timestamptz DEFAULT now(),
  created_by uuid,
  CHECK (
    (user_id IS NOT NULL AND employee_id IS NULL AND department_id IS NULL) OR
    (user_id IS NULL AND employee_id IS NOT NULL AND department_id IS NULL) OR
    (user_id IS NULL AND employee_id IS NULL AND department_id IS NOT NULL) OR
    (user_id IS NULL AND employee_id IS NULL AND department_id IS NULL)
  )
);

-- Enable Row Level Security
ALTER TABLE document_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_permissions
CREATE POLICY "Users can view document permissions in their companies"
  ON document_permissions FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert document permissions in their companies"
  ON document_permissions FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update document permissions in their companies"
  ON document_permissions FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete document permissions in their companies"
  ON document_permissions FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

-- Create function to check if user has permission to view document
CREATE OR REPLACE FUNCTION user_can_view_document(doc_id uuid, user_id_param uuid)
RETURNS boolean AS $$
DECLARE
  has_permission boolean;
  doc_company_id uuid;
BEGIN
  -- Get document company_id
  SELECT company_id INTO doc_company_id FROM documents WHERE id = doc_id;
  
  -- Check if user is in the same company
  IF NOT EXISTS (
    SELECT 1 FROM user_companies 
    WHERE user_id = user_id_param AND company_id = doc_company_id
  ) THEN
    RETURN false;
  END IF;
  
  -- If no specific permissions set, allow all users in company
  IF NOT EXISTS (
    SELECT 1 FROM document_permissions WHERE document_id = doc_id
  ) THEN
    RETURN true;
  END IF;
  
  -- Check if user has explicit permission
  SELECT EXISTS (
    SELECT 1 FROM document_permissions
    WHERE document_id = doc_id
    AND (
      user_id = user_id_param OR
      employee_id IN (SELECT id FROM employees WHERE company_id = doc_company_id) OR
      department_id IN (SELECT department_id FROM employees WHERE company_id = doc_company_id) OR
      (user_id IS NULL AND employee_id IS NULL AND department_id IS NULL)
    )
    AND permission_type IN ('view', 'all')
  ) INTO has_permission;
  
  RETURN has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user can edit document
CREATE OR REPLACE FUNCTION user_can_edit_document(doc_id uuid, user_id_param uuid)
RETURNS boolean AS $$
DECLARE
  has_permission boolean;
  doc_company_id uuid;
BEGIN
  -- Get document company_id
  SELECT company_id INTO doc_company_id FROM documents WHERE id = doc_id;
  
  -- Check if user is in the same company
  IF NOT EXISTS (
    SELECT 1 FROM user_companies 
    WHERE user_id = user_id_param AND company_id = doc_company_id
  ) THEN
    RETURN false;
  END IF;
  
  -- If no specific permissions set, allow all users in company
  IF NOT EXISTS (
    SELECT 1 FROM document_permissions WHERE document_id = doc_id
  ) THEN
    RETURN true;
  END IF;
  
  -- Check if user has explicit edit permission
  SELECT EXISTS (
    SELECT 1 FROM document_permissions
    WHERE document_id = doc_id
    AND (
      user_id = user_id_param OR
      employee_id IN (SELECT id FROM employees WHERE company_id = doc_company_id) OR
      department_id IN (SELECT department_id FROM employees WHERE company_id = doc_company_id) OR
      (user_id IS NULL AND employee_id IS NULL AND department_id IS NULL)
    )
    AND permission_type IN ('edit', 'all')
  ) INTO has_permission;
  
  RETURN has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_document_permissions_document_id ON document_permissions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_permissions_user_id ON document_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_document_permissions_employee_id ON document_permissions(employee_id);
CREATE INDEX IF NOT EXISTS idx_document_permissions_department_id ON document_permissions(department_id);