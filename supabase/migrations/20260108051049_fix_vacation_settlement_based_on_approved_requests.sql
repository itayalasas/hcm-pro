/*
  # Corregir Liquidación de Vacaciones Basada en Solicitudes Aprobadas
  
  1. Problema
    - La liquidación se calculaba sobre el balance total de días
    - Debe calcularse sobre solicitudes de vacaciones aprobadas en el período
    
  2. Solución
    - Nueva función que busca solicitudes aprobadas en el rango de fechas
    - Calcula días de vacaciones que caen dentro del período de nómina
    - Retorna monto a pagar por esos días específicos
*/

-- Eliminar función anterior
DROP FUNCTION IF EXISTS calculate_vacation_settlement(UUID, INTEGER, NUMERIC);

-- Nueva función que calcula liquidación basada en solicitudes aprobadas
CREATE OR REPLACE FUNCTION calculate_vacation_settlement_by_period(
  p_employee_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  vacation_days NUMERIC,
  daily_rate NUMERIC,
  total_amount NUMERIC
) AS $$
DECLARE
  v_employee_salary NUMERIC;
  v_vacation_days NUMERIC := 0;
  v_leave_request RECORD;
BEGIN
  -- Obtener salario del empleado
  SELECT salary INTO v_employee_salary
  FROM employees
  WHERE id = p_employee_id;
  
  -- Si no se encuentra el empleado, retornar cero
  IF NOT FOUND OR v_employee_salary IS NULL THEN
    RETURN QUERY SELECT 0::NUMERIC, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Buscar todas las solicitudes de vacaciones aprobadas en el período
  FOR v_leave_request IN 
    SELECT 
      lr.start_date,
      lr.end_date,
      lr.total_days
    FROM leave_requests lr
    JOIN leave_types lt ON lt.id = lr.leave_type_id
    WHERE lr.employee_id = p_employee_id
      AND lr.status = 'approved'
      AND UPPER(lt.code) = 'VAC'
      AND lt.is_paid = true
      AND lr.start_date <= p_end_date
      AND lr.end_date >= p_start_date
  LOOP
    -- Sumar días de vacaciones que caen en el período
    v_vacation_days := v_vacation_days + v_leave_request.total_days;
  END LOOP;
  
  -- Si no hay días de vacaciones, retornar cero
  IF v_vacation_days <= 0 THEN
    RETURN QUERY SELECT 0::NUMERIC, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Calcular según reglas de Uruguay:
  -- Salario Vacacional = (Salario Mensual / 30) × Días de vacaciones aprobados
  RETURN QUERY SELECT
    v_vacation_days,
    ROUND(v_employee_salary / 30.0, 2) as daily_rate,
    ROUND((v_employee_salary / 30.0) * v_vacation_days, 2) as total_amount;
END;
$$ LANGUAGE plpgsql;

-- Comentario
COMMENT ON FUNCTION calculate_vacation_settlement_by_period IS 'Calcula el monto a pagar por liquidación de vacaciones basándose en solicitudes de vacaciones aprobadas que caen dentro del período de nómina. Formula: (Salario/30) × Días de vacaciones aprobados en el período.';
