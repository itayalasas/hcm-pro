/*
  # Actualizar tabla employees para usar Foreign Keys a tablas maestras

  ## Cambios

  1. Crear tabla maestra de géneros
  2. Convertir campos de texto a foreign keys:
     - `education_level` → `academic_level_id` (FK a academic_levels)
     - `institution` → `educational_institution_id` (FK a educational_institutions)
     - `field_of_study` → `field_of_study_id` (FK a fields_of_study)
     - `employment_type` → `employment_type_id` (FK a employment_types)
     - `gender` → `gender_id` (FK a genders)
  3. Agregar campo `created_by` para rastrear quién creó el empleado
  4. Mantener campos de texto legacy temporalmente para migración

  ## Seguridad
  - RLS habilitado en tabla genders
*/

-- Crear tabla de géneros
CREATE TABLE IF NOT EXISTS genders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, code)
);

CREATE INDEX IF NOT EXISTS idx_genders_company ON genders(company_id);
CREATE INDEX IF NOT EXISTS idx_genders_active ON genders(company_id, active);

ALTER TABLE genders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view genders for their company"
  ON genders FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert genders for their company"
  ON genders FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update genders for their company"
  ON genders FOR UPDATE
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

CREATE POLICY "Users can delete genders for their company"
  ON genders FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

-- Agregar nuevas columnas FK a employees
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'academic_level_id') THEN
    ALTER TABLE employees ADD COLUMN academic_level_id uuid REFERENCES academic_levels(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'educational_institution_id') THEN
    ALTER TABLE employees ADD COLUMN educational_institution_id uuid REFERENCES educational_institutions(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'field_of_study_id') THEN
    ALTER TABLE employees ADD COLUMN field_of_study_id uuid REFERENCES fields_of_study(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'employment_type_id') THEN
    ALTER TABLE employees ADD COLUMN employment_type_id uuid REFERENCES employment_types(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'gender_id') THEN
    ALTER TABLE employees ADD COLUMN gender_id uuid REFERENCES genders(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'created_by') THEN
    ALTER TABLE employees ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'updated_by') THEN
    ALTER TABLE employees ADD COLUMN updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Crear índices para las nuevas FK
CREATE INDEX IF NOT EXISTS idx_employees_academic_level ON employees(academic_level_id);
CREATE INDEX IF NOT EXISTS idx_employees_educational_institution ON employees(educational_institution_id);
CREATE INDEX IF NOT EXISTS idx_employees_field_of_study ON employees(field_of_study_id);
CREATE INDEX IF NOT EXISTS idx_employees_employment_type ON employees(employment_type_id);
CREATE INDEX IF NOT EXISTS idx_employees_gender ON employees(gender_id);
CREATE INDEX IF NOT EXISTS idx_employees_created_by ON employees(created_by);

-- Insertar géneros base para cada empresa
INSERT INTO genders (company_id, code, name)
SELECT DISTINCT c.id, 'M', 'Masculino'
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM genders g 
  WHERE g.company_id = c.id AND g.code = 'M'
);

INSERT INTO genders (company_id, code, name)
SELECT DISTINCT c.id, 'F', 'Femenino'
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM genders g 
  WHERE g.company_id = c.id AND g.code = 'F'
);

INSERT INTO genders (company_id, code, name)
SELECT DISTINCT c.id, 'O', 'Otro'
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM genders g 
  WHERE g.company_id = c.id AND g.code = 'O'
);

INSERT INTO genders (company_id, code, name)
SELECT DISTINCT c.id, 'NB', 'No Binario'
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM genders g 
  WHERE g.company_id = c.id AND g.code = 'NB'
);

INSERT INTO genders (company_id, code, name)
SELECT DISTINCT c.id, 'X', 'Prefiero no decir'
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM genders g 
  WHERE g.company_id = c.id AND g.code = 'X'
);