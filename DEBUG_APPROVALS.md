# Guía de Depuración - Botones de Aprobación

## 🔍 Cambios Realizados

### 1. **Sistema de Detección de Líderes**
- Agregué un estado `isManager` que verifica si el usuario tiene subordinados
- La verificación se hace consultando la tabla `employees` buscando registros donde `direct_manager_id = employee.id`
- Las pestañas "Mis Solicitudes" / "Solicitudes de Mi Equipo" ahora se muestran basándose en `isManager` en lugar de `subordinateRequests.length > 0`

### 2. **Logs Detallados**
El sistema ahora imprime logs en la consola para ayudar a identificar problemas:

#### Log General (cada render):
```javascript
{
  viewMode: 'my' | 'team',
  isManager: true | false,
  checkingManager: true | false,
  subordinateRequestsCount: número,
  requestsCount: número,
  employeeId: 'uuid',
  filteredRequestsCount: número,
  currentRequestsCount: número
}
```

#### Log por cada solicitud:
```javascript
{
  status: 'pending' | 'approved' | 'rejected',
  isPending: true | false,
  viewMode: 'my' | 'team',
  canApprove: true | false,
  shouldShowButtons: true | false
}
```

---

## 🚀 Pasos para Verificar

### Paso 1: Ejecutar el SQL
Asegúrate de haber ejecutado el archivo **`HIERARCHICAL_APPROVALS_SETUP.sql`** en Supabase.

### Paso 2: Verificar Asignaciones de Jefes
```sql
-- Ver todos los empleados con sus jefes directos
SELECT
  e.id,
  e.first_name || ' ' || e.last_name as empleado,
  e.employee_number,
  e.direct_manager_id,
  m.first_name || ' ' || m.last_name as jefe_directo,
  m.employee_number as jefe_numero
FROM employees e
LEFT JOIN employees m ON e.direct_manager_id = m.id
WHERE e.status = 'active'
ORDER BY m.last_name, e.last_name;
```

**IMPORTANTE**: Si `direct_manager_id` es NULL, ese empleado NO tiene jefe asignado.

### Paso 3: Asignar un Jefe a un Empleado
Si un empleado no tiene jefe asignado:

```sql
-- Ejemplo: Asignar "Lemuel Hernandez" como jefe de "Pedro Ayala"
UPDATE employees
SET direct_manager_id = (
  SELECT id FROM employees
  WHERE first_name = 'Lemuel' AND last_name = 'Hernandez'
)
WHERE first_name = 'Pedro' AND last_name = 'Ayala';
```

### Paso 4: Vincular Usuario con Empleado
El usuario debe tener un registro en `app_users` vinculado a un `employee_id`:

```sql
-- Verificar vinculación
SELECT
  au.id,
  au.email,
  au.employee_id,
  e.first_name || ' ' || e.last_name as empleado
FROM app_users au
LEFT JOIN employees e ON au.employee_id = e.id
WHERE au.email = 'tu-email@ejemplo.com';
```

Si el `employee_id` es NULL, el sistema NO funcionará. Necesitas vincularlo:

```sql
UPDATE app_users
SET employee_id = (SELECT id FROM employees WHERE email = 'tu-email@ejemplo.com')
WHERE email = 'tu-email@ejemplo.com';
```

### Paso 5: Abrir la Consola del Navegador
1. Abre la aplicación en el navegador
2. Presiona **F12** para abrir DevTools
3. Ve a la pestaña **Console**
4. Inicia sesión como un usuario que sea jefe
5. Ve a **Tiempo y Asistencia** → **Solicitudes de Ausencia**

---

## 📊 Qué Buscar en la Consola

### Al cargar el componente:

```
✅ Debe aparecer:
"Is manager: true, Employee ID: [uuid]"
"Loading subordinate requests for manager: [uuid]"
"Subordinate requests loaded: [número]"

❌ Si aparece:
"Is manager: false" → El usuario NO tiene subordinados asignados
"No employee ID available for loading subordinate requests" → El usuario no está vinculado a un empleado
```

### Al renderizar:

```
✅ Debe aparecer:
Render state: {
  viewMode: 'my' o 'team',
  isManager: true,  ← Debe ser true si es jefe
  checkingManager: false,
  subordinateRequestsCount: [número mayor a 0],
  ...
}

Request [id] (Nombre): {
  status: 'pending',
  isPending: true,
  viewMode: 'team',  ← Debe ser 'team' para ver botones
  canApprove: true,   ← Debe ser true
  shouldShowButtons: true  ← Debe ser true para mostrar botones
}
```

### Si NO ves los botones:

Revisa el log de cada solicitud:

```javascript
Request [id] (Nombre): {
  status: 'approved',  ← ❌ Solo solicitudes 'pending' tienen botones
  isPending: false,
  viewMode: 'my',      ← ❌ Debe ser 'team' para jefes
  canApprove: false,   ← ❌ Debe ser true
  shouldShowButtons: false
}
```

---

## 🔧 Solución de Problemas Comunes

### Problema 1: "isManager: false"
**Causa**: El usuario no tiene subordinados asignados.

**Solución**:
```sql
-- Verificar si tiene subordinados
SELECT
  id,
  first_name || ' ' || last_name as subordinado
FROM employees
WHERE direct_manager_id = 'ID_DEL_JEFE'
  AND status = 'active';

-- Si devuelve 0 resultados, asigna subordinados:
UPDATE employees
SET direct_manager_id = 'ID_DEL_JEFE'
WHERE id IN ('ID_SUBORDINADO_1', 'ID_SUBORDINADO_2');
```

### Problema 2: "No employee ID available"
**Causa**: El usuario no está vinculado a un empleado en `app_users`.

**Solución**:
```sql
-- Vincular usuario con empleado
UPDATE app_users
SET employee_id = 'ID_DEL_EMPLEADO'
WHERE email = 'email-del-usuario@ejemplo.com';
```

### Problema 3: Las pestañas no aparecen
**Causa**: `isManager` es false.

**Verificación**:
1. Abre la consola
2. Busca el log: `"Is manager: false"`
3. Sigue la solución del Problema 1

### Problema 4: viewMode siempre es 'my'
**Causa**: No estás haciendo clic en la pestaña "Solicitudes de Mi Equipo".

**Solución**:
1. Asegúrate de que las pestañas estén visibles (deben aparecer si `isManager: true`)
2. Haz clic en la pestaña **"Solicitudes de Mi Equipo"**
3. El log debe cambiar a `viewMode: 'team'`

### Problema 5: subordinateRequestsCount es 0
**Causa**: La función RPC no está devolviendo solicitudes.

**Verificación**:
```sql
-- Ejecutar la función manualmente
SELECT * FROM get_subordinate_leave_requests('ID_DEL_JEFE', NULL);

-- Si devuelve 0 resultados, verifica:
-- 1. Que los subordinados tengan solicitudes
SELECT
  lr.id,
  e.first_name || ' ' || e.last_name as empleado,
  lr.status
FROM leave_requests lr
INNER JOIN employees e ON lr.employee_id = e.id
WHERE e.direct_manager_id = 'ID_DEL_JEFE';
```

---

## ✅ Lista de Verificación Final

Antes de reportar un problema, verifica:

- [ ] El script SQL fue ejecutado sin errores
- [ ] El empleado tiene `direct_manager_id` asignado (verificado en SQL)
- [ ] El usuario en `app_users` tiene `employee_id` vinculado
- [ ] El usuario que es jefe tiene al menos un subordinado activo
- [ ] El subordinado tiene al menos una solicitud creada
- [ ] La consola muestra `isManager: true` para el jefe
- [ ] La consola muestra `subordinateRequestsCount > 0`
- [ ] Las pestañas "Mis Solicitudes" / "Mi Equipo" son visibles
- [ ] Has hecho clic en la pestaña "Solicitudes de Mi Equipo"
- [ ] La consola muestra `viewMode: 'team'` después de hacer clic
- [ ] La solicitud tiene `status: 'pending'`

---

## 📝 Información a Reportar

Si después de seguir todos los pasos aún no funciona, proporciona:

1. **Screenshot de la consola** con todos los logs
2. **Resultado del query**:
```sql
SELECT
  e.id as empleado_id,
  e.first_name || ' ' || e.last_name as empleado,
  e.email,
  e.direct_manager_id,
  m.first_name || ' ' || m.last_name as jefe,
  au.id as app_user_id,
  au.employee_id as au_employee_id
FROM employees e
LEFT JOIN employees m ON e.direct_manager_id = m.id
LEFT JOIN app_users au ON au.employee_id = e.id
WHERE e.email = 'EMAIL_DEL_USUARIO_CON_PROBLEMA';
```

3. **Resultado del query**:
```sql
SELECT * FROM get_subordinate_leave_requests('ID_DEL_JEFE', NULL);
```

4. **Screenshot** de la pantalla mostrando las pestañas (o falta de ellas)
