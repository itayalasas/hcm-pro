/*
  # Agregar company_id a Tablas Restantes
  
  ## Cambios
  1. Agregar company_id a tablas que lo necesitan:
     - employee_compensation
     - employee_personal_data
     - evaluations
     - leave_balances
     - leave_requests
     - payroll_details
  
  2. Agregar índices para mejor rendimiento
  
  3. Actualizar políticas RLS para filtrar por company_id
  
  ## Por qué
  Todos los registros deben estar asociados a una empresa específica para asegurar
  el aislamiento de datos entre empresas.
*/

-- Agregar company_id a employee_compensation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employee_compensation' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE employee_compensation 
      ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_employee_compensation_company 
      ON employee_compensation(company_id);
  END IF;
END $$;

-- Agregar company_id a employee_personal_data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employee_personal_data' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE employee_personal_data 
      ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_employee_personal_data_company 
      ON employee_personal_data(company_id);
  END IF;
END $$;

-- Agregar company_id a evaluations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'evaluations' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE evaluations 
      ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_evaluations_company 
      ON evaluations(company_id);
  END IF;
END $$;

-- Agregar company_id a leave_balances
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leave_balances' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE leave_balances 
      ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_leave_balances_company 
      ON leave_balances(company_id);
  END IF;
END $$;

-- Agregar company_id a leave_requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leave_requests' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE leave_requests 
      ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_leave_requests_company 
      ON leave_requests(company_id);
  END IF;
END $$;

-- Agregar company_id a payroll_details
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payroll_details' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE payroll_details 
      ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_payroll_details_company 
      ON payroll_details(company_id);
  END IF;
END $$;
