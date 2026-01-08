/*
  # Corrección de Seguimiento de Días Pendientes en Solicitudes de Ausencia

  1. Propósito
    - Descontar días inmediatamente al crear una solicitud (pending_days)
    - Mover días de pending a used al aprobar
    - Devolver días al rechazar o eliminar solicitudes
    
  2. Lógica de Estados
    - CREATE: pending_days += días solicitados
    - APPROVE: pending_days -= días, used_days += días (con prioridad carryover)
    - REJECT: pending_days -= días
    - DELETE: pending_days -= días (si estaba pending)
    
  3. Funciones y Triggers
    - update_leave_balance_on_request_change() - Maneja INSERT/UPDATE/DELETE
    - Trigger que se ejecuta en todas las operaciones de leave_requests
*/

-- Eliminar el trigger anterior
DROP TRIGGER IF EXISTS trigger_update_leave_balance_on_approval ON leave_requests;
DROP FUNCTION IF EXISTS update_leave_balance_on_approval();

-- Nueva función que maneja todos los cambios de estado
CREATE OR REPLACE FUNCTION update_leave_balance_on_request_change()
RETURNS TRIGGER AS $$
DECLARE
  v_leave_balance record;
  v_days_to_process numeric(5,2);
  v_deduct_from_carryover numeric(5,2);
  v_deduct_from_current numeric(5,2);
  v_is_vacation boolean;
  v_year integer;
BEGIN
  -- Verificar si es tipo vacaciones
  IF TG_OP = 'DELETE' THEN
    SELECT LOWER(lt.code) = 'vac' INTO v_is_vacation
    FROM leave_types lt
    WHERE lt.id = OLD.leave_type_id;
    v_year := EXTRACT(YEAR FROM OLD.start_date);
  ELSE
    SELECT LOWER(lt.code) = 'vac' INTO v_is_vacation
    FROM leave_types lt
    WHERE lt.id = NEW.leave_type_id;
    v_year := EXTRACT(YEAR FROM NEW.start_date);
  END IF;

  -- Solo procesar si es tipo vacaciones
  IF NOT v_is_vacation THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  -- === OPERACIÓN: INSERT (Nueva solicitud) ===
  IF TG_OP = 'INSERT' THEN
    -- Agregar días a pending_days
    UPDATE leave_balances
    SET pending_days = pending_days + NEW.total_days
    WHERE employee_id = NEW.employee_id
      AND leave_type_id = NEW.leave_type_id
      AND year = v_year;
    
    RETURN NEW;
  END IF;

  -- === OPERACIÓN: UPDATE (Cambio de estado) ===
  IF TG_OP = 'UPDATE' THEN
    
    -- De PENDING a APPROVED
    IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
      v_days_to_process := NEW.total_days;
      
      -- Obtener saldo actual
      SELECT * INTO v_leave_balance
      FROM leave_balances
      WHERE employee_id = NEW.employee_id
        AND leave_type_id = NEW.leave_type_id
        AND year = v_year;
      
      IF FOUND THEN
        -- Primero descontar de días arrastrados
        v_deduct_from_carryover := LEAST(v_days_to_process, COALESCE(v_leave_balance.carryover_days, 0));
        v_days_to_process := v_days_to_process - v_deduct_from_carryover;
        
        -- Luego descontar de días del año actual
        v_deduct_from_current := v_days_to_process;
        
        -- Actualizar el saldo: mover de pending a used
        UPDATE leave_balances
        SET 
          pending_days = GREATEST(0, pending_days - NEW.total_days),
          carryover_days = GREATEST(0, COALESCE(carryover_days, 0) - v_deduct_from_carryover),
          used_days = used_days + v_deduct_from_current,
          carryover_expiry_date = CASE 
            WHEN (COALESCE(carryover_days, 0) - v_deduct_from_carryover) <= 0 THEN NULL
            ELSE carryover_expiry_date
          END
        WHERE id = v_leave_balance.id;
      END IF;
    END IF;
    
    -- De PENDING a REJECTED
    IF OLD.status = 'pending' AND NEW.status = 'rejected' THEN
      -- Devolver días de pending_days
      UPDATE leave_balances
      SET pending_days = GREATEST(0, pending_days - NEW.total_days)
      WHERE employee_id = NEW.employee_id
        AND leave_type_id = NEW.leave_type_id
        AND year = v_year;
    END IF;
    
    -- De APPROVED a REJECTED (caso especial: reversar aprobación)
    IF OLD.status = 'approved' AND NEW.status = 'rejected' THEN
      v_days_to_process := NEW.total_days;
      
      SELECT * INTO v_leave_balance
      FROM leave_balances
      WHERE employee_id = NEW.employee_id
        AND leave_type_id = NEW.leave_type_id
        AND year = v_year;
      
      IF FOUND THEN
        -- Devolver días de used_days (esta es una operación de reversión)
        UPDATE leave_balances
        SET used_days = GREATEST(0, used_days - v_days_to_process)
        WHERE id = v_leave_balance.id;
      END IF;
    END IF;
    
    RETURN NEW;
  END IF;

  -- === OPERACIÓN: DELETE (Eliminar solicitud) ===
  IF TG_OP = 'DELETE' THEN
    -- Si estaba pendiente, devolver días
    IF OLD.status = 'pending' THEN
      UPDATE leave_balances
      SET pending_days = GREATEST(0, pending_days - OLD.total_days)
      WHERE employee_id = OLD.employee_id
        AND leave_type_id = OLD.leave_type_id
        AND year = v_year;
    END IF;
    
    -- Si estaba aprobado, devolver días de used_days
    IF OLD.status = 'approved' THEN
      UPDATE leave_balances
      SET used_days = GREATEST(0, used_days - OLD.total_days)
      WHERE employee_id = OLD.employee_id
        AND leave_type_id = OLD.leave_type_id
        AND year = v_year;
    END IF;
    
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger que se ejecuta en todas las operaciones
CREATE TRIGGER trigger_update_leave_balance_on_request_change
  AFTER INSERT OR UPDATE OR DELETE ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_leave_balance_on_request_change();

-- Recalcular pending_days para solicitudes existentes
UPDATE leave_balances lb
SET pending_days = (
  SELECT COALESCE(SUM(lr.total_days), 0)
  FROM leave_requests lr
  JOIN leave_types lt ON lr.leave_type_id = lt.id
  WHERE lr.employee_id = lb.employee_id
    AND lr.leave_type_id = lb.leave_type_id
    AND EXTRACT(YEAR FROM lr.start_date) = lb.year
    AND lr.status = 'pending'
    AND LOWER(lt.code) = 'vac'
);
