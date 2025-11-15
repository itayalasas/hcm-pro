/*
  # Completar Nomencladores y Actualizar Empleados
  
  1. Nuevas Tablas
    - `work_locations` - Ubicaciones de trabajo
    - `company_settings` - Configuración por empresa
    
  2. Modificaciones
    - Actualizar tabla employees con referencias a nomencladores
*/

-- Tabla de Ubicaciones de Trabajo
CREATE TABLE IF NOT EXISTS work_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  address text,
  city text,
  state text,
  country text NOT NULL DEFAULT 'México',
  postal_code text,
  timezone text DEFAULT 'America/Mexico_City',
  is_remote boolean DEFAULT false,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(company_id, code)
);

CREATE INDEX IF NOT EXISTS idx_locations_company ON work_locations(company_id);
CREATE INDEX IF NOT EXISTS idx_locations_active ON work_locations(company_id, active);
CREATE INDEX IF NOT EXISTS idx_locations_name ON work_locations(company_id, name);

ALTER TABLE work_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view locations of their companies"
  ON work_locations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_companies
      WHERE user_companies.company_id = work_locations.company_id
      AND user_companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage locations"
  ON work_locations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_companies
      WHERE user_companies.company_id = work_locations.company_id
      AND user_companies.user_id = auth.uid()
      AND user_companies.role IN ('admin', 'manager')
    )
  );

-- Tabla de Configuración de Empresa
CREATE TABLE IF NOT EXISTS company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  setting_key text NOT NULL,
  setting_value jsonb NOT NULL,
  category text NOT NULL DEFAULT 'general',
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, setting_key)
);

CREATE INDEX IF NOT EXISTS idx_settings_company ON company_settings(company_id);
CREATE INDEX IF NOT EXISTS idx_settings_category ON company_settings(company_id, category);

ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view settings of their companies"
  ON company_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_companies
      WHERE user_companies.company_id = company_settings.company_id
      AND user_companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage settings"
  ON company_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_companies
      WHERE user_companies.company_id = company_settings.company_id
      AND user_companies.user_id = auth.uid()
      AND user_companies.role = 'admin'
    )
  );

-- Actualizar tabla employees con campos de nomencladores
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'department_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN department_id uuid REFERENCES departments(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'position_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN position_id uuid REFERENCES positions(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'work_location_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN work_location_id uuid REFERENCES work_locations(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'manager_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN manager_id uuid REFERENCES employees(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'salary'
  ) THEN
    ALTER TABLE employees ADD COLUMN salary numeric(15,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'employment_type'
  ) THEN
    ALTER TABLE employees ADD COLUMN employment_type text DEFAULT 'full-time';
  END IF;
END $$;

-- Agregar índices a employees
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_position ON employees(position_id);
CREATE INDEX IF NOT EXISTS idx_employees_location ON employees(work_location_id);
CREATE INDEX IF NOT EXISTS idx_employees_manager ON employees(manager_id);
