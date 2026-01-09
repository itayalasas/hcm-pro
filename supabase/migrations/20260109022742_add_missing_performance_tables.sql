/*
  # Agregar tablas faltantes del módulo de Desempeño

  ## Descripción
  Agrega las tablas que faltan para completar el módulo de desempeño:
  - evaluation_templates (Plantillas de evaluación)
  - evaluation_competencies (Competencias)
  - evaluation_scores (Calificaciones por competencia)
  - development_plans (Planes de Desarrollo Individual)
  - development_plan_objectives (Objetivos de PDI)
  - nine_box_assessments (Evaluaciones Matriz 9-Box)
*/

-- Tabla: evaluation_templates
CREATE TABLE IF NOT EXISTS evaluation_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla: evaluation_competencies
CREATE TABLE IF NOT EXISTS evaluation_competencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES evaluation_templates(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  weight decimal(5,2) DEFAULT 0 CHECK (weight >= 0 AND weight <= 100),
  sort_order integer NOT NULL DEFAULT 0
);

-- Tabla: evaluation_scores
CREATE TABLE IF NOT EXISTS evaluation_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  competency_id uuid NOT NULL REFERENCES evaluation_competencies(id) ON DELETE CASCADE,
  self_score decimal(5,2) CHECK (self_score >= 0 AND self_score <= 5),
  self_comments text,
  manager_score decimal(5,2) CHECK (manager_score >= 0 AND manager_score <= 5),
  manager_comments text,
  final_score decimal(5,2) CHECK (final_score >= 0 AND final_score <= 5)
);

-- Tabla: development_plans
CREATE TABLE IF NOT EXISTS development_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  start_date date,
  target_date date,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla: development_plan_objectives
CREATE TABLE IF NOT EXISTS development_plan_objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES development_plans(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  success_criteria text,
  target_date date,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  sort_order integer NOT NULL DEFAULT 0
);

-- Tabla: nine_box_assessments
CREATE TABLE IF NOT EXISTS nine_box_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  assessment_date date NOT NULL DEFAULT CURRENT_DATE,
  performance_rating integer NOT NULL CHECK (performance_rating >= 1 AND performance_rating <= 3),
  potential_rating integer NOT NULL CHECK (potential_rating >= 1 AND potential_rating <= 3),
  box_position text,
  succession_readiness text CHECK (succession_readiness IN ('ready_now', '1-2_years', '3-5_years', 'not_ready')),
  comments text,
  assessor_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_evaluation_templates_company ON evaluation_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_competencies_template ON evaluation_competencies(template_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_scores_evaluation ON evaluation_scores(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_development_plans_company ON development_plans(company_id);
CREATE INDEX IF NOT EXISTS idx_development_plans_employee ON development_plans(employee_id);
CREATE INDEX IF NOT EXISTS idx_development_plans_status ON development_plans(company_id, status);
CREATE INDEX IF NOT EXISTS idx_development_plan_objectives_plan ON development_plan_objectives(plan_id);
CREATE INDEX IF NOT EXISTS idx_nine_box_assessments_company ON nine_box_assessments(company_id);
CREATE INDEX IF NOT EXISTS idx_nine_box_assessments_employee ON nine_box_assessments(employee_id);

-- RLS
ALTER TABLE evaluation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE development_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE development_plan_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE nine_box_assessments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (evaluation_templates)
CREATE POLICY "Users can view evaluation templates of their company"
  ON evaluation_templates FOR SELECT
  TO authenticated
  USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert evaluation templates for their company"
  ON evaluation_templates FOR INSERT
  TO authenticated
  WITH CHECK (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can update evaluation templates of their company"
  ON evaluation_templates FOR UPDATE
  TO authenticated
  USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete evaluation templates of their company"
  ON evaluation_templates FOR DELETE
  TO authenticated
  USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

-- Políticas RLS (evaluation_competencies)
CREATE POLICY "Users can view competencies of their company templates"
  ON evaluation_competencies FOR SELECT
  TO authenticated
  USING (
    template_id IN (
      SELECT id FROM evaluation_templates 
      WHERE company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert competencies for their company templates"
  ON evaluation_competencies FOR INSERT
  TO authenticated
  WITH CHECK (
    template_id IN (
      SELECT id FROM evaluation_templates 
      WHERE company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can update competencies of their company templates"
  ON evaluation_competencies FOR UPDATE
  TO authenticated
  USING (
    template_id IN (
      SELECT id FROM evaluation_templates 
      WHERE company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    template_id IN (
      SELECT id FROM evaluation_templates 
      WHERE company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can delete competencies of their company templates"
  ON evaluation_competencies FOR DELETE
  TO authenticated
  USING (
    template_id IN (
      SELECT id FROM evaluation_templates 
      WHERE company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
    )
  );

-- Políticas RLS (evaluation_scores)
CREATE POLICY "Users can view scores of their company evaluations"
  ON evaluation_scores FOR SELECT
  TO authenticated
  USING (
    evaluation_id IN (
      SELECT id FROM evaluations 
      WHERE company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert scores for their company evaluations"
  ON evaluation_scores FOR INSERT
  TO authenticated
  WITH CHECK (
    evaluation_id IN (
      SELECT id FROM evaluations 
      WHERE company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can update scores of their company evaluations"
  ON evaluation_scores FOR UPDATE
  TO authenticated
  USING (
    evaluation_id IN (
      SELECT id FROM evaluations 
      WHERE company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    evaluation_id IN (
      SELECT id FROM evaluations 
      WHERE company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can delete scores of their company evaluations"
  ON evaluation_scores FOR DELETE
  TO authenticated
  USING (
    evaluation_id IN (
      SELECT id FROM evaluations 
      WHERE company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
    )
  );

-- Políticas RLS (development_plans)
CREATE POLICY "Users can view development plans of their company"
  ON development_plans FOR SELECT
  TO authenticated
  USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert development plans for their company"
  ON development_plans FOR INSERT
  TO authenticated
  WITH CHECK (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can update development plans of their company"
  ON development_plans FOR UPDATE
  TO authenticated
  USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete development plans of their company"
  ON development_plans FOR DELETE
  TO authenticated
  USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

-- Políticas RLS (development_plan_objectives)
CREATE POLICY "Users can view objectives of their company development plans"
  ON development_plan_objectives FOR SELECT
  TO authenticated
  USING (
    plan_id IN (
      SELECT id FROM development_plans 
      WHERE company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert objectives for their company development plans"
  ON development_plan_objectives FOR INSERT
  TO authenticated
  WITH CHECK (
    plan_id IN (
      SELECT id FROM development_plans 
      WHERE company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can update objectives of their company development plans"
  ON development_plan_objectives FOR UPDATE
  TO authenticated
  USING (
    plan_id IN (
      SELECT id FROM development_plans 
      WHERE company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    plan_id IN (
      SELECT id FROM development_plans 
      WHERE company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can delete objectives of their company development plans"
  ON development_plan_objectives FOR DELETE
  TO authenticated
  USING (
    plan_id IN (
      SELECT id FROM development_plans 
      WHERE company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
    )
  );

-- Políticas RLS (nine_box_assessments)
CREATE POLICY "Users can view nine box assessments of their company"
  ON nine_box_assessments FOR SELECT
  TO authenticated
  USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert nine box assessments for their company"
  ON nine_box_assessments FOR INSERT
  TO authenticated
  WITH CHECK (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can update nine box assessments of their company"
  ON nine_box_assessments FOR UPDATE
  TO authenticated
  USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete nine box assessments of their company"
  ON nine_box_assessments FOR DELETE
  TO authenticated
  USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));
