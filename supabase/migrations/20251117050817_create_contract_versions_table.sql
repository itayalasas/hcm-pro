/*
  # Tabla de Versiones de Contratos de Empleados

  1. Nueva Tabla
    - `contract_versions` - Almacena las versiones de contratos generados para empleados
      - `id` (uuid, primary key)
      - `company_id` (uuid, references companies) - Empresa a la que pertenece
      - `employee_id` (uuid, references employees) - Empleado al que pertenece el contrato
      - `contract_template_id` (uuid, references contract_templates) - Plantilla utilizada
      - `version` (integer) - Número de versión del contrato
      - `content` (text) - Contenido completo del contrato generado
      - `generated_at` (timestamptz) - Fecha de generación
      - `generated_by` (uuid, references auth.users) - Usuario que generó el contrato
      - `status` (text) - Estado del contrato: draft, active, superseded, terminated
      - `signed_at` (timestamptz) - Fecha de firma (si aplica)
      - `effective_date` (date) - Fecha de vigencia del contrato
      - `expiry_date` (date) - Fecha de vencimiento (si aplica)
      - `notes` (text) - Notas adicionales
      - `created_at` (timestamptz) - Fecha de creación del registro
      - `updated_at` (timestamptz) - Fecha de última actualización

  2. Índices
    - Por empleado para búsqueda rápida
    - Por compañía y estado
    - Por versión descendente

  3. Seguridad
    - RLS habilitado
    - Usuarios pueden ver contratos de su empresa
    - Solo administradores pueden crear/modificar contratos
*/

CREATE TABLE IF NOT EXISTS contract_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  contract_template_id uuid REFERENCES contract_templates(id) ON DELETE SET NULL,
  version integer NOT NULL DEFAULT 1,
  content text NOT NULL,
  generated_at timestamptz DEFAULT now() NOT NULL,
  generated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text DEFAULT 'draft' NOT NULL CHECK (status IN ('draft', 'active', 'superseded', 'terminated')),
  signed_at timestamptz,
  effective_date date,
  expiry_date date,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(company_id, employee_id, version)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_contract_versions_employee ON contract_versions(employee_id);
CREATE INDEX IF NOT EXISTS idx_contract_versions_company_status ON contract_versions(company_id, status);
CREATE INDEX IF NOT EXISTS idx_contract_versions_version ON contract_versions(employee_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_contract_versions_effective ON contract_versions(employee_id, effective_date DESC);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_contract_versions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contract_versions_updated_at
  BEFORE UPDATE ON contract_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_versions_updated_at();

-- Habilitar RLS
ALTER TABLE contract_versions ENABLE ROW LEVEL SECURITY;

-- Política para ver contratos de la empresa
CREATE POLICY "Users can view contract versions of their companies"
  ON contract_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_companies
      WHERE user_companies.company_id = contract_versions.company_id
      AND user_companies.user_id = auth.uid()
    )
  );

-- Política para crear contratos
CREATE POLICY "Admins can create contract versions"
  ON contract_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_companies
      WHERE user_companies.company_id = contract_versions.company_id
      AND user_companies.user_id = auth.uid()
      AND user_companies.role IN ('admin', 'manager')
    )
  );

-- Política para actualizar contratos
CREATE POLICY "Admins can update contract versions"
  ON contract_versions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_companies
      WHERE user_companies.company_id = contract_versions.company_id
      AND user_companies.user_id = auth.uid()
      AND user_companies.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_companies
      WHERE user_companies.company_id = contract_versions.company_id
      AND user_companies.user_id = auth.uid()
      AND user_companies.role IN ('admin', 'manager')
    )
  );

-- Política para eliminar contratos
CREATE POLICY "Admins can delete contract versions"
  ON contract_versions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_companies
      WHERE user_companies.company_id = contract_versions.company_id
      AND user_companies.user_id = auth.uid()
      AND user_companies.role = 'admin'
    )
  );