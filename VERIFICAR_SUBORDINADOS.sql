-- ============================================================================
-- QUERIES DE VERIFICACIÓN PARA SUBORDINADOS Y SOLICITUDES
-- ============================================================================

-- 1. Ver todos los empleados con sus jefes directos
SELECT
  e.id as empleado_id,
  e.first_name || ' ' || e.last_name as empleado,
  e.employee_number,
  e.direct_manager_id,
  m.first_name || ' ' || m.last_name as jefe_directo,
  m.employee_number as jefe_numero,
  e.status
FROM employees e
LEFT JOIN employees m ON e.direct_manager_id = m.id
ORDER BY m.last_name NULLS LAST, e.last_name;

-- 2. Ver quién tiene subordinados (potenciales jefes)
SELECT
  m.id as manager_id,
  m.first_name || ' ' || m.last_name as jefe,
  m.employee_number as jefe_numero,
  COUNT(e.id) as cantidad_subordinados,
  STRING_AGG(e.first_name || ' ' || e.last_name, ', ') as subordinados
FROM employees m
INNER JOIN employees e ON e.direct_manager_id = m.id
WHERE e.status = 'active' AND m.status = 'active'
GROUP BY m.id, m.first_name, m.last_name, m.employee_number
ORDER BY m.last_name;

-- 3. Ver todas las solicitudes con el jefe del empleado que la solicitó
SELECT
  lr.id as request_id,
  e.first_name || ' ' || e.last_name as empleado,
  e.employee_number,
  lr.status,
  lr.start_date,
  lr.end_date,
  lr.total_days,
  lt.name as tipo_licencia,
  m.first_name || ' ' || m.last_name as jefe_directo,
  m.employee_number as jefe_numero,
  e.direct_manager_id as manager_id
FROM leave_requests lr
INNER JOIN employees e ON lr.employee_id = e.id
LEFT JOIN employees m ON e.direct_manager_id = m.id
LEFT JOIN leave_types lt ON lr.leave_type_id = lt.id
ORDER BY lr.created_at DESC;

-- 4. Probar la función RPC manualmente
-- Reemplaza 'ID_DEL_JEFE' con el ID del empleado que es jefe
-- Ejemplo: SELECT * FROM get_subordinate_leave_requests('123e4567-e89b-12d3-a456-426614174000', NULL);
SELECT * FROM get_subordinate_leave_requests('REEMPLAZAR_CON_ID_DEL_JEFE', NULL);

-- 5. Ver vinculación entre app_users y employees
SELECT
  au.id as user_id,
  au.email,
  au.employee_id,
  e.first_name || ' ' || e.last_name as empleado,
  e.employee_number,
  e.direct_manager_id,
  m.first_name || ' ' || m.last_name as jefe_directo
FROM app_users au
LEFT JOIN employees e ON au.employee_id = e.id
LEFT JOIN employees m ON e.direct_manager_id = m.id
ORDER BY au.email;

-- 6. Contar subordinados por jefe
SELECT
  e.direct_manager_id as manager_id,
  m.first_name || ' ' || m.last_name as jefe,
  COUNT(*) as cantidad_subordinados
FROM employees e
INNER JOIN employees m ON e.direct_manager_id = m.id
WHERE e.status = 'active' AND m.status = 'active'
GROUP BY e.direct_manager_id, m.first_name, m.last_name;

-- 7. Ver solicitudes pendientes con información del jefe
SELECT
  lr.id,
  e.first_name || ' ' || e.last_name as empleado_solicitante,
  lr.status,
  lr.start_date,
  lr.end_date,
  lt.name as tipo_ausencia,
  m.first_name || ' ' || m.last_name as debe_aprobar,
  m.employee_number as numero_jefe,
  e.direct_manager_id
FROM leave_requests lr
INNER JOIN employees e ON lr.employee_id = e.id
LEFT JOIN employees m ON e.direct_manager_id = m.id
LEFT JOIN leave_types lt ON lr.leave_type_id = lt.id
WHERE lr.status = 'pending'
ORDER BY lr.created_at DESC;

-- ============================================================================
-- QUERIES PARA ASIGNAR JEFES (SI ES NECESARIO)
-- ============================================================================

-- 8. Asignar "Lemuel Hernandez" como jefe de "Pedro Ayala"
-- Primero, obtener los IDs:
SELECT
  id,
  first_name || ' ' || last_name as nombre,
  employee_number
FROM employees
WHERE (first_name = 'Lemuel' AND last_name = 'Hernandez')
   OR (first_name = 'Pedro' AND last_name = 'Ayala');

-- Luego ejecutar el UPDATE (reemplazar los IDs):
-- UPDATE employees
-- SET direct_manager_id = 'ID_DE_LEMUEL'
-- WHERE id = 'ID_DE_PEDRO';

-- 9. Ver empleados sin jefe asignado
SELECT
  id,
  first_name || ' ' || last_name as empleado,
  employee_number,
  status,
  direct_manager_id
FROM employees
WHERE direct_manager_id IS NULL
  AND status = 'active'
ORDER BY last_name, first_name;

-- ============================================================================
-- VERIFICACIÓN DE LA FUNCIÓN RPC
-- ============================================================================

-- 10. Verificar que la función existe
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name = 'get_subordinate_leave_requests';

-- 11. Ver la definición de la función
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'get_subordinate_leave_requests';
