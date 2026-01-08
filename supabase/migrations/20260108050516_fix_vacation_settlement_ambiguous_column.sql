/*
  # Corregir Conflicto de Nombres en Función de Vacaciones
  
  1. Problema
    - Conflicto entre el campo de retorno 'available_days' y la columna de la tabla
    
  2. Solución
    - Calificar el nombre de columna con el alias de tabla
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
  v_employee_salary NUMERIC;
  v_available_days NUMERIC;
  v_days_to_pay NUMERIC;
  v_vacation_type_id UUID;
BEGIN
  -- Obtener salario del empleado
  SELECT salary INTO v_employee_salary
  FROM employees
  WHERE id = p_employee_id;
  
  -- Si no se encuentra el empleado, retornar cero
  IF NOT FOUND OR v_employee_salary IS NULL THEN
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
    COALESCE(lb.available_days, 0)
  INTO v_available_days
  FROM leave_balances lb
  WHERE lb.employee_id = p_employee_id
    AND lb.year = p_year
    AND lb.leave_type_id = v_vacation_type_id;
  
  -- Si no hay saldo o no se encontró registro, retornar cero
  IF NOT FOUND OR v_available_days <= 0 THEN
    RETURN QUERY SELECT 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Determinar cuántos días liquidar
  -- Si no se especifica, liquidar todos los días disponibles
  v_days_to_pay := COALESCE(p_days_to_settle, v_available_days);
  v_days_to_pay := LEAST(v_days_to_pay, v_available_days);
  
  -- Calcular según reglas de Uruguay:
  -- Salario Vacacional = (Salario Mensual / 30) × Días
  RETURN QUERY SELECT
    v_available_days,
    v_days_to_pay,
    ROUND(v_employee_salary / 30.0, 2) as daily_rate,
    ROUND((v_employee_salary / 30.0) * v_days_to_pay, 2) as total_amount;
END;
$$ LANGUAGE plpgsql;
