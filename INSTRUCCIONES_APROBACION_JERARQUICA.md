# Sistema de Aprobación Jerárquica - Instrucciones

## 📋 Resumen

Este sistema permite que los jefes directos aprueben/rechacen las solicitudes de ausencia de sus subordinados directos basándose en el campo `direct_manager_id` de la tabla `employees`.

---

## 🔧 Paso 1: Ejecutar el Script SQL

1. Ve a tu Dashboard de Supabase
2. Abre el **SQL Editor**
3. Abre el archivo `HIERARCHICAL_APPROVALS_SETUP.sql`
4. Copia TODO el contenido del archivo
5. Pégalo en el SQL Editor
6. Haz clic en **Run** (▶️)
7. Verifica que no haya errores

### ✅ Verificación

Al final del script hay queries de verificación. Deberías ver:
- **3 funciones** creadas: `get_subordinate_leave_requests`, `count_pending_subordinate_requests`, `can_approve_leave_request`
- **4 índices** creados
- Campo `company_id` en la tabla `leave_requests`

---

## 👥 Paso 2: Asignar Jefes Directos a Empleados

Para que el sistema funcione, necesitas asignar el campo `direct_manager_id` en cada empleado.

### Opción A: Desde la Interfaz (Recomendado)

1. Ve a **Empleados** → Selecciona un empleado
2. En el perfil del empleado, busca el campo **"Jefe Directo"** o **"Manager"**
3. Selecciona quién es el jefe directo de ese empleado
4. Guarda los cambios

### Opción B: Desde SQL (Para múltiples empleados)

```sql
-- Ejemplo: Asignar jefes directos
UPDATE employees
SET direct_manager_id = '00000000-0000-0000-0000-000000000001' -- ID del jefe
WHERE id IN (
  '00000000-0000-0000-0000-000000000002', -- ID del subordinado 1
  '00000000-0000-0000-0000-000000000003'  -- ID del subordinado 2
);
```

### Verificar Asignaciones

```sql
-- Ver la jerarquía de empleados
SELECT
  e.first_name || ' ' || e.last_name as empleado,
  e.employee_number,
  m.first_name || ' ' || m.last_name as jefe_directo,
  m.employee_number as jefe_numero
FROM employees e
LEFT JOIN employees m ON e.direct_manager_id = m.id
WHERE e.status = 'active'
ORDER BY m.last_name, e.last_name;
```

---

## 🚀 Paso 3: Probar el Sistema

### 1. Crear una Solicitud de Ausencia

1. Inicia sesión como un **empleado que tenga un jefe asignado**
2. Ve a **Tiempo y Asistencia** → **Solicitudes de Ausencia**
3. Crea una nueva solicitud
4. Verifica que el estado sea **"Pendiente"**

### 2. Aprobar como Jefe

1. **Cierra sesión** del empleado
2. Inicia sesión como el **jefe directo** de ese empleado
3. Ve a **Tiempo y Asistencia** → **Solicitudes de Ausencia**
4. Deberías ver **DOS pestañas**:
   - **"Mis Solicitudes"**: Tus propias solicitudes
   - **"Solicitudes de Mi Equipo"**: Solicitudes de tus subordinados

5. Haz clic en **"Solicitudes de Mi Equipo"**
6. Verás las solicitudes pendientes de tus subordinados
7. Verás los botones **✓ Aprobar** y **✗ Rechazar**
8. Haz clic en uno de los botones para aprobar o rechazar

### 3. Verificar Notificaciones

- Al iniciar sesión como jefe, si hay solicitudes pendientes, aparecerá una **notificación** en la esquina superior derecha
- La notificación muestra el número de solicitudes pendientes
- Haz clic en **"Ver Solicitudes"** para ir directamente

---

## 🔍 Depuración

### Problema: No veo los botones de Aprobar/Rechazar

**Posible causa 1**: No estás en la pestaña correcta
- ✅ Verifica que estés en la pestaña **"Solicitudes de Mi Equipo"**

**Posible causa 2**: El empleado no tiene jefe asignado
```sql
-- Verificar si el empleado de la solicitud tiene jefe
SELECT
  e.first_name || ' ' || e.last_name as empleado,
  e.direct_manager_id,
  m.first_name || ' ' || m.last_name as jefe
FROM employees e
LEFT JOIN employees m ON e.direct_manager_id = m.id
WHERE e.id = 'ID_DEL_EMPLEADO_DE_LA_SOLICITUD';
```

**Posible causa 3**: Las funciones no se ejecutaron correctamente
```sql
-- Verificar que las funciones existen
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'get_subordinate_leave_requests';
```

### Problema: No veo solicitudes en "Solicitudes de Mi Equipo"

**Verificar subordinados**:
```sql
-- Ver quiénes son tus subordinados directos
SELECT
  e.first_name || ' ' || e.last_name as subordinado,
  e.employee_number,
  e.status
FROM employees e
WHERE e.direct_manager_id = 'TU_EMPLOYEE_ID'
  AND e.status = 'active';
```

**Verificar solicitudes de subordinados**:
```sql
-- Ver solicitudes de tus subordinados
SELECT
  lr.id,
  e.first_name || ' ' || e.last_name as empleado,
  lt.name as tipo_ausencia,
  lr.start_date,
  lr.end_date,
  lr.status
FROM leave_requests lr
INNER JOIN employees e ON lr.employee_id = e.id
LEFT JOIN leave_types lt ON lr.leave_type_id = lt.id
WHERE e.direct_manager_id = 'TU_EMPLOYEE_ID'
ORDER BY lr.created_at DESC;
```

### Verificar logs en el navegador

1. Abre las **DevTools** (F12)
2. Ve a la pestaña **Console**
3. Busca logs como:
   - `"Loading subordinate requests for manager: [ID]"`
   - `"Subordinate requests loaded: [número]"`
   - `"Render state: { viewMode, subordinateRequestsCount, ... }"`

---

## 📊 Flujo Completo

```
┌─────────────────┐
│   Empleado      │
│  Crea Solicitud │
└────────┬────────┘
         │
         ↓
┌─────────────────────┐
│ Estado: PENDIENTE   │
└────────┬────────────┘
         │
         ↓
┌─────────────────────┐
│   Jefe Directo      │
│  Ve Notificación    │
└────────┬────────────┘
         │
         ↓
┌─────────────────────────────┐
│ Revisa en "Mi Equipo"       │
│ Ve botones Aprobar/Rechazar │
└────────┬────────────────────┘
         │
         ↓
┌─────────────────────┐
│ Hace clic en:       │
│ ✓ Aprobar           │
│ ✗ Rechazar          │
└────────┬────────────┘
         │
         ↓
┌─────────────────────┐
│ Estado actualizado  │
│ APROBADA/RECHAZADA  │
└─────────────────────┘
```

---

## 📝 Notas Importantes

1. **Un jefe solo puede aprobar solicitudes de sus subordinados directos** (no indirectos)
2. **El campo `direct_manager_id` es crítico** - sin él, no funcionará
3. **Las notificaciones se actualizan cada 60 segundos** automáticamente
4. **Los empleados no ven la pestaña "Mi Equipo"** si no tienen subordinados asignados
5. **El sistema usa el campo `employee.id`** del jefe para la validación, no el `user.id`

---

## 🆘 Soporte

Si algo no funciona:
1. Verifica los logs en la consola del navegador (F12)
2. Verifica la asignación de `direct_manager_id` en la base de datos
3. Verifica que las funciones SQL se crearon correctamente
4. Verifica que el usuario tenga un registro en `app_users` vinculado a un `employee_id`
