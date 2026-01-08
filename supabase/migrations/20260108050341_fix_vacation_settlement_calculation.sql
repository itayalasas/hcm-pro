/*
  # Corregir Cálculo de Liquidación de Vacaciones
  
  1. Problema
    - La función usaba `base_salary` pero la columna es `salary`
    - La liquidación debe calcular el valor de los días acumulados
    
  2. Solución
    - Corregir referencias de columnas
    - Asegurar que se calculen los días disponibles correctamente
*/

-- Función corregida para calcular liquidación de vacaciones
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
  v_vacation_type_id UUID;
BEGIN
  -- Obtener información del empleado
  SELECT 
    salary,
    salary_type
  INTO v_employee
  FROM employees
  WHERE id = p_employee_id;
  
  -- Si no se encuentra el empleado, retornar cero
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Obtener ID del tipo de licencia de vacaciones
  SELECT id INTO v_vacation_type_id
  FROM leave_types
  WHERE LOWER(code) = 'vac'
  LIMIT 1;
  
  IF v_vacation_type_id IS NULL THEN
    RETURN QUERY SELECT 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Obtener saldo de vacaciones disponibles
  SELECT 
    COALESCE(available_days, 0) as available
  INTO v_balance
  FROM leave_balances
  WHERE employee_id = p_employee_id
    AND year = p_year
    AND leave_type_id = v_vacation_type_id;
  
  -- Si no hay saldo o no se encontró registro, retornar cero
  IF NOT FOUND OR v_balance.available <= 0 THEN
    RETURN QUERY SELECT 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Determinar cuántos días liquidar
  -- Si no se especifica, liquidar todos los días disponibles
  v_days_to_pay := COALESCE(p_days_to_settle, v_balance.available);
  v_days_to_pay := LEAST(v_days_to_pay, v_balance.available);
  
  -- Calcular según reglas de Uruguay:
  -- Salario Vacacional = (Salario Mensual / 30) × Días
  RETURN QUERY SELECT
    v_balance.available,
    v_days_to_pay,
    ROUND(v_employee.salary / 30.0, 2) as daily_rate,
    ROUND((v_employee.salary / 30.0) * v_days_to_pay, 2) as total_amount;
END;
$$ LANGUAGE plpgsql;

-- Función corregida para calcular descuentos por ausencias no remuneradas
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
    salary,
    salary_type
  INTO v_employee
  FROM employees
  WHERE id = p_employee_id;
  
  -- Si no se encuentra el empleado, retornar cero
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0::NUMERIC, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;
  
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
    -- Sumar días que caen en el período
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
    ROUND(v_employee.salary / 30.0, 2) as daily_rate,
    ROUND((v_employee.salary / 30.0) * v_unpaid_days, 2) as total_deduction;
END;
$$ LANGUAGE plpgsql;

-- Comentarios actualizados
COMMENT ON FUNCTION calculate_vacation_settlement IS 'Calcula el monto a pagar por liquidación de vacaciones según reglas de Uruguay: (Salario/30) × Días disponibles. Utiliza available_days de leave_balances.';
COMMENT ON FUNCTION calculate_unpaid_leave_deductions IS 'Calcula el descuento por ausencias no remuneradas en un período: (Salario/30) × Días no remunerados.';
