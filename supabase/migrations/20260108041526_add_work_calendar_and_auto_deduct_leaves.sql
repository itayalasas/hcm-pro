/*
  # Calendario Laboral y Descuento Automático de Vacaciones

  1. Propósito
    - Configurar días laborables y feriados por empresa
    - Descontar automáticamente días de vacaciones al aprobar solicitudes
    - Calcular días laborables entre fechas
    
  2. Nuevas Tablas
    - `work_weeks` - Configuración de días laborables por empresa
      - `company_id` (uuid, foreign key)
      - `monday`, `tuesday`, `wednesday`, `thursday`, `friday`, `saturday`, `sunday` (boolean)
      - `created_at`, `updated_at` (timestamptz)
    
    - `holidays` - Feriados y días no laborables
      - `company_id` (uuid, foreign key)
      - `date` (date)
      - `name` (varchar)
      - `recurring` (boolean) - Si se repite cada año
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      
  3. Funciones
    - `calculate_working_days(start_date, end_date, company_id)` - Calcula días laborables
    - `update_leave_balance_on_approval()` - Trigger para descontar días automáticamente
    
  4. Lógica de Descuento
    - Al aprobar una solicitud de vacaciones:
      - Primero descuenta de `carryover_days` (días arrastrados)
      - Luego descuenta de `total_days` (días del año actual)
      - Actualiza `used_days` en `leave_balances`
      - Si los días arrastrados se agotan, limpia `carryover_expiry_date`
*/

-- Tabla de configuración de días laborables
CREATE TABLE IF NOT EXISTS work_weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  monday boolean DEFAULT true,
  tuesday boolean DEFAULT true,
  wednesday boolean DEFAULT true,
  thursday boolean DEFAULT true,
  friday boolean DEFAULT true,
  saturday boolean DEFAULT false,
  sunday boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id)
);

ALTER TABLE work_weeks DISABLE ROW LEVEL SECURITY;

-- Tabla de feriados
CREATE TABLE IF NOT EXISTS holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  date date NOT NULL,
  name varchar(200) NOT NULL,
  recurring boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, date)
);

ALTER TABLE holidays DISABLE ROW LEVEL SECURITY;

-- Función para calcular días laborables entre dos fechas
CREATE OR REPLACE FUNCTION calculate_working_days(
  p_start_date date,
  p_end_date date,
  p_company_id uuid
)
RETURNS integer AS $$
DECLARE
  v_working_days integer := 0;
  v_current_date date;
  v_day_of_week integer;
  v_work_week record;
  v_is_holiday boolean;
BEGIN
  -- Obtener configuración de días laborables
  SELECT * INTO v_work_week
  FROM work_weeks
  WHERE company_id = p_company_id;
  
  -- Si no hay configuración, asumir lunes a viernes
  IF NOT FOUND THEN
    v_work_week.monday := true;
    v_work_week.tuesday := true;
    v_work_week.wednesday := true;
    v_work_week.thursday := true;
    v_work_week.friday := true;
    v_work_week.saturday := false;
    v_work_week.sunday := false;
  END IF;
  
  -- Iterar sobre cada día en el rango
  v_current_date := p_start_date;
  WHILE v_current_date <= p_end_date LOOP
    -- Obtener día de la semana (0=domingo, 1=lunes, ..., 6=sábado)
    v_day_of_week := EXTRACT(DOW FROM v_current_date);
    
    -- Verificar si es feriado
    SELECT EXISTS (
      SELECT 1 FROM holidays
      WHERE company_id = p_company_id
        AND is_active = true
        AND (
          date = v_current_date
          OR (recurring = true AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM v_current_date)
              AND EXTRACT(DAY FROM date) = EXTRACT(DAY FROM v_current_date))
        )
    ) INTO v_is_holiday;
    
    -- Contar si es día laborable y no es feriado
    IF NOT v_is_holiday THEN
      CASE v_day_of_week
        WHEN 0 THEN IF v_work_week.sunday THEN v_working_days := v_working_days + 1; END IF;
        WHEN 1 THEN IF v_work_week.monday THEN v_working_days := v_working_days + 1; END IF;
        WHEN 2 THEN IF v_work_week.tuesday THEN v_working_days := v_working_days + 1; END IF;
        WHEN 3 THEN IF v_work_week.wednesday THEN v_working_days := v_working_days + 1; END IF;
        WHEN 4 THEN IF v_work_week.thursday THEN v_working_days := v_working_days + 1; END IF;
        WHEN 5 THEN IF v_work_week.friday THEN v_working_days := v_working_days + 1; END IF;
        WHEN 6 THEN IF v_work_week.saturday THEN v_working_days := v_working_days + 1; END IF;
      END CASE;
    END IF;
    
    v_current_date := v_current_date + 1;
  END LOOP;
  
  RETURN v_working_days;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar saldos al aprobar solicitud
CREATE OR REPLACE FUNCTION update_leave_balance_on_approval()
RETURNS TRIGGER AS $$
DECLARE
  v_leave_balance record;
  v_days_to_deduct numeric(5,2);
  v_deduct_from_carryover numeric(5,2);
  v_deduct_from_current numeric(5,2);
  v_is_vacation boolean;
BEGIN
  -- Solo procesar si el estado cambió a 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    
    -- Verificar si es tipo vacaciones
    SELECT LOWER(code) = 'vac' INTO v_is_vacation
    FROM leave_types
    WHERE id = NEW.leave_type_id;
    
    -- Solo descontar si es tipo vacaciones
    IF v_is_vacation THEN
      v_days_to_deduct := NEW.total_days;
      
      -- Obtener saldo actual
      SELECT * INTO v_leave_balance
      FROM leave_balances
      WHERE employee_id = NEW.employee_id
        AND leave_type_id = NEW.leave_type_id
        AND year = EXTRACT(YEAR FROM NEW.start_date);
      
      IF FOUND THEN
        -- Primero descontar de días arrastrados
        v_deduct_from_carryover := LEAST(v_days_to_deduct, COALESCE(v_leave_balance.carryover_days, 0));
        v_days_to_deduct := v_days_to_deduct - v_deduct_from_carryover;
        
        -- Luego descontar de días del año actual
        v_deduct_from_current := v_days_to_deduct;
        
        -- Actualizar el saldo
        UPDATE leave_balances
        SET 
          carryover_days = GREATEST(0, COALESCE(carryover_days, 0) - v_deduct_from_carryover),
          used_days = used_days + v_deduct_from_current,
          carryover_expiry_date = CASE 
            WHEN (COALESCE(carryover_days, 0) - v_deduct_from_carryover) <= 0 THEN NULL
            ELSE carryover_expiry_date
          END
        WHERE id = v_leave_balance.id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualización automática
DROP TRIGGER IF EXISTS trigger_update_leave_balance_on_approval ON leave_requests;
CREATE TRIGGER trigger_update_leave_balance_on_approval
  AFTER UPDATE ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_leave_balance_on_approval();

-- Insertar configuración por defecto para empresas existentes
INSERT INTO work_weeks (company_id, monday, tuesday, wednesday, thursday, friday, saturday, sunday)
SELECT id, true, true, true, true, true, false, false
FROM companies
WHERE id NOT IN (SELECT company_id FROM work_weeks)
ON CONFLICT (company_id) DO NOTHING;
