/*
  # Tabla de Configuración de Códigos Automáticos

  ## Descripción
  Esta migración crea una tabla para configurar la estructura de códigos automáticos
  para diferentes entidades del sistema (empresas, empleados, departamentos, etc.)

  ## Nuevas Tablas
  - `code_configurations`
    - `id` (uuid, primary key)
    - `company_id` (uuid, nullable) - Si es null, aplica a todas las empresas
    - `entity_type` (text) - Tipo de entidad: 'company', 'employee', 'department', 'position', etc.
    - `prefix` (text) - Prefijo del código (ej: "EMP", "DEPT", "COM")
    - `use_year` (boolean) - Si incluye año (ej: 2025)
    - `use_month` (boolean) - Si incluye mes (ej: 01)
    - `sequence_length` (integer) - Longitud de la secuencia numérica (ej: 4 para 0001)
    - `separator` (text) - Separador entre partes (ej: "-", "_", "")
    - `sample` (text) - Ejemplo del código generado
    - `current_sequence` (integer) - Número de secuencia actual
    - `active` (boolean) - Si la configuración está activa
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
    - `created_by` (uuid)

  ## Seguridad
  - Habilita RLS
  - Las políticas permiten a usuarios autenticados ver y gestionar configuraciones de sus empresas
*/

-- Crear tabla de configuración de códigos
CREATE TABLE IF NOT EXISTS code_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id),
  entity_type text NOT NULL,
  prefix text NOT NULL DEFAULT '',
  use_year boolean DEFAULT false,
  use_month boolean DEFAULT false,
  sequence_length integer DEFAULT 4 CHECK (sequence_length >= 1 AND sequence_length <= 10),
  separator text DEFAULT '-',
  sample text,
  current_sequence integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid,
  UNIQUE(company_id, entity_type, active)
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_code_configurations_company ON code_configurations(company_id);
CREATE INDEX IF NOT EXISTS idx_code_configurations_entity ON code_configurations(entity_type);
CREATE INDEX IF NOT EXISTS idx_code_configurations_active ON code_configurations(active);

-- Habilitar RLS
ALTER TABLE code_configurations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view code configurations of their companies"
  ON code_configurations
  FOR SELECT
  TO authenticated
  USING (
    company_id IS NULL OR
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid() AND active = true
    )
  );

CREATE POLICY "Users can insert code configurations for their companies"
  ON code_configurations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IS NULL OR
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid() AND active = true
    )
  );

CREATE POLICY "Users can update code configurations of their companies"
  ON code_configurations
  FOR UPDATE
  TO authenticated
  USING (
    company_id IS NULL OR
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid() AND active = true
    )
  )
  WITH CHECK (
    company_id IS NULL OR
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid() AND active = true
    )
  );

CREATE POLICY "Users can delete code configurations of their companies"
  ON code_configurations
  FOR DELETE
  TO authenticated
  USING (
    company_id IS NULL OR
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid() AND active = true
    )
  );

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_code_configurations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS code_configurations_updated_at ON code_configurations;
CREATE TRIGGER code_configurations_updated_at
  BEFORE UPDATE ON code_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_code_configurations_updated_at();

-- Insertar configuraciones por defecto para las entidades principales
INSERT INTO code_configurations (entity_type, prefix, use_year, use_month, sequence_length, separator, sample, company_id) VALUES
  ('company', 'EMP', false, false, 3, '', 'EMP001', NULL),
  ('employee', 'EMP', false, false, 4, '-', 'EMP-0001', NULL),
  ('department', 'DEPT', false, false, 3, '-', 'DEPT-001', NULL),
  ('position', 'POS', false, false, 3, '-', 'POS-001', NULL)
ON CONFLICT DO NOTHING;
