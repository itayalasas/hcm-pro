/*
  # Función para Obtener Empleados con Solicitudes de Vacaciones
  
  1. Propósito
    - Obtener lista de empleados que tienen solicitudes de vacaciones aprobadas
    - Dentro de un período específico
    
  2. Uso
    - Utilizado al generar nóminas de liquidación de vacaciones
    - Identifica automáticamente quiénes deben cobrar vacaciones
*/

CREATE OR REPLACE FUNCTION get_employees_with_approved_vacations(
  p_company_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  employee_id UUID,
  employee_name TEXT,
  total_vacation_days NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id as employee_id,
    (e.first_name || ' ' || e.last_name) as employee_name,
    SUM(lr.total_days) as total_vacation_days
  FROM employees e
  JOIN leave_requests lr ON lr.employee_id = e.id
  JOIN leave_types lt ON lt.id = lr.leave_type_id
  WHERE e.company_id = p_company_id
    AND lr.status = 'approved'
    AND UPPER(lt.code) = 'VAC'
    AND lt.is_paid = true
    AND lr.start_date <= p_end_date
    AND lr.end_date >= p_start_date
  GROUP BY e.id, e.first_name, e.last_name
  ORDER BY e.first_name, e.last_name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_employees_with_approved_vacations IS 'Obtiene la lista de empleados que tienen solicitudes de vacaciones aprobadas dentro de un período específico.';
