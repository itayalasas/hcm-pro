/*
  # Core HCM System Schema
  
  ## Overview
  Enterprise-grade Human Capital Management system with multi-company, 
  multi-country support and complete employee lifecycle management.
  
  ## New Tables Created
  
  ### 1. Countries & Currencies
    - `countries` - Global country catalog
    - `currencies` - Currency definitions
    
  ### 2. Companies & Organization Structure
    - `companies` - Multi-company support with legal data
    - `business_units` - Divisions/departments/areas hierarchy
    - `cost_centers` - Cost center tracking
    - `positions` - Job positions with salary bands
    - `organizational_chart` - Versioned org chart structure
    
  ### 3. Employee Management
    - `employees` - Core employee data
    - `employee_personal_data` - Personal information
    - `employee_family` - Family/dependents
    - `employee_legal_data` - Documents and permits
    - `employee_contracts` - Contract history
    - `employee_compensation` - Salary and benefits
    - `employee_payroll_data` - Bank and tax info
    - `employee_education` - Academic background
    - `employee_skills` - Skills and competencies
    - `employee_history` - Internal job history
    - `employee_documents` - Document repository
    
  ### 4. Leave Management
    - `leave_types` - Configurable leave types per country
    - `leave_balances` - Employee leave balances
    - `leave_requests` - Time-off requests
    
  ### 5. Performance & Talent
    - `evaluation_models` - Evaluation templates
    - `evaluation_cycles` - Evaluation periods
    - `evaluations` - Individual evaluations
    - `development_plans` - Personal development plans
    
  ### 6. Payroll
    - `payroll_concepts` - Salary concepts catalog
    - `payroll_formulas` - Calculation rules
    - `payroll_periods` - Pay periods
    - `payroll_details` - Individual payslips
    
  ### 7. Documentation
    - `document_categories` - Document classification
    - `company_documents` - Policies and procedures
    - `document_acknowledgments` - Read confirmations
    
  ### 8. Configuration
    - `custom_fields` - Dynamic field definitions
    - `workflow_definitions` - Approval workflows
    - `system_parameters` - Global settings
    
  ## Security
  - RLS enabled on all tables
  - Policies for authenticated users based on role and hierarchy
  - Audit trails on sensitive data changes
*/

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- MASTER DATA: Countries, Currencies, Languages
-- ============================================================================

CREATE TABLE IF NOT EXISTS countries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code varchar(3) UNIQUE NOT NULL,
  name varchar(100) NOT NULL,
  phone_code varchar(10),
  currency_code varchar(3),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS currencies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code varchar(3) UNIQUE NOT NULL,
  name varchar(50) NOT NULL,
  symbol varchar(10),
  decimal_places integer DEFAULT 2,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- COMPANIES & ORGANIZATIONAL STRUCTURE
-- ============================================================================

CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code varchar(20) UNIQUE NOT NULL,
  legal_name varchar(200) NOT NULL,
  trade_name varchar(200),
  tax_id varchar(50) NOT NULL,
  country_id uuid REFERENCES countries(id),
  address text,
  phone varchar(50),
  email varchar(100),
  logo_url text,
  primary_color varchar(7) DEFAULT '#0066CC',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS business_units (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES business_units(id),
  code varchar(20) NOT NULL,
  name varchar(100) NOT NULL,
  type varchar(50) NOT NULL, -- division, department, area, team
  manager_id uuid, -- references employees(id), added later
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, code)
);

CREATE TABLE IF NOT EXISTS cost_centers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  code varchar(20) NOT NULL,
  name varchar(100) NOT NULL,
  description text,
  business_unit_id uuid REFERENCES business_units(id),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, code)
);

CREATE TABLE IF NOT EXISTS positions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  code varchar(20) NOT NULL,
  title varchar(100) NOT NULL,
  description text,
  requirements text,
  responsibilities text,
  salary_band_min numeric(12,2),
  salary_band_max numeric(12,2),
  currency_id uuid REFERENCES currencies(id),
  level varchar(50), -- junior, mid, senior, executive
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, code)
);

CREATE TABLE IF NOT EXISTS organizational_chart (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  version integer NOT NULL,
  effective_date date NOT NULL,
  structure jsonb NOT NULL, -- stores the org chart tree
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, version)
);

-- ============================================================================
-- EMPLOYEE CORE DATA
-- ============================================================================

CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_number varchar(20) UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) UNIQUE,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  first_name varchar(100) NOT NULL,
  last_name varchar(100) NOT NULL,
  email varchar(100) UNIQUE NOT NULL,
  photo_url text,
  status varchar(20) DEFAULT 'active', -- active, inactive, terminated, suspended
  hire_date date NOT NULL,
  termination_date date,
  business_unit_id uuid REFERENCES business_units(id),
  position_id uuid REFERENCES positions(id),
  cost_center_id uuid REFERENCES cost_centers(id),
  direct_manager_id uuid REFERENCES employees(id),
  work_location varchar(50), -- remote, onsite, hybrid
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Add manager foreign key to business_units after employees table exists
ALTER TABLE business_units 
  ADD CONSTRAINT fk_business_units_manager 
  FOREIGN KEY (manager_id) REFERENCES employees(id);

CREATE TABLE IF NOT EXISTS employee_personal_data (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE UNIQUE,
  date_of_birth date,
  gender varchar(20),
  marital_status varchar(20),
  nationality_id uuid REFERENCES countries(id),
  phone varchar(50),
  mobile varchar(50),
  personal_email varchar(100),
  address text,
  city varchar(100),
  state varchar(100),
  postal_code varchar(20),
  country_id uuid REFERENCES countries(id),
  emergency_contact_name varchar(100),
  emergency_contact_phone varchar(50),
  emergency_contact_relationship varchar(50),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employee_family (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  full_name varchar(200) NOT NULL,
  relationship varchar(50) NOT NULL,
  date_of_birth date,
  gender varchar(20),
  is_dependent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employee_legal_data (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  document_type varchar(50) NOT NULL,
  document_number varchar(50) NOT NULL,
  issuing_country_id uuid REFERENCES countries(id),
  issue_date date,
  expiry_date date,
  document_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employee_contracts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  contract_type varchar(50) NOT NULL, -- permanent, fixed-term, contractor, intern
  start_date date NOT NULL,
  end_date date,
  work_schedule varchar(50), -- full-time, part-time
  weekly_hours numeric(5,2),
  probation_end_date date,
  contract_url text,
  signed_date date,
  is_current boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS employee_compensation (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  effective_date date NOT NULL,
  base_salary numeric(12,2) NOT NULL,
  currency_id uuid REFERENCES currencies(id),
  salary_type varchar(20), -- monthly, hourly, annual
  variable_compensation numeric(12,2) DEFAULT 0,
  benefits jsonb, -- flexible structure for benefits
  reason varchar(100), -- hire, promotion, merit increase, market adjustment
  is_current boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS employee_payroll_data (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE UNIQUE,
  bank_name varchar(100),
  bank_account varchar(50),
  payment_method varchar(20), -- bank_transfer, check, cash
  tax_id varchar(50),
  social_security_number varchar(50),
  tax_parameters jsonb, -- country-specific tax data
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employee_education (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  institution varchar(200) NOT NULL,
  degree varchar(100) NOT NULL,
  field_of_study varchar(100),
  start_date date,
  end_date date,
  is_completed boolean DEFAULT true,
  certificate_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employee_skills (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  skill_name varchar(100) NOT NULL,
  skill_category varchar(50), -- technical, soft, language, certification
  proficiency_level varchar(20), -- beginner, intermediate, advanced, expert
  years_of_experience integer,
  last_used_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employee_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  event_type varchar(50) NOT NULL, -- hire, promotion, transfer, salary_change, termination
  event_date date NOT NULL,
  previous_position_id uuid REFERENCES positions(id),
  new_position_id uuid REFERENCES positions(id),
  previous_business_unit_id uuid REFERENCES business_units(id),
  new_business_unit_id uuid REFERENCES business_units(id),
  previous_salary numeric(12,2),
  new_salary numeric(12,2),
  reason text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS employee_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  document_name varchar(200) NOT NULL,
  document_type varchar(50) NOT NULL, -- contract, certificate, id, other
  document_url text NOT NULL,
  version integer DEFAULT 1,
  signed_date date,
  uploaded_at timestamptz DEFAULT now(),
  uploaded_by uuid REFERENCES auth.users(id)
);

-- ============================================================================
-- LEAVE & ABSENCE MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS leave_types (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  country_id uuid REFERENCES countries(id),
  code varchar(20) NOT NULL,
  name varchar(100) NOT NULL,
  description text,
  is_paid boolean DEFAULT true,
  annual_days numeric(5,2) DEFAULT 0,
  accrual_rule jsonb, -- complex accrual rules
  max_carryover_days numeric(5,2) DEFAULT 0,
  requires_approval boolean DEFAULT true,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, code)
);

CREATE TABLE IF NOT EXISTS leave_balances (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id uuid REFERENCES leave_types(id) ON DELETE CASCADE,
  year integer NOT NULL,
  total_days numeric(5,2) NOT NULL,
  used_days numeric(5,2) DEFAULT 0,
  pending_days numeric(5,2) DEFAULT 0,
  available_days numeric(5,2) GENERATED ALWAYS AS (total_days - used_days - pending_days) STORED,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, leave_type_id, year)
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id uuid REFERENCES leave_types(id),
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_days numeric(5,2) NOT NULL,
  reason text,
  status varchar(20) DEFAULT 'pending', -- pending, approved, rejected, cancelled
  approved_by uuid REFERENCES employees(id),
  approval_date timestamptz,
  approval_comments text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- PERFORMANCE & TALENT MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS evaluation_models (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  description text,
  evaluation_type varchar(50), -- performance, potential, 360, probation
  template_data jsonb NOT NULL, -- competencies, objectives, scale
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS evaluation_cycles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  evaluation_model_id uuid REFERENCES evaluation_models(id),
  name varchar(100) NOT NULL,
  period varchar(50), -- annual, semester, quarter
  start_date date NOT NULL,
  end_date date NOT NULL,
  self_eval_deadline date,
  manager_eval_deadline date,
  status varchar(20) DEFAULT 'draft', -- draft, active, completed, cancelled
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS evaluations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluation_cycle_id uuid REFERENCES evaluation_cycles(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  evaluator_id uuid REFERENCES employees(id),
  self_evaluation jsonb,
  manager_evaluation jsonb,
  peer_evaluations jsonb, -- for 360
  final_score numeric(5,2),
  final_rating varchar(50),
  status varchar(20) DEFAULT 'pending', -- pending, self_complete, manager_complete, finalized
  comments text,
  signed_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS development_plans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  evaluation_id uuid REFERENCES evaluations(id),
  objective text NOT NULL,
  actions jsonb NOT NULL, -- array of action items
  target_date date,
  status varchar(20) DEFAULT 'active', -- active, completed, cancelled
  progress_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- ============================================================================
-- PAYROLL SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS payroll_concepts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  country_id uuid REFERENCES countries(id),
  code varchar(20) NOT NULL,
  name varchar(100) NOT NULL,
  category varchar(50) NOT NULL, -- fixed, variable, deduction, tax, benefit
  calculation_type varchar(50), -- fixed_amount, percentage, formula
  affects_gross boolean DEFAULT true,
  affects_net boolean DEFAULT true,
  taxable boolean DEFAULT true,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, code)
);

CREATE TABLE IF NOT EXISTS payroll_formulas (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  payroll_concept_id uuid REFERENCES payroll_concepts(id) ON DELETE CASCADE,
  formula_expression text NOT NULL,
  conditions jsonb, -- when to apply this formula
  priority integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS payroll_periods (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  period_name varchar(50) NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  payment_date date NOT NULL,
  status varchar(20) DEFAULT 'draft', -- draft, calculated, validated, approved, paid
  total_gross numeric(15,2) DEFAULT 0,
  total_deductions numeric(15,2) DEFAULT 0,
  total_net numeric(15,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  UNIQUE(company_id, period_name)
);

CREATE TABLE IF NOT EXISTS payroll_details (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  payroll_period_id uuid REFERENCES payroll_periods(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  concept_id uuid REFERENCES payroll_concepts(id),
  concept_code varchar(20) NOT NULL,
  concept_name varchar(100) NOT NULL,
  quantity numeric(10,2) DEFAULT 1,
  rate numeric(12,2),
  amount numeric(12,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(payroll_period_id, employee_id, concept_code)
);

-- ============================================================================
-- DOCUMENTATION & PROCEDURES
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES document_categories(id),
  name varchar(100) NOT NULL,
  description text,
  icon varchar(50),
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  category_id uuid REFERENCES document_categories(id),
  title varchar(200) NOT NULL,
  description text,
  document_type varchar(50) NOT NULL, -- policy, procedure, form, manual
  content text,
  file_url text,
  version integer DEFAULT 1,
  status varchar(20) DEFAULT 'draft', -- draft, active, obsolete
  requires_acknowledgment boolean DEFAULT false,
  visible_to_roles jsonb, -- array of role codes
  effective_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS document_acknowledgments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid REFERENCES company_documents(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  acknowledged_at timestamptz DEFAULT now(),
  quiz_score integer,
  UNIQUE(document_id, employee_id)
);

-- ============================================================================
-- CONFIGURATION & WORKFLOWS
-- ============================================================================

CREATE TABLE IF NOT EXISTS custom_fields (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  entity_type varchar(50) NOT NULL, -- employee, position, evaluation, etc
  field_name varchar(100) NOT NULL,
  field_label varchar(100) NOT NULL,
  field_type varchar(20) NOT NULL, -- text, number, date, boolean, select, multiselect
  options jsonb, -- for select/multiselect
  is_required boolean DEFAULT false,
  default_value text,
  validation_rules jsonb,
  display_order integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, entity_type, field_name)
);

CREATE TABLE IF NOT EXISTS workflow_definitions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  workflow_name varchar(100) NOT NULL,
  workflow_type varchar(50) NOT NULL, -- leave_approval, data_change, evaluation, etc
  steps jsonb NOT NULL, -- array of workflow steps with approvers and conditions
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS system_parameters (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id),
  parameter_key varchar(100) NOT NULL,
  parameter_value text NOT NULL,
  parameter_type varchar(20) DEFAULT 'string',
  description text,
  is_global boolean DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE(company_id, parameter_key)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_employees_company ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_manager ON employees(direct_manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_business_unit ON employees(business_unit_id);

CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);

CREATE INDEX IF NOT EXISTS idx_evaluations_cycle ON evaluations(evaluation_cycle_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_employee ON evaluations(employee_id);

CREATE INDEX IF NOT EXISTS idx_payroll_details_period ON payroll_details(payroll_period_id);
CREATE INDEX IF NOT EXISTS idx_payroll_details_employee ON payroll_details(employee_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizational_chart ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_personal_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_family ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_legal_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_compensation ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_payroll_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE development_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_parameters ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- BASIC RLS POLICIES (Authenticated users can read master data)
-- ============================================================================

-- Countries and currencies are read-only for all authenticated users
CREATE POLICY "Authenticated users can view countries"
  ON countries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view currencies"
  ON currencies FOR SELECT
  TO authenticated
  USING (true);

-- Companies: Users can view companies they belong to
CREATE POLICY "Users can view their companies"
  ON companies FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE employees.user_id = auth.uid() 
      AND employees.company_id = companies.id
    )
  );

-- Employees: Users can view employees in their company
CREATE POLICY "Users can view employees in their company"
  ON employees FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.user_id = auth.uid() 
      AND e.company_id = employees.company_id
    )
  );

-- Employees: Users can view their own data
CREATE POLICY "Users can view own employee record"
  ON employees FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Leave requests: Employees can view their own requests
CREATE POLICY "Employees can view own leave requests"
  ON leave_requests FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- Leave requests: Employees can create their own requests
CREATE POLICY "Employees can create leave requests"
  ON leave_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- Document acknowledgments: Employees can acknowledge documents
CREATE POLICY "Employees can acknowledge documents"
  ON document_acknowledgments FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- Basic view policies for related data
CREATE POLICY "Users can view business units in their company"
  ON business_units FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view positions in their company"
  ON positions FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view leave types in their company"
  ON leave_types FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their leave balances"
  ON leave_balances FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view company documents"
  ON company_documents FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM employees WHERE user_id = auth.uid()
    )
    AND status = 'active'
  );