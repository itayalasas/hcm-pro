/*
  # Tabla de Departamentos
  
  1. Nueva Tabla
    - `departments` - Departamentos organizacionales por empresa
*/

CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  parent_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(company_id, code)
);

CREATE INDEX IF NOT EXISTS idx_departments_company ON departments(company_id);
CREATE INDEX IF NOT EXISTS idx_departments_active ON departments(company_id, active);
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(company_id, name);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view departments of their companies"
  ON departments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_companies
      WHERE user_companies.company_id = departments.company_id
      AND user_companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage departments"
  ON departments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_companies
      WHERE user_companies.company_id = departments.company_id
      AND user_companies.user_id = auth.uid()
      AND user_companies.role IN ('admin', 'manager')
    )
  );
