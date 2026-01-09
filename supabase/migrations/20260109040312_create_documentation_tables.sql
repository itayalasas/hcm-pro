/*
  # Create Documentation Module Tables

  ## New Tables

  1. **documents**
    - `id` (uuid, primary key)
    - `company_id` (uuid, foreign key to companies)
    - `code` (text) - Código único del documento
    - `title` (text) - Título del documento
    - `description` (text) - Descripción
    - `document_type` (text) - Tipo: policy, procedure, form
    - `category` (text) - Categoría del documento
    - `version` (text) - Versión actual
    - `status` (text) - Estado: draft, published, archived, under_review
    - `effective_date` (date) - Fecha de vigencia
    - `review_date` (date) - Fecha de próxima revisión
    - `expiry_date` (date) - Fecha de vencimiento
    - `file_path` (text) - Ruta en storage
    - `file_name` (text) - Nombre del archivo
    - `file_size` (bigint) - Tamaño en bytes
    - `file_type` (text) - Tipo MIME
    - `department_id` (uuid) - Departamento responsable
    - `owner_id` (uuid) - Responsable del documento
    - `tags` (text[]) - Etiquetas
    - `requires_acknowledgment` (boolean) - Requiere confirmación de lectura
    - `active` (boolean)
    - `created_at` (timestamptz)
    - `created_by` (uuid)
    - `updated_at` (timestamptz)

  2. **document_versions**
    - `id` (uuid, primary key)
    - `company_id` (uuid, foreign key to companies)
    - `document_id` (uuid, foreign key to documents)
    - `version` (text) - Número de versión
    - `file_path` (text) - Ruta en storage
    - `file_name` (text) - Nombre del archivo
    - `file_size` (bigint) - Tamaño en bytes
    - `changes_description` (text) - Descripción de cambios
    - `created_by` (uuid)
    - `created_at` (timestamptz)

  3. **document_approvals**
    - `id` (uuid, primary key)
    - `company_id` (uuid, foreign key to companies)
    - `document_id` (uuid, foreign key to documents)
    - `approver_id` (uuid) - ID del aprobador
    - `status` (text) - Estado: pending, approved, rejected
    - `comments` (text) - Comentarios
    - `approved_at` (timestamptz)
    - `created_at` (timestamptz)

  4. **document_reads**
    - `id` (uuid, primary key)
    - `company_id` (uuid, foreign key to companies)
    - `document_id` (uuid, foreign key to documents)
    - `employee_id` (uuid, foreign key to employees)
    - `read_date` (timestamptz) - Fecha de lectura
    - `acknowledged` (boolean) - Confirmó lectura
    - `acknowledgment_date` (timestamptz) - Fecha de confirmación
    - `created_at` (timestamptz)

  ## Storage
    - Create storage bucket for documents

  ## Security
    - Enable RLS on all tables
    - Add policies for company-based access control
*/

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code text NOT NULL,
  title text NOT NULL,
  description text,
  document_type text NOT NULL CHECK (document_type IN ('policy', 'procedure', 'form')),
  category text,
  version text DEFAULT '1.0',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'under_review')),
  effective_date date,
  review_date date,
  expiry_date date,
  file_path text,
  file_name text,
  file_size bigint,
  file_type text,
  department_id uuid REFERENCES departments(id),
  owner_id uuid,
  tags text[],
  requires_acknowledgment boolean DEFAULT false,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, code)
);

-- Create document_versions table
CREATE TABLE IF NOT EXISTS document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version text NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  changes_description text,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Create document_approvals table
CREATE TABLE IF NOT EXISTS document_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  approver_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  comments text,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create document_reads table
CREATE TABLE IF NOT EXISTS document_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  read_date timestamptz DEFAULT now(),
  acknowledged boolean DEFAULT false,
  acknowledgment_date timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, document_id, employee_id)
);

-- Create storage bucket for documents (if not exists)
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('documents', 'documents', false)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Enable Row Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_reads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for documents
CREATE POLICY "Users can view documents in their companies"
  ON documents FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert documents in their companies"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update documents in their companies"
  ON documents FOR UPDATE
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

CREATE POLICY "Users can delete documents in their companies"
  ON documents FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for document_versions
CREATE POLICY "Users can view document versions in their companies"
  ON document_versions FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert document versions in their companies"
  ON document_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update document versions in their companies"
  ON document_versions FOR UPDATE
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

CREATE POLICY "Users can delete document versions in their companies"
  ON document_versions FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for document_approvals
CREATE POLICY "Users can view document approvals in their companies"
  ON document_approvals FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert document approvals in their companies"
  ON document_approvals FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update document approvals in their companies"
  ON document_approvals FOR UPDATE
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

CREATE POLICY "Users can delete document approvals in their companies"
  ON document_approvals FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for document_reads
CREATE POLICY "Users can view document reads in their companies"
  ON document_reads FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert document reads in their companies"
  ON document_reads FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update document reads in their companies"
  ON document_reads FOR UPDATE
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

CREATE POLICY "Users can delete document reads in their companies"
  ON document_reads FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

-- Storage policies for documents bucket
CREATE POLICY "Users can view documents in their companies"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents');

CREATE POLICY "Users can upload documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Users can update documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'documents')
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Users can delete documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_company_id ON documents(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_approvals_document_id ON document_approvals(document_id);
CREATE INDEX IF NOT EXISTS idx_document_approvals_approver_id ON document_approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_document_reads_document_id ON document_reads(document_id);
CREATE INDEX IF NOT EXISTS idx_document_reads_employee_id ON document_reads(employee_id);