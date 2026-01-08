/*
  # Liquidación de Vacaciones y Descuentos por Ausencias No Remuneradas
  
  1. Propósito
    - Agregar tipo de nómina para liquidación de vacaciones
    - Crear conceptos para liquidación de vacaciones y descuentos por ausencias
    - Implementar cálculos automáticos según reglas de Uruguay
    
  2. Tipos de Nómina
    - `monthly` - Nómina mensual regular
    - `vacation_settlement` - Liquidación de vacaciones (pago de días acumulados)
    - `biweekly`, `weekly` - Otros tipos existentes
    
  3. Conceptos de Nómina
    - VACATION_PAY - Liquidación de vacaciones (percepción/haber)
      * Fórmula: (Salario Mensual / 30) × Días a liquidar
      * No tiene descuento de BPS (15%)
      * SÍ está sujeto a IRPF
    
    - UNPAID_LEAVE - Descuento por ausencias no remuneradas (deducción)
      * Fórmula: (Salario Mensual / 30) × Días no remunerados
      * Se aplica en nómina mensual
      
  4. Funciones de Cálculo
    - `calculate_vacation_settlement()` - Calcula monto de liquidación de vacaciones
    - `calculate_unpaid_leave_deductions()` - Calcula descuentos por ausencias no remuneradas
*/

-- Agregar tipo de período "vacation_settlement"
DO $$
BEGIN
  -- Drop existing constraint
  ALTER TABLE payroll_periods 
  DROP CONSTRAINT IF EXISTS payroll_periods_period_type_check;
  
  -- Add new constraint with vacation_settlement
  ALTER TABLE payroll_periods 
  ADD CONSTRAINT payroll_periods_period_type_check 
  CHECK (period_type IN ('weekly', 'biweekly', 'monthly', 'bimonthly', 'custom', 'vacation_settlement'));
END $$;

-- Insertar conceptos de liquidación de vacaciones para todas las empresas
INSERT INTO payroll_concepts (company_id, country_id, code, name, category, calculation_type, active, percentage_value, fixed_amount, formula_expression, applies_to_gross)
SELECT 
  c.id,
  c.country_id,
  'VACATION_PAY',
  'Liquidación de Vacaciones',
  'haber',
  'formula',
  true,
  0,
  0,
  '(base_salary / 30) * vacation_days',
  false
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM payroll_concepts pc 
  WHERE pc.company_id = c.id AND pc.code = 'VACATION_PAY'
)
ON CONFLICT (company_id, code) DO NOTHING;

-- Insertar concepto de descuento por ausencias no remuneradas
INSERT INTO payroll_concepts (company_id, country_id, code, name, category, calculation_type, active, percentage_value, fixed_amount, formula_expression, applies_to_gross)
SELECT 
  c.id,
  c.country_id,
  'UNPAID_LEAVE',
  'Descuento por Ausencias No Remuneradas',
  'descuento',
  'formula',
  true,
  0,
  0,
  '(base_salary / 30) * unpaid_days',
  false
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM payroll_concepts pc 
  WHERE pc.company_id = c.id AND pc.code = 'UNPAID_LEAVE'
)
ON CONFLICT (company_id, code) DO NOTHING;

-- Función para calcular liquidación de vacaciones
CREATE OR REPLACE FUNCTION calculate_vacation_settlement(
  p_employee_id UUID,
  p_year INTEGER,
  p_days_to_settle NUMERIC DEFAULT NULL
)
RETURNS TABLE(
  available_days NUMERIC,
  days_to_pay NUMERIC,
  daily_rate NUMERIC,
  total_amount NUMERIC
) AS $$
DECLARE
  v_employee RECORD;
  v_balance RECORD;
  v_days_to_pay NUMERIC;
BEGIN
  -- Obtener información del empleado
  SELECT 
    base_salary,
    salary_type
  INTO v_employee
  FROM employees
  WHERE id = p_employee_id;
  
  -- Obtener saldo de vacaciones
  SELECT 
    COALESCE(total_days, 0) - COALESCE(used_days, 0) + COALESCE(carryover_days, 0) as available
  INTO v_balance
  FROM leave_balances
  WHERE employee_id = p_employee_id
    AND year = p_year
    AND leave_type_id = (SELECT id FROM leave_types WHERE LOWER(code) = 'vac' LIMIT 1);
  
  -- Si no hay saldo, retornar cero
  IF NOT FOUND OR v_balance.available <= 0 THEN
    RETURN QUERY SELECT 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Determinar cuántos días liquidar
  v_days_to_pay := COALESCE(p_days_to_settle, v_balance.available);
  v_days_to_pay := LEAST(v_days_to_pay, v_balance.available);
  
  -- Calcular según reglas de Uruguay:
  -- Salario Vacacional = (Salario Mensual / 30) × Días
  RETURN QUERY SELECT
    v_balance.available,
    v_days_to_pay,
    ROUND(v_employee.base_salary / 30.0, 2) as daily_rate,
    ROUND((v_employee.base_salary / 30.0) * v_days_to_pay, 2) as total_amount;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular descuentos por ausencias no remuneradas en un período
CREATE OR REPLACE FUNCTION calculate_unpaid_leave_deductions(
  p_employee_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  unpaid_days NUMERIC,
  daily_rate NUMERIC,
  total_deduction NUMERIC
) AS $$
DECLARE
  v_employee RECORD;
  v_unpaid_days NUMERIC := 0;
  v_leave_request RECORD;
BEGIN
  -- Obtener información del empleado
  SELECT 
    base_salary,
    salary_type
  INTO v_employee
  FROM employees
  WHERE id = p_employee_id;
  
  -- Calcular días no remunerados en el período
  FOR v_leave_request IN 
    SELECT 
      lr.start_date,
      lr.end_date,
      lr.total_days,
      lt.is_paid
    FROM leave_requests lr
    JOIN leave_types lt ON lt.id = lr.leave_type_id
    WHERE lr.employee_id = p_employee_id
      AND lr.status = 'approved'
      AND lt.is_paid = false
      AND lr.start_date <= p_end_date
      AND lr.end_date >= p_start_date
  LOOP
    -- Calcular días que caen en el período
    v_unpaid_days := v_unpaid_days + v_leave_request.total_days;
  END LOOP;
  
  -- Si no hay días no remunerados, retornar cero
  IF v_unpaid_days <= 0 THEN
    RETURN QUERY SELECT 0::NUMERIC, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Calcular descuento: (Salario Mensual / 30) × Días no remunerados
  RETURN QUERY SELECT
    v_unpaid_days,
    ROUND(v_employee.base_salary / 30.0, 2) as daily_rate,
    ROUND((v_employee.base_salary / 30.0) * v_unpaid_days, 2) as total_deduction;
END;
$$ LANGUAGE plpgsql;

-- Agregar campo para rastrear liquidación de vacaciones en leave_balances
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leave_balances' AND column_name = 'settled_days'
  ) THEN
    ALTER TABLE leave_balances 
    ADD COLUMN settled_days NUMERIC(5,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leave_balances' AND column_name = 'last_settlement_date'
  ) THEN
    ALTER TABLE leave_balances 
    ADD COLUMN last_settlement_date DATE;
  END IF;
END $$;

-- Función trigger para actualizar días liquidados cuando se procesa una nómina de liquidación
CREATE OR REPLACE FUNCTION update_settled_vacation_days()
RETURNS TRIGGER AS $$
DECLARE
  v_payroll_period RECORD;
  v_vacation_concept_id UUID;
  v_days_settled NUMERIC;
BEGIN
  -- Obtener información del período de nómina
  SELECT 
    pp.period_type,
    pp.company_id,
    pp.start_date,
    pp.end_date
  INTO v_payroll_period
  FROM payroll_periods pp
  WHERE pp.id = NEW.payroll_period_id;
  
  -- Solo procesar si es nómina de liquidación de vacaciones
  IF v_payroll_period.period_type = 'vacation_settlement' THEN
    -- Obtener el concepto de liquidación de vacaciones
    SELECT id INTO v_vacation_concept_id
    FROM payroll_concepts
    WHERE company_id = v_payroll_period.company_id
      AND code = 'VACATION_PAY'
    LIMIT 1;
    
    -- Obtener los días liquidados del detalle de conceptos
    SELECT COALESCE(quantity, 0) INTO v_days_settled
    FROM payroll_concept_details
    WHERE payroll_period_detail_id = NEW.id
      AND payroll_concept_id = v_vacation_concept_id;
    
    -- Actualizar el saldo de vacaciones
    IF v_days_settled > 0 THEN
      UPDATE leave_balances
      SET 
        settled_days = COALESCE(settled_days, 0) + v_days_settled,
        last_settlement_date = v_payroll_period.end_date,
        -- Reducir del saldo disponible (primero de arrastre, luego de días actuales)
        carryover_days = GREATEST(0, COALESCE(carryover_days, 0) - v_days_settled),
        total_days = CASE 
          WHEN COALESCE(carryover_days, 0) >= v_days_settled THEN total_days
          ELSE GREATEST(0, total_days - (v_days_settled - COALESCE(carryover_days, 0)))
        END
      WHERE employee_id = NEW.employee_id
        AND year = EXTRACT(YEAR FROM v_payroll_period.end_date)
        AND leave_type_id = (SELECT id FROM leave_types WHERE LOWER(code) = 'vac' LIMIT 1);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_update_settled_vacation_days ON payroll_period_details;
CREATE TRIGGER trigger_update_settled_vacation_days
  AFTER INSERT OR UPDATE ON payroll_period_details
  FOR EACH ROW
  EXECUTE FUNCTION update_settled_vacation_days();

-- Comentarios sobre el uso
COMMENT ON FUNCTION calculate_vacation_settlement IS 'Calcula el monto a pagar por liquidación de vacaciones según reglas de Uruguay: (Salario/30) × Días. No incluye descuento de BPS pero sí IRPF.';
COMMENT ON FUNCTION calculate_unpaid_leave_deductions IS 'Calcula el descuento por ausencias no remuneradas en un período: (Salario/30) × Días no remunerados.';
