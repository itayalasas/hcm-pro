/*
  # Ajustar Cálculo de Vacaciones por Año Vencido

  1. Propósito
    - Las vacaciones se acumulan durante un año y se disfrutan al año siguiente
    - Al generar saldos para 2026, debemos calcular sobre el tiempo trabajado en 2025
    
  2. Lógica Corregida
    - Generar saldos para año N = calcular sobre año N-1 (año vencido)
    - Si empleado ingresó en 2025 en julio, para el año 2026 recibe: 20 * 6 / 12 = 10 días
    - Si empleado ingresó antes de 2025, para el año 2026 recibe: 20 días completos (o más por antigüedad)
    
  3. Ejemplos
    - Generar saldos 2026:
      * Empleado ingresa julio 2025: 6 meses trabajados en 2025 → 10 días para 2026
      * Empleado ingresa enero 2024: año completo 2025 trabajado → 20 días para 2026
      * Empleado ingresa julio 2026: 0 días para 2026 (aún no ha trabajado en 2025)
*/

-- Actualizar función de generación para calcular sobre el año anterior (año vencido)
CREATE OR REPLACE FUNCTION generate_annual_vacation_balances(
  p_company_id uuid,
  p_year integer
)
RETURNS void AS $$
DECLARE
  v_employee record;
  v_vacation_type_id uuid;
  v_vacation_days numeric;
  v_carryover_days numeric(5,2);
  v_allow_carryover boolean;
  v_max_carryover integer;
  v_expiry_months integer;
  v_previous_balance numeric;
  v_previous_year integer;
BEGIN
  -- El año para el cual calculamos es el año vencido (año anterior)
  v_previous_year := p_year - 1;

  -- Obtener el tipo de ausencia "Vacaciones"
  SELECT id INTO v_vacation_type_id
  FROM leave_types
  WHERE company_id = p_company_id
    AND LOWER(code) = 'vac'
  LIMIT 1;

  IF v_vacation_type_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró el tipo de ausencia de Vacaciones (código VAC) para la empresa';
  END IF;

  -- Obtener configuración de arrastre
  SELECT vacation_allow_carryover, vacation_max_carryover_days, vacation_carryover_expiry_months
  INTO v_allow_carryover, v_max_carryover, v_expiry_months
  FROM companies
  WHERE id = p_company_id;

  -- Iterar sobre todos los empleados activos
  FOR v_employee IN
    SELECT id, hire_date
    FROM employees
    WHERE company_id = p_company_id
      AND status = 'active'
      -- Solo incluir empleados que ya estaban trabajando durante el año vencido
      AND hire_date <= make_date(v_previous_year, 12, 31)
  LOOP
    -- Calcular días de vacaciones basado en el tiempo trabajado en el año ANTERIOR (vencido)
    -- Para generar saldos de 2026, calculamos sobre 2025
    v_vacation_days := calculate_vacation_days(
      p_company_id, 
      v_employee.hire_date, 
      make_date(v_previous_year, 12, 31)  -- Calcular sobre el año anterior
    );

    -- Calcular días de arrastre del año anterior
    v_carryover_days := 0;
    IF v_allow_carryover THEN
      SELECT available_days INTO v_previous_balance
      FROM leave_balances
      WHERE employee_id = v_employee.id
        AND leave_type_id = v_vacation_type_id
        AND year = p_year - 1;

      IF FOUND AND v_previous_balance > 0 THEN
        v_carryover_days := LEAST(v_previous_balance, v_max_carryover);
      END IF;
    END IF;

    -- Insertar o actualizar el saldo para el año actual
    INSERT INTO leave_balances (
      employee_id,
      leave_type_id,
      year,
      total_days,
      carryover_days,
      carryover_expiry_date,
      used_days,
      pending_days,
      company_id
    ) VALUES (
      v_employee.id,
      v_vacation_type_id,
      p_year,  -- El saldo es para el año actual
      v_vacation_days,  -- Pero calculado sobre el año anterior
      v_carryover_days,
      CASE WHEN v_carryover_days > 0 
        THEN make_date(p_year, 1, 1) + (v_expiry_months || ' months')::interval
        ELSE NULL
      END,
      0,
      0,
      p_company_id
    )
    ON CONFLICT (employee_id, leave_type_id, year)
    DO UPDATE SET
      total_days = EXCLUDED.total_days,
      carryover_days = EXCLUDED.carryover_days,
      carryover_expiry_date = EXCLUDED.carryover_expiry_date;
  END LOOP;
  
  RAISE NOTICE 'Saldos generados exitosamente para % empleados (calculado sobre año vencido %)', 
    (SELECT COUNT(*) 
     FROM employees 
     WHERE company_id = p_company_id 
       AND status = 'active'
       AND hire_date <= make_date(v_previous_year, 12, 31)
    ),
    v_previous_year;
END;
$$ LANGUAGE plpgsql;
