/*
  # Sistema de Configuración y Datos Maestros
  
  ## Overview
  Sistema completo de configuración a nivel de empresa para gestión de datos maestros,
  flujos de trabajo, campos personalizados y parámetros del sistema.
  
  ## New Tables Created
  
  ### 1. Workflows (Flujos de Trabajo)
    - `workflows` - Definición de flujos de trabajo
      - `id` (uuid, primary key)
      - `company_id` (uuid, references companies)
      - `name` (text) - Nombre del flujo
      - `code` (text) - Código único
      - `entity_type` (text) - Tipo de entidad (leave_request, employee, etc.)
      - `description` (text)
      - `is_active` (boolean)
      - `steps` (jsonb) - Pasos del workflow
      - `created_at` (timestamptz)
  
  ### 2. Custom Fields (Campos Personalizados)
    - `custom_fields` - Definición de campos personalizados
      - `id` (uuid, primary key)
      - `company_id` (uuid, references companies)
      - `entity_type` (text) - A qué entidad aplica
      - `field_name` (text) - Nombre del campo
      - `field_label` (text) - Etiqueta para mostrar
      - `field_type` (text) - text, number, date, select, etc.
      - `field_options` (jsonb) - Opciones para select/radio
      - `is_required` (boolean)
      - `default_value` (text)
      - `display_order` (integer)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
    
    - `custom_field_values` - Valores de campos personalizados
      - `id` (uuid, primary key)
      - `custom_field_id` (uuid, references custom_fields)
      - `entity_id` (uuid) - ID de la entidad
      - `entity_type` (text)
      - `field_value` (text)
      - `created_at` (timestamptz)
  
  ### 3. Job Titles/Positions Enhancement
    - Mejorar tabla positions existente
  
  ### 4. System Parameters
    - `system_parameters` - Parámetros del sistema por empresa
      - `id` (uuid, primary key)
      - `company_id` (uuid, references companies)
      - `parameter_key` (text) - Clave del parámetro
      - `parameter_value` (jsonb) - Valor del parámetro
      - `parameter_type` (text) - Tipo de parámetro
      - `category` (text) - Categoría
      - `description` (text)
      - `created_at` (timestamptz)
  
  ## Security
  - RLS enabled on all tables
  - Admin-only access for configuration
  - Company-level isolation
*/

-- Workflows Table
CREATE TABLE IF NOT EXISTS workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  code text NOT NULL,
  entity_type text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  steps jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(company_id, code)
);

CREATE INDEX IF NOT EXISTS idx_workflows_company ON workflows(company_id);
CREATE INDEX IF NOT EXISTS idx_workflows_entity ON workflows(company_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_workflows_active ON workflows(company_id, is_active);

-- Custom Fields Table
CREATE TABLE IF NOT EXISTS custom_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  entity_type text NOT NULL,
  field_name text NOT NULL,
  field_label text NOT NULL,
  field_type text NOT NULL,
  field_options jsonb DEFAULT '[]',
  is_required boolean DEFAULT false,
  default_value text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  validation_rules jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(company_id, entity_type, field_name)
);

CREATE INDEX IF NOT EXISTS idx_custom_fields_company ON custom_fields(company_id);
CREATE INDEX IF NOT EXISTS idx_custom_fields_entity ON custom_fields(company_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_custom_fields_active ON custom_fields(company_id, is_active);

-- Custom Field Values Table
CREATE TABLE IF NOT EXISTS custom_field_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_field_id uuid REFERENCES custom_fields(id) ON DELETE CASCADE NOT NULL,
  entity_id uuid NOT NULL,
  entity_type text NOT NULL,
  field_value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(custom_field_id, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_custom_field_values_field ON custom_field_values(custom_field_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_entity ON custom_field_values(entity_id, entity_type);

-- System Parameters Table
CREATE TABLE IF NOT EXISTS system_parameters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  parameter_key text NOT NULL,
  parameter_value jsonb NOT NULL,
  parameter_type text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  description text,
  is_editable boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, parameter_key)
);

CREATE INDEX IF NOT EXISTS idx_system_parameters_company ON system_parameters(company_id);
CREATE INDEX IF NOT EXISTS idx_system_parameters_category ON system_parameters(company_id, category);

-- Enhance positions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'positions' AND column_name = 'department_id'
  ) THEN
    ALTER TABLE positions ADD COLUMN department_id uuid REFERENCES departments(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'positions' AND column_name = 'reports_to_position_id'
  ) THEN
    ALTER TABLE positions ADD COLUMN reports_to_position_id uuid REFERENCES positions(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'positions' AND column_name = 'job_family'
  ) THEN
    ALTER TABLE positions ADD COLUMN job_family text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'positions' AND column_name = 'job_level'
  ) THEN
    ALTER TABLE positions ADD COLUMN job_level text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'positions' AND column_name = 'requirements'
  ) THEN
    ALTER TABLE positions ADD COLUMN requirements text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'positions' AND column_name = 'responsibilities'
  ) THEN
    ALTER TABLE positions ADD COLUMN responsibilities text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'positions' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE positions ADD COLUMN created_by uuid REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'positions' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE positions ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_positions_department ON positions(department_id);
CREATE INDEX IF NOT EXISTS idx_positions_reports_to ON positions(reports_to_position_id);

-- Enable RLS
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_parameters ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Workflows
CREATE POLICY "Users can view workflows of their companies"
  ON workflows FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_companies
      WHERE user_companies.company_id = workflows.company_id
      AND user_companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage workflows"
  ON workflows FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_companies
      WHERE user_companies.company_id = workflows.company_id
      AND user_companies.user_id = auth.uid()
      AND user_companies.role = 'admin'
    )
  );

-- RLS Policies for Custom Fields
CREATE POLICY "Users can view custom fields of their companies"
  ON custom_fields FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_companies
      WHERE user_companies.company_id = custom_fields.company_id
      AND user_companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage custom fields"
  ON custom_fields FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_companies
      WHERE user_companies.company_id = custom_fields.company_id
      AND user_companies.user_id = auth.uid()
      AND user_companies.role = 'admin'
    )
  );

-- RLS Policies for Custom Field Values
CREATE POLICY "Users can view custom field values of their company"
  ON custom_field_values FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM custom_fields cf
      INNER JOIN user_companies uc ON uc.company_id = cf.company_id
      WHERE cf.id = custom_field_values.custom_field_id
      AND uc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage custom field values"
  ON custom_field_values FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM custom_fields cf
      INNER JOIN user_companies uc ON uc.company_id = cf.company_id
      WHERE cf.id = custom_field_values.custom_field_id
      AND uc.user_id = auth.uid()
    )
  );

-- RLS Policies for System Parameters
CREATE POLICY "Users can view system parameters of their companies"
  ON system_parameters FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_companies
      WHERE user_companies.company_id = system_parameters.company_id
      AND user_companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage system parameters"
  ON system_parameters FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_companies
      WHERE user_companies.company_id = system_parameters.company_id
      AND user_companies.user_id = auth.uid()
      AND user_companies.role = 'admin'
    )
  );

-- Insert default system parameters for existing companies
INSERT INTO system_parameters (company_id, parameter_key, parameter_value, parameter_type, category, description)
SELECT 
  c.id,
  'working_hours_per_day',
  '8'::jsonb,
  'number',
  'time',
  'Horas laborales por día'
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM system_parameters sp
  WHERE sp.company_id = c.id AND sp.parameter_key = 'working_hours_per_day'
);

INSERT INTO system_parameters (company_id, parameter_key, parameter_value, parameter_type, category, description)
SELECT 
  c.id,
  'working_days_per_week',
  '5'::jsonb,
  'number',
  'time',
  'Días laborales por semana'
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM system_parameters sp
  WHERE sp.company_id = c.id AND sp.parameter_key = 'working_days_per_week'
);

INSERT INTO system_parameters (company_id, parameter_key, parameter_value, parameter_type, category, description)
SELECT 
  c.id,
  'annual_vacation_days',
  '15'::jsonb,
  'number',
  'leave',
  'Días de vacaciones anuales'
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM system_parameters sp
  WHERE sp.company_id = c.id AND sp.parameter_key = 'annual_vacation_days'
);
