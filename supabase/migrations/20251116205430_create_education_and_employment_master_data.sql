/*
  # Create Education and Employment Master Data Tables

  ## Overview
  Creates catalog tables for education and employment-related master data.

  ## New Tables

  ### 1. `academic_levels` - Niveles Académicos
    - `id` (uuid, primary key)
    - `company_id` (uuid, foreign key)
    - `name` (text) - e.g., "Preparatoria", "Licenciatura", "Maestría"
    - `description` (text, optional)
    - `active` (boolean)
    - `created_at`, `updated_at` (timestamptz)

  ### 2. `educational_institutions` - Instituciones Educativas
    - `id` (uuid, primary key)
    - `company_id` (uuid, foreign key)
    - `name` (text) - e.g., "Universidad Nacional"
    - `country` (text, optional)
    - `active` (boolean)
    - `created_at`, `updated_at` (timestamptz)

  ### 3. `fields_of_study` - Campos de Estudio
    - `id` (uuid, primary key)
    - `company_id` (uuid, foreign key)
    - `name` (text) - e.g., "Ingeniería en Sistemas"
    - `description` (text, optional)
    - `active` (boolean)
    - `created_at`, `updated_at` (timestamptz)

  ### 4. `employment_types` - Tipos de Empleo
    - `id` (uuid, primary key)
    - `company_id` (uuid, foreign key)
    - `name` (text) - e.g., "Tiempo Completo", "Medio Tiempo"
    - `description` (text, optional)
    - `active` (boolean)
    - `created_at`, `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access data for their company
  - Policies for SELECT, INSERT, UPDATE, DELETE
*/

-- Academic Levels Table
CREATE TABLE IF NOT EXISTS academic_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_academic_levels_company ON academic_levels(company_id);
CREATE INDEX IF NOT EXISTS idx_academic_levels_active ON academic_levels(company_id, active);

ALTER TABLE academic_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view academic levels for their company"
  ON academic_levels FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert academic levels for their company"
  ON academic_levels FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update academic levels for their company"
  ON academic_levels FOR UPDATE
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

CREATE POLICY "Users can delete academic levels for their company"
  ON academic_levels FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

-- Educational Institutions Table
CREATE TABLE IF NOT EXISTS educational_institutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  country text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_educational_institutions_company ON educational_institutions(company_id);
CREATE INDEX IF NOT EXISTS idx_educational_institutions_active ON educational_institutions(company_id, active);

ALTER TABLE educational_institutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view institutions for their company"
  ON educational_institutions FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert institutions for their company"
  ON educational_institutions FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update institutions for their company"
  ON educational_institutions FOR UPDATE
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

CREATE POLICY "Users can delete institutions for their company"
  ON educational_institutions FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

-- Fields of Study Table
CREATE TABLE IF NOT EXISTS fields_of_study (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fields_of_study_company ON fields_of_study(company_id);
CREATE INDEX IF NOT EXISTS idx_fields_of_study_active ON fields_of_study(company_id, active);

ALTER TABLE fields_of_study ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view fields of study for their company"
  ON fields_of_study FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert fields of study for their company"
  ON fields_of_study FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update fields of study for their company"
  ON fields_of_study FOR UPDATE
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

CREATE POLICY "Users can delete fields of study for their company"
  ON fields_of_study FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

-- Employment Types Table
CREATE TABLE IF NOT EXISTS employment_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employment_types_company ON employment_types(company_id);
CREATE INDEX IF NOT EXISTS idx_employment_types_active ON employment_types(company_id, active);

ALTER TABLE employment_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view employment types for their company"
  ON employment_types FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert employment types for their company"
  ON employment_types FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update employment types for their company"
  ON employment_types FOR UPDATE
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

CREATE POLICY "Users can delete employment types for their company"
  ON employment_types FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );