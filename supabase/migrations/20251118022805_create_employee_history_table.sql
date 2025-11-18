/*
  # Create Employee History Table

  1. New Tables
    - `employee_history`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, foreign key to employees)
      - `company_id` (uuid, foreign key to companies)
      - `change_type` (text) - Type of change: position_change, department_change, salary_change, status_change, manager_change, location_change, other
      - `change_date` (date) - When the change occurred
      - `field_changed` (text) - Field that was changed
      - `old_value` (text) - Previous value
      - `new_value` (text) - New value
      - `old_value_display` (text) - Human-readable old value (e.g., position name instead of ID)
      - `new_value_display` (text) - Human-readable new value
      - `notes` (text) - Additional notes about the change
      - `created_by` (uuid) - User who made the change
      - `created_at` (timestamptz)
      
  2. Security
    - Enable RLS on `employee_history` table
    - Add policies for authenticated users to view history from their company
    - Add policies for authenticated users to create history records
    
  3. Important Notes
    - This table tracks all significant changes to employee records
    - Includes both technical values and human-readable display values
    - Used for audit trail and employee career progression tracking
*/

-- Create employee_history table
CREATE TABLE IF NOT EXISTS employee_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  change_type text NOT NULL CHECK (change_type IN ('position_change', 'department_change', 'salary_change', 'status_change', 'manager_change', 'location_change', 'promotion', 'demotion', 'transfer', 'other')),
  change_date date NOT NULL DEFAULT CURRENT_DATE,
  field_changed text,
  old_value text,
  new_value text,
  old_value_display text,
  new_value_display text,
  notes text,
  created_by uuid REFERENCES app_users(id),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employee_history_employee_id ON employee_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_history_company_id ON employee_history(company_id);
CREATE INDEX IF NOT EXISTS idx_employee_history_change_date ON employee_history(change_date DESC);
CREATE INDEX IF NOT EXISTS idx_employee_history_change_type ON employee_history(change_type);

-- Enable RLS
ALTER TABLE employee_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view history from their company
CREATE POLICY "Users can view employee history from their company"
ON employee_history
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id 
    FROM user_companies 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Users can create history records for their company
CREATE POLICY "Users can create employee history for their company"
ON employee_history
FOR INSERT
TO authenticated
WITH CHECK (
  company_id IN (
    SELECT company_id 
    FROM user_companies 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Users can update history records from their company
CREATE POLICY "Users can update employee history from their company"
ON employee_history
FOR UPDATE
TO authenticated
USING (
  company_id IN (
    SELECT company_id 
    FROM user_companies 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  company_id IN (
    SELECT company_id 
    FROM user_companies 
    WHERE user_id = auth.uid()
  )
);

-- Function to automatically log employee changes
CREATE OR REPLACE FUNCTION log_employee_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log position changes
  IF OLD.position_id IS DISTINCT FROM NEW.position_id THEN
    INSERT INTO employee_history (
      employee_id,
      company_id,
      change_type,
      change_date,
      field_changed,
      old_value,
      new_value,
      old_value_display,
      new_value_display,
      notes
    ) VALUES (
      NEW.id,
      NEW.company_id,
      'position_change',
      CURRENT_DATE,
      'position_id',
      OLD.position_id::text,
      NEW.position_id::text,
      (SELECT title FROM positions WHERE id = OLD.position_id),
      (SELECT title FROM positions WHERE id = NEW.position_id),
      'Cambio de puesto automático'
    );
  END IF;

  -- Log department changes
  IF OLD.department_id IS DISTINCT FROM NEW.department_id THEN
    INSERT INTO employee_history (
      employee_id,
      company_id,
      change_type,
      change_date,
      field_changed,
      old_value,
      new_value,
      old_value_display,
      new_value_display,
      notes
    ) VALUES (
      NEW.id,
      NEW.company_id,
      'department_change',
      CURRENT_DATE,
      'department_id',
      OLD.department_id::text,
      NEW.department_id::text,
      (SELECT name FROM departments WHERE id = OLD.department_id),
      (SELECT name FROM departments WHERE id = NEW.department_id),
      'Cambio de departamento automático'
    );
  END IF;

  -- Log salary changes
  IF OLD.salary IS DISTINCT FROM NEW.salary THEN
    INSERT INTO employee_history (
      employee_id,
      company_id,
      change_type,
      change_date,
      field_changed,
      old_value,
      new_value,
      old_value_display,
      new_value_display,
      notes
    ) VALUES (
      NEW.id,
      NEW.company_id,
      'salary_change',
      CURRENT_DATE,
      'salary',
      OLD.salary::text,
      NEW.salary::text,
      '$' || OLD.salary::text,
      '$' || NEW.salary::text,
      'Cambio de salario automático'
    );
  END IF;

  -- Log status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO employee_history (
      employee_id,
      company_id,
      change_type,
      change_date,
      field_changed,
      old_value,
      new_value,
      old_value_display,
      new_value_display,
      notes
    ) VALUES (
      NEW.id,
      NEW.company_id,
      'status_change',
      CURRENT_DATE,
      'status',
      OLD.status,
      NEW.status,
      OLD.status,
      NEW.status,
      'Cambio de estado automático'
    );
  END IF;

  -- Log manager changes
  IF OLD.direct_manager_id IS DISTINCT FROM NEW.direct_manager_id THEN
    INSERT INTO employee_history (
      employee_id,
      company_id,
      change_type,
      change_date,
      field_changed,
      old_value,
      new_value,
      old_value_display,
      new_value_display,
      notes
    ) VALUES (
      NEW.id,
      NEW.company_id,
      'manager_change',
      CURRENT_DATE,
      'direct_manager_id',
      OLD.direct_manager_id::text,
      NEW.direct_manager_id::text,
      (SELECT first_name || ' ' || last_name FROM employees WHERE id = OLD.direct_manager_id),
      (SELECT first_name || ' ' || last_name FROM employees WHERE id = NEW.direct_manager_id),
      'Cambio de supervisor automático'
    );
  END IF;

  -- Log work location changes
  IF OLD.work_location_id IS DISTINCT FROM NEW.work_location_id THEN
    INSERT INTO employee_history (
      employee_id,
      company_id,
      change_type,
      change_date,
      field_changed,
      old_value,
      new_value,
      old_value_display,
      new_value_display,
      notes
    ) VALUES (
      NEW.id,
      NEW.company_id,
      'location_change',
      CURRENT_DATE,
      'work_location_id',
      OLD.work_location_id::text,
      NEW.work_location_id::text,
      (SELECT name FROM work_locations WHERE id = OLD.work_location_id),
      (SELECT name FROM work_locations WHERE id = NEW.work_location_id),
      'Cambio de ubicación automático'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic logging
DROP TRIGGER IF EXISTS trigger_log_employee_changes ON employees;
CREATE TRIGGER trigger_log_employee_changes
AFTER UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION log_employee_changes();