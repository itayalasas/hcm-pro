/*
  # Create Learning Module Tables

  ## New Tables

  1. **courses**
    - `id` (uuid, primary key)
    - `company_id` (uuid, foreign key to companies)
    - `code` (text) - Código único del curso
    - `title` (text) - Título del curso
    - `description` (text) - Descripción detallada
    - `category` (text) - Categoría (Técnico, Liderazgo, Compliance, etc.)
    - `type` (text) - Tipo (Presencial, Virtual, E-learning, Híbrido)
    - `duration_hours` (numeric) - Duración en horas
    - `instructor` (text) - Nombre del instructor
    - `provider` (text) - Proveedor del curso
    - `max_participants` (integer) - Capacidad máxima
    - `cost` (numeric) - Costo del curso
    - `currency_id` (uuid, foreign key to currencies)
    - `status` (text) - Estado (Planificado, En curso, Completado, Cancelado)
    - `start_date` (date) - Fecha de inicio
    - `end_date` (date) - Fecha de finalización
    - `location` (text) - Ubicación (si es presencial)
    - `url` (text) - URL (si es virtual)
    - `objectives` (text) - Objetivos del curso
    - `prerequisites` (text) - Prerrequisitos
    - `active` (boolean)
    - `created_at` (timestamptz)
    - `created_by` (uuid)
    - `updated_at` (timestamptz)

  2. **course_enrollments**
    - `id` (uuid, primary key)
    - `company_id` (uuid, foreign key to companies)
    - `course_id` (uuid, foreign key to courses)
    - `employee_id` (uuid, foreign key to employees)
    - `enrollment_date` (date) - Fecha de inscripción
    - `status` (text) - Estado (Inscrito, En progreso, Completado, Cancelado, No asistió)
    - `completion_date` (date) - Fecha de completación
    - `score` (numeric) - Calificación (0-100)
    - `attendance_percentage` (numeric) - Porcentaje de asistencia
    - `passed` (boolean) - Si aprobó o no
    - `certificate_issued` (boolean) - Si se emitió certificado
    - `certificate_number` (text) - Número de certificado
    - `comments` (text) - Comentarios
    - `created_at` (timestamptz)
    - `created_by` (uuid)
    - `updated_at` (timestamptz)

  3. **certifications**
    - `id` (uuid, primary key)
    - `company_id` (uuid, foreign key to companies)
    - `employee_id` (uuid, foreign key to employees)
    - `code` (text) - Código de certificación
    - `name` (text) - Nombre de la certificación
    - `issuing_organization` (text) - Organización emisora
    - `issue_date` (date) - Fecha de emisión
    - `expiry_date` (date) - Fecha de vencimiento
    - `credential_id` (text) - ID de credencial
    - `credential_url` (text) - URL de verificación
    - `category` (text) - Categoría
    - `status` (text) - Estado (Vigente, Vencida, En renovación)
    - `cost` (numeric) - Costo
    - `currency_id` (uuid, foreign key to currencies)
    - `notes` (text) - Notas adicionales
    - `document_path` (text) - Ruta al documento en storage
    - `active` (boolean)
    - `created_at` (timestamptz)
    - `created_by` (uuid)
    - `updated_at` (timestamptz)

  4. **skills**
    - `id` (uuid, primary key)
    - `company_id` (uuid, foreign key to companies)
    - `code` (text) - Código de habilidad
    - `name` (text) - Nombre de la habilidad
    - `description` (text) - Descripción
    - `category` (text) - Categoría (Técnica, Blanda, Idiomas, etc.)
    - `level_1_description` (text) - Descripción nivel básico
    - `level_2_description` (text) - Descripción nivel intermedio
    - `level_3_description` (text) - Descripción nivel avanzado
    - `level_4_description` (text) - Descripción nivel experto
    - `active` (boolean)
    - `created_at` (timestamptz)
    - `created_by` (uuid)
    - `updated_at` (timestamptz)

  5. **employee_skills**
    - `id` (uuid, primary key)
    - `company_id` (uuid, foreign key to companies)
    - `employee_id` (uuid, foreign key to employees)
    - `skill_id` (uuid, foreign key to skills)
    - `current_level` (integer) - Nivel actual (1-4)
    - `target_level` (integer) - Nivel objetivo (1-4)
    - `assessment_date` (date) - Fecha de evaluación
    - `assessed_by` (uuid) - Evaluado por (user_id)
    - `comments` (text) - Comentarios
    - `created_at` (timestamptz)
    - `created_by` (uuid)
    - `updated_at` (timestamptz)

  ## Security
    - Enable RLS on all tables
    - Add policies for company-based access control
*/

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code text NOT NULL,
  title text NOT NULL,
  description text,
  category text,
  type text NOT NULL DEFAULT 'E-learning',
  duration_hours numeric,
  instructor text,
  provider text,
  max_participants integer,
  cost numeric DEFAULT 0,
  currency_id uuid REFERENCES currencies(id),
  status text NOT NULL DEFAULT 'Planificado',
  start_date date,
  end_date date,
  location text,
  url text,
  objectives text,
  prerequisites text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, code)
);

-- Create course_enrollments table
CREATE TABLE IF NOT EXISTS course_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  enrollment_date date DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'Inscrito',
  completion_date date,
  score numeric,
  attendance_percentage numeric,
  passed boolean DEFAULT false,
  certificate_issued boolean DEFAULT false,
  certificate_number text,
  comments text,
  created_at timestamptz DEFAULT now(),
  created_by uuid,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, course_id, employee_id)
);

-- Create certifications table
CREATE TABLE IF NOT EXISTS certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  code text,
  name text NOT NULL,
  issuing_organization text NOT NULL,
  issue_date date NOT NULL,
  expiry_date date,
  credential_id text,
  credential_url text,
  category text,
  status text NOT NULL DEFAULT 'Vigente',
  cost numeric DEFAULT 0,
  currency_id uuid REFERENCES currencies(id),
  notes text,
  document_path text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid,
  updated_at timestamptz DEFAULT now()
);

-- Create skills table
CREATE TABLE IF NOT EXISTS skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'Técnica',
  level_1_description text DEFAULT 'Conocimiento básico',
  level_2_description text DEFAULT 'Conocimiento intermedio',
  level_3_description text DEFAULT 'Conocimiento avanzado',
  level_4_description text DEFAULT 'Experto',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, code)
);

-- Create employee_skills table
CREATE TABLE IF NOT EXISTS employee_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  current_level integer NOT NULL CHECK (current_level >= 1 AND current_level <= 4),
  target_level integer CHECK (target_level >= 1 AND target_level <= 4),
  assessment_date date DEFAULT CURRENT_DATE,
  assessed_by uuid,
  comments text,
  created_at timestamptz DEFAULT now(),
  created_by uuid,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, employee_id, skill_id)
);

-- Enable Row Level Security
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_skills ENABLE ROW LEVEL SECURITY;

-- RLS Policies for courses
CREATE POLICY "Users can view courses in their companies"
  ON courses FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert courses in their companies"
  ON courses FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update courses in their companies"
  ON courses FOR UPDATE
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

CREATE POLICY "Users can delete courses in their companies"
  ON courses FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for course_enrollments
CREATE POLICY "Users can view enrollments in their companies"
  ON course_enrollments FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert enrollments in their companies"
  ON course_enrollments FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update enrollments in their companies"
  ON course_enrollments FOR UPDATE
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

CREATE POLICY "Users can delete enrollments in their companies"
  ON course_enrollments FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for certifications
CREATE POLICY "Users can view certifications in their companies"
  ON certifications FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert certifications in their companies"
  ON certifications FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update certifications in their companies"
  ON certifications FOR UPDATE
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

CREATE POLICY "Users can delete certifications in their companies"
  ON certifications FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for skills
CREATE POLICY "Users can view skills in their companies"
  ON skills FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert skills in their companies"
  ON skills FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update skills in their companies"
  ON skills FOR UPDATE
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

CREATE POLICY "Users can delete skills in their companies"
  ON skills FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for employee_skills
CREATE POLICY "Users can view employee skills in their companies"
  ON employee_skills FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert employee skills in their companies"
  ON employee_skills FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update employee skills in their companies"
  ON employee_skills FOR UPDATE
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

CREATE POLICY "Users can delete employee skills in their companies"
  ON employee_skills FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_company_id ON courses(company_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_company_id ON course_enrollments(company_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_employee_id ON course_enrollments(employee_id);
CREATE INDEX IF NOT EXISTS idx_certifications_company_id ON certifications(company_id);
CREATE INDEX IF NOT EXISTS idx_certifications_employee_id ON certifications(employee_id);
CREATE INDEX IF NOT EXISTS idx_skills_company_id ON skills(company_id);
CREATE INDEX IF NOT EXISTS idx_employee_skills_company_id ON employee_skills(company_id);
CREATE INDEX IF NOT EXISTS idx_employee_skills_employee_id ON employee_skills(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_skills_skill_id ON employee_skills(skill_id);