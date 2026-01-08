/*
  # Configuración de Vacaciones

  1. Propósito
    - Agregar configuración de vacaciones por empresa
    - Definir días por defecto, días por antigüedad, y arrastre de días
    
  2. Cambios
    - Agregar columnas a tabla `companies`:
      - `vacation_days_per_year` (integer) - Días de vacaciones por defecto al año
      - `vacation_days_per_seniority_year` (integer) - Días adicionales por año de antigüedad
      - `vacation_seniority_years_threshold` (integer) - Años de antigüedad para sumar días adicionales
      - `vacation_allow_carryover` (boolean) - Permitir arrastrar días no usados
      - `vacation_max_carryover_days` (integer) - Máximo de días que se pueden arrastrar
      - `vacation_carryover_expiry_months` (integer) - Meses para usar días arrastrados
    
  3. Valores por Defecto
    - vacation_days_per_year: 20
    - vacation_days_per_seniority_year: 1
    - vacation_seniority_years_threshold: 5
    - vacation_allow_carryover: true
    - vacation_max_carryover_days: 5
    - vacation_carryover_expiry_months: 3
*/

-- Agregar columnas de configuración de vacaciones a companies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'vacation_days_per_year'
  ) THEN
    ALTER TABLE companies ADD COLUMN vacation_days_per_year integer DEFAULT 20;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'vacation_days_per_seniority_year'
  ) THEN
    ALTER TABLE companies ADD COLUMN vacation_days_per_seniority_year integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'vacation_seniority_years_threshold'
  ) THEN
    ALTER TABLE companies ADD COLUMN vacation_seniority_years_threshold integer DEFAULT 5;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'vacation_allow_carryover'
  ) THEN
    ALTER TABLE companies ADD COLUMN vacation_allow_carryover boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'vacation_max_carryover_days'
  ) THEN
    ALTER TABLE companies ADD COLUMN vacation_max_carryover_days integer DEFAULT 5;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'vacation_carryover_expiry_months'
  ) THEN
    ALTER TABLE companies ADD COLUMN vacation_carryover_expiry_months integer DEFAULT 3;
  END IF;
END $$;

-- Agregar columna para tracking de días arrastrados en leave_balances
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leave_balances' AND column_name = 'carryover_days'
  ) THEN
    ALTER TABLE leave_balances ADD COLUMN carryover_days numeric(5,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leave_balances' AND column_name = 'carryover_expiry_date'
  ) THEN
    ALTER TABLE leave_balances ADD COLUMN carryover_expiry_date date;
  END IF;
END $$;

-- Función para calcular días de vacaciones basado en antigüedad
CREATE OR REPLACE FUNCTION calculate_vacation_days(
  p_company_id uuid,
  p_hire_date date,
  p_calculation_date date DEFAULT CURRENT_DATE
)
RETURNS integer AS $$
DECLARE
  v_base_days integer;
  v_additional_days_per_year integer;
  v_seniority_threshold integer;
  v_years_of_service numeric;
  v_additional_periods integer;
  v_total_days integer;
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

  -- Calcular días totales
  v_total_days := v_base_days + (v_additional_periods * v_additional_days_per_year);

  RETURN v_total_days;
END;
$$ LANGUAGE plpgsql;

-- Función para generar saldos de vacaciones automáticamente
CREATE OR REPLACE FUNCTION generate_annual_vacation_balances(
  p_company_id uuid,
  p_year integer
)
RETURNS void AS $$
DECLARE
  v_employee record;
  v_vacation_type_id uuid;
  v_vacation_days integer;
  v_carryover_days numeric(5,2);
  v_allow_carryover boolean;
  v_max_carryover integer;
  v_expiry_months integer;
  v_previous_balance record;
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
    -- Calcular días de vacaciones basado en antigüedad
    v_vacation_days := calculate_vacation_days(p_company_id, v_employee.hire_date, make_date(p_year, 1, 1));

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
      pending_days
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
      0
    )
    ON CONFLICT (employee_id, leave_type_id, year)
    DO UPDATE SET
      total_days = EXCLUDED.total_days,
      carryover_days = EXCLUDED.carryover_days,
      carryover_expiry_date = EXCLUDED.carryover_expiry_date;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Agregar constraint único en leave_balances si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'leave_balances_employee_type_year_key'
  ) THEN
    ALTER TABLE leave_balances
    ADD CONSTRAINT leave_balances_employee_type_year_key
    UNIQUE (employee_id, leave_type_id, year);
  END IF;
END $$;
