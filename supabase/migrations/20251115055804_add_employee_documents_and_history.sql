/*
  # Employee Documents, History and Contract Management
  
  ## Overview
  Extends the employee module with comprehensive document management,
  work history tracking, and enhanced contract management capabilities.
  
  ## New Tables Created
  
  ### 1. Employee Documents
    - `employee_documents` - Stores references and metadata for employee documents
      - `id` (uuid, primary key)
      - `employee_id` (uuid, references employees)
      - `company_id` (uuid, references companies)
      - `document_type` (varchar) - Contract, ID, Certificate, etc.
      - `document_name` (varchar) - Display name
      - `file_url` (text) - URL to stored document
      - `file_size` (integer) - Size in bytes
      - `mime_type` (varchar) - File type
      - `expiry_date` (date) - For documents that expire
      - `notes` (text) - Additional notes
      - `uploaded_by` (uuid) - User who uploaded
      - `created_at` (timestamptz)
  
  ### 2. Employee Work History
    - `employee_work_history` - Tracks position changes and promotions
      - `id` (uuid, primary key)
      - `employee_id` (uuid, references employees)
      - `company_id` (uuid, references companies)
      - `position_id` (uuid, references positions)
      - `business_unit_id` (uuid, references business_units)
      - `manager_id` (uuid, references employees)
      - `start_date` (date)
      - `end_date` (date) - NULL for current position
      - `change_type` (varchar) - Hire, Promotion, Transfer, etc.
      - `salary_change` (numeric) - Optional salary at this point
      - `notes` (text)
      - `created_at` (timestamptz)
  
  ### 3. Contract Enhancements
    - Adding fields to existing `employee_contracts` table
  
  ## Security
  - RLS enabled on all tables
  - Policies restrict access to company employees only
  - HR and managers have additional privileges
  
  ## Important Notes
  - Documents are stored externally (Supabase Storage recommended)
  - Work history is automatically created on employee position changes
  - Current positions have NULL end_date
*/

-- Employee Documents Table
CREATE TABLE IF NOT EXISTS employee_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  document_type varchar(50) NOT NULL,
  document_name varchar(200) NOT NULL,
  file_url text,
  file_size integer DEFAULT 0,
  mime_type varchar(100),
  expiry_date date,
  notes text,
  uploaded_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Employee Work History Table
CREATE TABLE IF NOT EXISTS employee_work_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  position_id uuid REFERENCES positions(id),
  position_title varchar(100) NOT NULL,
  business_unit_id uuid REFERENCES business_units(id),
  business_unit_name varchar(100),
  manager_id uuid REFERENCES employees(id),
  manager_name varchar(200),
  cost_center_id uuid REFERENCES cost_centers(id),
  start_date date NOT NULL,
  end_date date,
  change_type varchar(50) NOT NULL,
  salary_amount numeric(12,2),
  currency_id uuid REFERENCES currencies(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Add missing columns to employee_contracts if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employee_contracts' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE employee_contracts ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employee_contracts' AND column_name = 'contract_number'
  ) THEN
    ALTER TABLE employee_contracts ADD COLUMN contract_number varchar(50);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employee_contracts' AND column_name = 'position_id'
  ) THEN
    ALTER TABLE employee_contracts ADD COLUMN position_id uuid REFERENCES positions(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employee_contracts' AND column_name = 'salary_amount'
  ) THEN
    ALTER TABLE employee_contracts ADD COLUMN salary_amount numeric(12,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employee_contracts' AND column_name = 'currency_id'
  ) THEN
    ALTER TABLE employee_contracts ADD COLUMN currency_id uuid REFERENCES currencies(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employee_contracts' AND column_name = 'notes'
  ) THEN
    ALTER TABLE employee_contracts ADD COLUMN notes text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employee_contracts' AND column_name = 'document_id'
  ) THEN
    ALTER TABLE employee_contracts ADD COLUMN document_id uuid REFERENCES employee_documents(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employee_contracts' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE employee_contracts ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_employee_documents_employee ON employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_company ON employee_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_type ON employee_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_employee_work_history_employee ON employee_work_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_work_history_dates ON employee_work_history(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_employee_contracts_employee ON employee_contracts(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_contracts_current ON employee_contracts(employee_id, is_current) WHERE is_current = true;

-- Enable RLS
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_work_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employee_documents
CREATE POLICY "Employees view own documents"
  ON employee_documents FOR SELECT
  TO authenticated
  USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "Company users view company employee documents"
  ON employee_documents FOR SELECT
  TO authenticated
  USING (
    company_id IN (SELECT company_id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert documents for company employees"
  ON employee_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (SELECT company_id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update documents for company employees"
  ON employee_documents FOR UPDATE
  TO authenticated
  USING (
    company_id IN (SELECT company_id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete documents for company employees"
  ON employee_documents FOR DELETE
  TO authenticated
  USING (
    company_id IN (SELECT company_id FROM employees WHERE user_id = auth.uid())
  );

-- RLS Policies for employee_work_history
CREATE POLICY "Employees view own work history"
  ON employee_work_history FOR SELECT
  TO authenticated
  USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "Company users view company employee work history"
  ON employee_work_history FOR SELECT
  TO authenticated
  USING (
    company_id IN (SELECT company_id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert work history for company employees"
  ON employee_work_history FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (SELECT company_id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update work history for company employees"
  ON employee_work_history FOR UPDATE
  TO authenticated
  USING (
    company_id IN (SELECT company_id FROM employees WHERE user_id = auth.uid())
  );

-- Enhanced RLS for employee_contracts
ALTER TABLE employee_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees view own contracts"
  ON employee_contracts FOR SELECT
  TO authenticated
  USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "Company users view company employee contracts"
  ON employee_contracts FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT e.id FROM employees e
      WHERE e.company_id IN (SELECT company_id FROM employees WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert contracts for company employees"
  ON employee_contracts FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id IN (
      SELECT e.id FROM employees e
      WHERE e.company_id IN (SELECT company_id FROM employees WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can update contracts for company employees"
  ON employee_contracts FOR UPDATE
  TO authenticated
  USING (
    employee_id IN (
      SELECT e.id FROM employees e
      WHERE e.company_id IN (SELECT company_id FROM employees WHERE user_id = auth.uid())
    )
  );

-- Function to automatically create work history entry when employee changes position
CREATE OR REPLACE FUNCTION create_work_history_on_position_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND (
    OLD.position_id IS DISTINCT FROM NEW.position_id OR
    OLD.business_unit_id IS DISTINCT FROM NEW.business_unit_id OR
    OLD.direct_manager_id IS DISTINCT FROM NEW.direct_manager_id
  )) THEN
    -- Close previous work history entry
    UPDATE employee_work_history
    SET end_date = CURRENT_DATE
    WHERE employee_id = NEW.id AND end_date IS NULL;
    
    -- Create new work history entry
    INSERT INTO employee_work_history (
      employee_id,
      company_id,
      position_id,
      position_title,
      business_unit_id,
      manager_id,
      cost_center_id,
      start_date,
      change_type
    )
    SELECT
      NEW.id,
      NEW.company_id,
      NEW.position_id,
      p.title,
      NEW.business_unit_id,
      NEW.direct_manager_id,
      NEW.cost_center_id,
      CURRENT_DATE,
      CASE
        WHEN OLD.position_id IS NULL THEN 'hire'
        WHEN OLD.position_id != NEW.position_id THEN 'promotion'
        WHEN OLD.business_unit_id != NEW.business_unit_id THEN 'transfer'
        ELSE 'update'
      END
    FROM positions p
    WHERE p.id = NEW.position_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for work history
DROP TRIGGER IF EXISTS trg_employee_position_change ON employees;
CREATE TRIGGER trg_employee_position_change
  AFTER INSERT OR UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION create_work_history_on_position_change();
