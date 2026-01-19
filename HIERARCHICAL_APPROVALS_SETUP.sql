/*
  ============================================================================
  SISTEMA DE APROBACIÓN JERÁRQUICA DE SOLICITUDES DE AUSENCIA
  ============================================================================

  INSTRUCCIONES:
  1. Abre el SQL Editor en tu dashboard de Supabase
  2. Copia y pega TODO este script
  3. Haz clic en "Run" para ejecutar

  Este script crea:
  - Función para obtener solicitudes de subordinados
  - Función para contar solicitudes pendientes
  - Función para verificar permisos de aprobación
  - Actualiza políticas RLS
  - Crea índices para mejor rendimiento
  ============================================================================
*/

-- Función para obtener solicitudes de ausencia de subordinados directos
CREATE OR REPLACE FUNCTION get_subordinate_leave_requests(
  p_manager_employee_id UUID,
  p_status TEXT DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  employee_id UUID,
  leave_type_id UUID,
  start_date DATE,
  end_date DATE,
  total_days NUMERIC,
  reason TEXT,
  status VARCHAR,
  approved_by UUID,
  approval_comments TEXT,
  approval_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  employee_first_name TEXT,
  employee_last_name TEXT,
  employee_number TEXT,
  leave_type_name TEXT,
  leave_type_code TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    lr.id,
    lr.employee_id,
    lr.leave_type_id,
    lr.start_date,
    lr.end_date,
    lr.total_days,
    lr.reason,
    lr.status,
    lr.approved_by,
    lr.approval_comments,
    lr.approval_date,
    lr.created_at,
    lr.updated_at,
    e.first_name as employee_first_name,
    e.last_name as employee_last_name,
    e.employee_number,
    lt.name as leave_type_name,
    lt.code as leave_type_code
  FROM leave_requests lr
  INNER JOIN employees e ON lr.employee_id = e.id
  LEFT JOIN leave_types lt ON lr.leave_type_id = lt.id
  WHERE e.direct_manager_id = p_manager_employee_id
    AND (p_status IS NULL OR lr.status = p_status)
  ORDER BY lr.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para contar solicitudes pendientes de subordinados
CREATE OR REPLACE FUNCTION count_pending_subordinate_requests(
  p_manager_employee_id UUID
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM leave_requests lr
  INNER JOIN employees e ON lr.employee_id = e.id
  WHERE e.direct_manager_id = p_manager_employee_id
    AND lr.status = 'pending';

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario puede aprobar una solicitud de ausencia
CREATE OR REPLACE FUNCTION can_approve_leave_request(
  p_approver_id UUID,
  p_leave_request_id UUID,
  p_company_id UUID
) RETURNS TABLE (
  can_approve BOOLEAN,
  reason TEXT
) AS $$
DECLARE
  v_employee_id UUID;
  v_manager_id UUID;
  v_approver_employee_id UUID;
BEGIN
  -- Obtener el ID del empleado de la solicitud
  SELECT employee_id INTO v_employee_id
  FROM leave_requests
  WHERE id = p_leave_request_id;

  IF v_employee_id IS NULL THEN
    RETURN QUERY SELECT false, 'Solicitud no encontrada';
    RETURN;
  END IF;

  -- Obtener el jefe directo del empleado
  SELECT direct_manager_id INTO v_manager_id
  FROM employees
  WHERE id = v_employee_id;

  -- Obtener el ID del empleado del aprobador
  SELECT employee_id INTO v_approver_employee_id
  FROM app_users
  WHERE id = p_approver_id OR email = (SELECT email FROM auth.users WHERE id = p_approver_id);

  -- Verificar si el aprobador es el jefe directo
  IF v_approver_employee_id = v_manager_id THEN
    RETURN QUERY SELECT true, 'Aprobador es el jefe directo';
    RETURN;
  END IF;

  -- Si no es el jefe directo, denegar
  RETURN QUERY SELECT false, 'No tienes permisos para aprobar esta solicitud. Solo el jefe directo puede aprobarla.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Añadir campo company_id a leave_requests si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leave_requests' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE leave_requests ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

    -- Poblar company_id desde employees
    UPDATE leave_requests lr
    SET company_id = e.company_id
    FROM employees e
    WHERE lr.employee_id = e.id AND lr.company_id IS NULL;

    -- Hacer el campo NOT NULL después de poblarlo (solo si hay datos)
    IF EXISTS (SELECT 1 FROM leave_requests WHERE company_id IS NOT NULL) THEN
      ALTER TABLE leave_requests ALTER COLUMN company_id SET NOT NULL;
    END IF;

    -- Crear índice
    CREATE INDEX IF NOT EXISTS idx_leave_requests_company ON leave_requests(company_id);
  END IF;
END $$;

-- Actualizar las políticas RLS de leave_requests
DROP POLICY IF EXISTS "External auth can view leave requests" ON leave_requests;
DROP POLICY IF EXISTS "External auth can insert leave requests" ON leave_requests;
DROP POLICY IF EXISTS "External auth can update leave requests" ON leave_requests;
DROP POLICY IF EXISTS "External auth can delete leave requests" ON leave_requests;

CREATE POLICY "External auth can view all leave requests"
  ON leave_requests FOR SELECT
  USING (true);

CREATE POLICY "External auth can insert leave requests"
  ON leave_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "External auth can update all leave requests"
  ON leave_requests FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "External auth can delete leave requests"
  ON leave_requests FOR DELETE
  USING (true);

-- Crear índices adicionales para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_employees_direct_manager ON employees(direct_manager_id);

/*
  ============================================================================
  VERIFICACIÓN (Ejecuta estos queries después para verificar)
  ============================================================================
*/

-- Verificar que las funciones se crearon correctamente
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name IN (
  'get_subordinate_leave_requests',
  'count_pending_subordinate_requests',
  'can_approve_leave_request'
)
ORDER BY routine_name;

-- Verificar que los índices se crearon
SELECT
  tablename,
  indexname
FROM pg_indexes
WHERE indexname IN (
  'idx_leave_requests_employee',
  'idx_leave_requests_status',
  'idx_employees_direct_manager',
  'idx_leave_requests_company'
)
ORDER BY tablename, indexname;

-- Verificar que el campo company_id existe
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'leave_requests'
  AND column_name = 'company_id';
