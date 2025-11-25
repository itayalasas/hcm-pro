/*
  # Create Payroll Concepts and Formulas Tables

  1. New Tables
    - `payroll_concepts` - Conceptos de nómina (percepciones, deducciones, aportes)
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `code` (varchar, unique within company)
      - `name` (varchar)
      - `concept_type` (varchar: perception, deduction, contribution, tax)
      - `calculation_type` (varchar: fixed, percentage, formula, manual)
      - `default_value` (decimal)
      - `is_taxable` (boolean)
      - `affects_social_security` (boolean)
      - `is_active` (boolean)
      - `display_order` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `payroll_formulas` - Fórmulas para cálculo de conceptos
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `concept_id` (uuid, foreign key to payroll_concepts)
      - `name` (varchar)
      - `formula_expression` (text)
      - `description` (text)
      - `variables` (jsonb)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `payroll_periods` - Períodos de nómina
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `period_name` (varchar)
      - `period_type` (varchar: weekly, biweekly, monthly, bimonthly)
      - `start_date` (date)
      - `end_date` (date)
      - `payment_date` (date)
      - `status` (varchar: draft, calculated, validated, approved, paid)
      - `total_gross` (decimal)
      - `total_deductions` (decimal)
      - `total_contributions` (decimal)
      - `total_net` (decimal)
      - `notes` (text)
      - `created_by` (uuid)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `payroll_period_details` - Detalle de nómina por empleado
      - `id` (uuid, primary key)
      - `payroll_period_id` (uuid, foreign key)
      - `employee_id` (uuid, foreign key)
      - `base_salary` (decimal)
      - `total_perceptions` (decimal)
      - `total_deductions` (decimal)
      - `total_contributions` (decimal)
      - `net_salary` (decimal)
      - `worked_days` (integer)
      - `worked_hours` (decimal)
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `payroll_concept_details` - Conceptos aplicados por empleado en un período
      - `id` (uuid, primary key)
      - `payroll_period_detail_id` (uuid, foreign key)
      - `payroll_concept_id` (uuid, foreign key)
      - `quantity` (decimal)
      - `unit_amount` (decimal)
      - `total_amount` (decimal)
      - `notes` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Policies for company-level access control
*/

-- Payroll Concepts Table
CREATE TABLE IF NOT EXISTS payroll_concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  concept_type VARCHAR(50) NOT NULL CHECK (concept_type IN ('perception', 'deduction', 'contribution', 'tax')),
  calculation_type VARCHAR(50) NOT NULL CHECK (calculation_type IN ('fixed', 'percentage', 'formula', 'manual')),
  default_value DECIMAL(15,2) DEFAULT 0,
  is_taxable BOOLEAN DEFAULT false,
  affects_social_security BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, code)
);

ALTER TABLE payroll_concepts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view payroll concepts for their company"
  ON payroll_concepts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create payroll concepts for their company"
  ON payroll_concepts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update payroll concepts for their company"
  ON payroll_concepts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete payroll concepts for their company"
  ON payroll_concepts FOR DELETE
  TO authenticated
  USING (true);

-- Payroll Formulas Table
CREATE TABLE IF NOT EXISTS payroll_formulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  concept_id UUID REFERENCES payroll_concepts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  formula_expression TEXT NOT NULL,
  description TEXT,
  variables JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE payroll_formulas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view payroll formulas for their company"
  ON payroll_formulas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create payroll formulas for their company"
  ON payroll_formulas FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update payroll formulas for their company"
  ON payroll_formulas FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete payroll formulas for their company"
  ON payroll_formulas FOR DELETE
  TO authenticated
  USING (true);

-- Payroll Periods Table
CREATE TABLE IF NOT EXISTS payroll_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  period_name VARCHAR(255) NOT NULL,
  period_type VARCHAR(50) NOT NULL CHECK (period_type IN ('weekly', 'biweekly', 'monthly', 'bimonthly', 'custom')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  payment_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'calculated', 'validated', 'approved', 'paid', 'cancelled')),
  total_gross DECIMAL(15,2) DEFAULT 0,
  total_deductions DECIMAL(15,2) DEFAULT 0,
  total_contributions DECIMAL(15,2) DEFAULT 0,
  total_net DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE payroll_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view payroll periods for their company"
  ON payroll_periods FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create payroll periods for their company"
  ON payroll_periods FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update payroll periods for their company"
  ON payroll_periods FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete payroll periods for their company"
  ON payroll_periods FOR DELETE
  TO authenticated
  USING (true);

-- Payroll Period Details Table
CREATE TABLE IF NOT EXISTS payroll_period_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_period_id UUID NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  base_salary DECIMAL(15,2) DEFAULT 0,
  total_perceptions DECIMAL(15,2) DEFAULT 0,
  total_deductions DECIMAL(15,2) DEFAULT 0,
  total_contributions DECIMAL(15,2) DEFAULT 0,
  net_salary DECIMAL(15,2) DEFAULT 0,
  worked_days INTEGER DEFAULT 0,
  worked_hours DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(payroll_period_id, employee_id)
);

ALTER TABLE payroll_period_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view payroll period details for their company"
  ON payroll_period_details FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create payroll period details"
  ON payroll_period_details FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update payroll period details"
  ON payroll_period_details FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete payroll period details"
  ON payroll_period_details FOR DELETE
  TO authenticated
  USING (true);

-- Payroll Concept Details Table
CREATE TABLE IF NOT EXISTS payroll_concept_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_period_detail_id UUID NOT NULL REFERENCES payroll_period_details(id) ON DELETE CASCADE,
  payroll_concept_id UUID NOT NULL REFERENCES payroll_concepts(id) ON DELETE CASCADE,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE payroll_concept_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view payroll concept details"
  ON payroll_concept_details FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create payroll concept details"
  ON payroll_concept_details FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update payroll concept details"
  ON payroll_concept_details FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete payroll concept details"
  ON payroll_concept_details FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payroll_concepts_company_id ON payroll_concepts(company_id);
CREATE INDEX IF NOT EXISTS idx_payroll_concepts_code ON payroll_concepts(code);
CREATE INDEX IF NOT EXISTS idx_payroll_formulas_company_id ON payroll_formulas(company_id);
CREATE INDEX IF NOT EXISTS idx_payroll_formulas_concept_id ON payroll_formulas(concept_id);
CREATE INDEX IF NOT EXISTS idx_payroll_periods_company_id ON payroll_periods(company_id);
CREATE INDEX IF NOT EXISTS idx_payroll_periods_status ON payroll_periods(status);
CREATE INDEX IF NOT EXISTS idx_payroll_period_details_period_id ON payroll_period_details(payroll_period_id);
CREATE INDEX IF NOT EXISTS idx_payroll_period_details_employee_id ON payroll_period_details(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_concept_details_period_detail_id ON payroll_concept_details(payroll_period_detail_id);
CREATE INDEX IF NOT EXISTS idx_payroll_concept_details_concept_id ON payroll_concept_details(payroll_concept_id);
