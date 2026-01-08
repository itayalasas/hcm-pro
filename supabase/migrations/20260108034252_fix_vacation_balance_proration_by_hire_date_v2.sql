/*
  # Corregir Cálculo Proporcional de Vacaciones por Fecha de Ingreso

  1. Propósito
    - Calcular días de vacaciones proporcionalmente si el empleado ingresó durante el año actual
    - Si el empleado ingresó en años anteriores, otorgar el total de días
    
  2. Lógica de Cálculo Proporcional
    - Si hire_date es en el año actual (p_year):
      * Calcular meses completos desde el mes de ingreso hasta diciembre
      * Fórmula: dias_base * meses_restantes / 12
    - Si hire_date es en años anteriores:
      * Otorgar el total de días según antigüedad
    
  3. Ejemplos
    - Empleado ingresa en julio 2026, días base: 20
      * Meses desde julio a diciembre: 6 meses
      * Días proporcionales: 20 * 6 / 12 = 10 días
    - Empleado ingresa en enero 2025, calculando para 2026, días base: 20
      * Año completo trabajado
      * Días totales: 20 días
*/

-- Eliminar función existente
DROP FUNCTION IF EXISTS calculate_vacation_days(uuid, date, date);

-- Crear función con tipo de retorno numeric para soportar decimales
CREATE OR REPLACE FUNCTION calculate_vacation_days(
  p_company_id uuid,
  p_hire_date date,
  p_calculation_date date DEFAULT CURRENT_DATE
)
RETURNS numeric AS $$
DECLARE
  v_base_days integer;
  v_additional_days_per_year integer;
  v_seniority_threshold integer;
  v_years_of_service numeric;
  v_additional_periods integer;
  v_total_days integer;
  v_year integer;
  v_hire_year integer;
  v_hire_month integer;
  v_months_in_year integer;
  v_prorated_days numeric;
BEGIN
  -- Obtener configuración de la empresa
  SELECT 
    vacation_days_per_year,
    vacation_days_per_seniority_year,
    vacation_seniority_years_threshold
  INTO v_base_days, v_additional_days_per_year, v_seniority_threshold
  FROM companies
  WHERE id = p_company_id;

  -- Calcular años de servicio
  v_years_of_service := EXTRACT(YEAR FROM AGE(p_calculation_date, p_hire_date));

  -- Calcular períodos completos de antigüedad
  v_additional_periods := FLOOR(v_years_of_service / v_seniority_threshold)::integer;

  -- Calcular días totales base (sin prorrateo)
  v_total_days := v_base_days + (v_additional_periods * v_additional_days_per_year);

  -- Obtener año de cálculo y año de contratación
  v_year := EXTRACT(YEAR FROM p_calculation_date);
  v_hire_year := EXTRACT(YEAR FROM p_hire_date);
  v_hire_month := EXTRACT(MONTH FROM p_hire_date);

  -- Si el empleado ingresó en el año de cálculo, prorratear
  IF v_hire_year = v_year THEN
    -- Calcular meses completos desde el mes de ingreso hasta fin de año
    -- Incluimos el mes de ingreso como mes completo
    v_months_in_year := 13 - v_hire_month;
    
    -- Calcular días prorrateados
    v_prorated_days := ROUND((v_total_days::numeric * v_months_in_year / 12), 2);
    
    RETURN v_prorated_days;
  ELSE
    -- Si ingresó en años anteriores, otorgar días completos
    RETURN v_total_days;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Actualizar función de generación de saldos para usar el nuevo cálculo
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
BEGIN
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
  LOOP
    -- Calcular días de vacaciones basado en antigüedad y prorrateo por fecha de ingreso
    v_vacation_days := calculate_vacation_days(
      p_company_id, 
      v_employee.hire_date, 
      make_date(p_year, 12, 31)  -- Calcular para fin del año
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

    -- Insertar o actualizar el saldo
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
      p_year,
      v_vacation_days,
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
  
  RAISE NOTICE 'Saldos generados exitosamente para % empleados', (
    SELECT COUNT(*) 
    FROM employees 
    WHERE company_id = p_company_id AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql;
