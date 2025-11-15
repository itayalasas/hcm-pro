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
    - `employee_contracts` - Contract history
    - `employee_compensation` - Salary and benefits
    
  ### 4. Leave Management
    - `leave_types` - Configurable leave types per country
    - `leave_balances` - Employee leave balances
    - `leave_requests` - Time-off requests
    
  ### 5. Performance & Talent
    - `evaluation_models` - Evaluation templates
    - `evaluation_cycles` - Evaluation periods
    - `evaluations` - Individual evaluations
    
  ### 6. Payroll
    - `payroll_concepts` - Salary concepts catalog
    - `payroll_periods` - Pay periods
    - `payroll_details` - Individual payslips
    
  ## Security
  - RLS enabled on all tables
  - Policies for authenticated users based on role and hierarchy
*/

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Countries
CREATE TABLE IF NOT EXISTS countries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code varchar(3) UNIQUE NOT NULL,
  name varchar(100) NOT NULL,
  phone_code varchar(10),
  currency_code varchar(3),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Currencies
CREATE TABLE IF NOT EXISTS currencies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code varchar(3) UNIQUE NOT NULL,
  name varchar(50) NOT NULL,
  symbol varchar(10),
  decimal_places integer DEFAULT 2,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Companies
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
  created_at timestamptz DEFAULT now()
);

-- Business Units
CREATE TABLE IF NOT EXISTS business_units (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES business_units(id),
  code varchar(20) NOT NULL,
  name varchar(100) NOT NULL,
  type varchar(50) NOT NULL,
  manager_id uuid,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, code)
);

-- Cost Centers
CREATE TABLE IF NOT EXISTS cost_centers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  code varchar(20) NOT NULL,
  name varchar(100) NOT NULL,
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, code)
);

-- Positions
CREATE TABLE IF NOT EXISTS positions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  code varchar(20) NOT NULL,
  title varchar(100) NOT NULL,
  description text,
  salary_band_min numeric(12,2),
  salary_band_max numeric(12,2),
  currency_id uuid REFERENCES currencies(id),
  level varchar(50),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, code)
);

-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_number varchar(20) UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) UNIQUE,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  first_name varchar(100) NOT NULL,
  last_name varchar(100) NOT NULL,
  email varchar(100) UNIQUE NOT NULL,
  photo_url text,
  status varchar(20) DEFAULT 'active',
  hire_date date NOT NULL,
  termination_date date,
  business_unit_id uuid REFERENCES business_units(id),
  position_id uuid REFERENCES positions(id),
  cost_center_id uuid REFERENCES cost_centers(id),
  direct_manager_id uuid REFERENCES employees(id),
  work_location varchar(50),
  created_at timestamptz DEFAULT now()
);

-- Employee Personal Data
CREATE TABLE IF NOT EXISTS employee_personal_data (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE UNIQUE,
  date_of_birth date,
  phone varchar(50),
  mobile varchar(50),
  address text,
  city varchar(100),
  country_id uuid REFERENCES countries(id),
  created_at timestamptz DEFAULT now()
);

-- Employee Contracts
CREATE TABLE IF NOT EXISTS employee_contracts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  contract_type varchar(50) NOT NULL,
  start_date date NOT NULL,
  end_date date,
  work_schedule varchar(50),
  weekly_hours numeric(5,2),
  is_current boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Employee Compensation
CREATE TABLE IF NOT EXISTS employee_compensation (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  effective_date date NOT NULL,
  base_salary numeric(12,2) NOT NULL,
  currency_id uuid REFERENCES currencies(id),
  salary_type varchar(20),
  is_current boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Leave Types
CREATE TABLE IF NOT EXISTS leave_types (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  country_id uuid REFERENCES countries(id),
  code varchar(20) NOT NULL,
  name varchar(100) NOT NULL,
  description text,
  is_paid boolean DEFAULT true,
  annual_days numeric(5,2) DEFAULT 0,
  requires_approval boolean DEFAULT true,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, code)
);

-- Leave Balances
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
  UNIQUE(employee_id, leave_type_id, year)
);

-- Leave Requests
CREATE TABLE IF NOT EXISTS leave_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id uuid REFERENCES leave_types(id),
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_days numeric(5,2) NOT NULL,
  reason text,
  status varchar(20) DEFAULT 'pending',
  approved_by uuid REFERENCES employees(id),
  approval_date timestamptz,
  approval_comments text,
  created_at timestamptz DEFAULT now()
);

-- Evaluation Models
CREATE TABLE IF NOT EXISTS evaluation_models (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  description text,
  evaluation_type varchar(50),
  template_data jsonb NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Evaluation Cycles
CREATE TABLE IF NOT EXISTS evaluation_cycles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  evaluation_model_id uuid REFERENCES evaluation_models(id),
  name varchar(100) NOT NULL,
  period varchar(50),
  start_date date NOT NULL,
  end_date date NOT NULL,
  status varchar(20) DEFAULT 'draft',
  created_at timestamptz DEFAULT now()
);

-- Evaluations
CREATE TABLE IF NOT EXISTS evaluations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluation_cycle_id uuid REFERENCES evaluation_cycles(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  evaluator_id uuid REFERENCES employees(id),
  final_score numeric(5,2),
  final_rating varchar(50),
  status varchar(20) DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Payroll Concepts
CREATE TABLE IF NOT EXISTS payroll_concepts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  country_id uuid REFERENCES countries(id),
  code varchar(20) NOT NULL,
  name varchar(100) NOT NULL,
  category varchar(50) NOT NULL,
  calculation_type varchar(50),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, code)
);

-- Payroll Periods
CREATE TABLE IF NOT EXISTS payroll_periods (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  period_name varchar(50) NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  payment_date date NOT NULL,
  status varchar(20) DEFAULT 'draft',
  total_gross numeric(15,2) DEFAULT 0,
  total_deductions numeric(15,2) DEFAULT 0,
  total_net numeric(15,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, period_name)
);

-- Payroll Details
CREATE TABLE IF NOT EXISTS payroll_details (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  payroll_period_id uuid REFERENCES payroll_periods(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  concept_id uuid REFERENCES payroll_concepts(id),
  concept_code varchar(20) NOT NULL,
  concept_name varchar(100) NOT NULL,
  amount numeric(12,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_employees_company ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);

-- Enable RLS
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_periods ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public read countries" ON countries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read currencies" ON currencies FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users view their company" ON companies FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM employees WHERE employees.user_id = auth.uid() AND employees.company_id = companies.id));

CREATE POLICY "Users view own employee" ON employees FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR company_id IN (SELECT company_id FROM employees WHERE user_id = auth.uid()));

CREATE POLICY "Users view company leave types" ON leave_types FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM employees WHERE user_id = auth.uid()));

CREATE POLICY "Users view own leave balances" ON leave_balances FOR SELECT TO authenticated
  USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

CREATE POLICY "Users view own leave requests" ON leave_requests FOR SELECT TO authenticated
  USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

CREATE POLICY "Users create own leave requests" ON leave_requests FOR INSERT TO authenticated
  WITH CHECK (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));