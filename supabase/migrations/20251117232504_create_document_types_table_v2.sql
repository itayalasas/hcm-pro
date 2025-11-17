/*
  # Crear tabla de Tipos de Documento

  ## Descripción
  Tabla maestra para tipos de documentos de identidad (cédula, pasaporte, etc.)

  ## Nueva Tabla

  ### `document_types` - Tipos de Documento
    - `id` (uuid, primary key)
    - `company_id` (uuid, foreign key a companies)
    - `code` (text) - Código único del tipo de documento
    - `name` (text) - Nombre descriptivo del tipo de documento
    - `description` (text, opcional) - Descripción adicional
    - `active` (boolean) - Si está activo o no
    - `created_at`, `updated_at` (timestamptz)
    - Constraint: UNIQUE(company_id, code)

  ## Cambios a tabla employees
    - Agregar `document_type_id` (FK a document_types)

  ## Seguridad
    - RLS habilitado
    - Políticas para SELECT, INSERT, UPDATE, DELETE por company
*/

-- Crear tabla de tipos de documento
CREATE TABLE IF NOT EXISTS document_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, code)
);

CREATE INDEX IF NOT EXISTS idx_document_types_company ON document_types(company_id);
CREATE INDEX IF NOT EXISTS idx_document_types_active ON document_types(company_id, active);
CREATE INDEX IF NOT EXISTS idx_document_types_code ON document_types(company_id, code);

ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view document types for their company"
  ON document_types FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert document types for their company"
  ON document_types FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update document types for their company"
  ON document_types FOR UPDATE
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

CREATE POLICY "Users can delete document types for their company"
  ON document_types FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

-- Agregar campo document_type_id a employees
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'document_type_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN document_type_id uuid REFERENCES document_types(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_employees_document_type ON employees(document_type_id);

-- Insertar tipos de documento comunes para cada empresa
INSERT INTO document_types (company_id, code, name, description)
SELECT DISTINCT c.id, 'DNI', 'DNI / Cédula', 'Documento Nacional de Identidad o Cédula de Ciudadanía'
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM document_types dt 
  WHERE dt.company_id = c.id AND dt.code = 'DNI'
);

INSERT INTO document_types (company_id, code, name, description)
SELECT DISTINCT c.id, 'PASS', 'Pasaporte', 'Pasaporte'
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM document_types dt 
  WHERE dt.company_id = c.id AND dt.code = 'PASS'
);

INSERT INTO document_types (company_id, code, name, description)
SELECT DISTINCT c.id, 'CE', 'Cédula de Extranjería', 'Cédula de Extranjería'
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM document_types dt 
  WHERE dt.company_id = c.id AND dt.code = 'CE'
);

INSERT INTO document_types (company_id, code, name, description)
SELECT DISTINCT c.id, 'RUC', 'RUC', 'Registro Único de Contribuyentes'
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM document_types dt 
  WHERE dt.company_id = c.id AND dt.code = 'RUC'
);

INSERT INTO document_types (company_id, code, name, description)
SELECT DISTINCT c.id, 'OTHER', 'Otro', 'Otro tipo de documento'
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM document_types dt 
  WHERE dt.company_id = c.id AND dt.code = 'OTHER'
);