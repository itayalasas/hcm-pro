# Flujo de Acceso para Empleados

## Descripción General

Este documento describe el flujo de autenticación y acceso para usuarios con rol de "empleado" en el sistema HCM Pro.

## Diferencias entre Roles

### Administrador / Usuario Regular
- Debe seleccionar manualmente la empresa con la que desea trabajar
- Ve un selector de empresas después de autenticarse
- Puede cambiar entre diferentes empresas si tiene acceso a múltiples

### Empleado
- **NO** selecciona empresa manualmente
- Se carga automáticamente la empresa a la que pertenece
- Solo tiene acceso a los módulos especificados en sus permisos
- Solo puede ver información de su propia empresa

## Flujo de Autenticación para Empleados

### 1. Autenticación Externa
El empleado inicia sesión a través del sistema de autenticación corporativa externo.

### 2. Datos de Autenticación
La respuesta de autenticación incluye:

```json
{
  "user": {
    "id": "52c946fb-570d-4989-bc1b-bc84c7d09b9e",
    "email": "empleado@empresa.com",
    "name": "Juan Pérez",
    "role": "empleado",
    "permissions": {
      "tiempo": ["create", "read"],
      "documentacion": ["read"]
    },
    "metadata": {},
    "created_at": "2026-01-10T03:50:14.254437+00:00"
  },
  "has_access": true
}
```

### 3. Carga de Datos del Empleado
El sistema busca automáticamente en la tabla `employees` usando el email del usuario:

```sql
SELECT * FROM employees WHERE email = 'empleado@empresa.com';
```

### 4. Validación de Empresa
- Si el empleado tiene un `company_id` asignado: ✅ Se carga automáticamente la empresa
- Si el empleado NO tiene `company_id`: ❌ Se muestra mensaje de error solicitando contactar al administrador

### 5. Acceso al Sistema
Una vez cargada la empresa, el empleado:
- Ve solo los módulos para los que tiene permisos
- Accede únicamente a datos de su empresa
- No puede cambiar de empresa

## Módulos Típicos para Empleados

Los empleados normalmente tienen acceso a:

### Tiempo y Asistencia
- Solicitar ausencias/vacaciones
- Ver saldos de ausencias
- Consultar calendario del equipo

### Documentación
- Consultar políticas de la empresa
- Descargar formularios
- Ver procedimientos

### Mi Perfil
- Ver información personal
- Actualizar datos de contacto (si tiene permiso)

## Permisos

Los permisos se definen por módulo y pueden ser:

- `read`: Ver información
- `create`: Crear nuevos registros
- `update`: Modificar registros existentes
- `delete`: Eliminar registros

Ejemplo de permisos para un empleado estándar:

```json
{
  "permissions": {
    "tiempo": ["create", "read"],
    "documentacion": ["read"],
    "perfil": ["read", "update"]
  }
}
```

## Validación de Empresa

### Caso 1: Empleado con Empresa Asignada ✅
```
Usuario autenticado → Se carga employee.company_id → Acceso al sistema
```

### Caso 2: Empleado sin Empresa Asignada ❌
```
Usuario autenticado → employee.company_id = NULL → Mensaje de error
```

**Mensaje mostrado:**
> "Tu cuenta de empleado no tiene una empresa asignada. Por favor, contacta al administrador del sistema para que te asigne a una empresa."

## Implementación Técnica

### AuthContext
```typescript
interface AuthContextType {
  user: ExternalAuthUser | null;
  employee: Employee | null;
  isEmployee: boolean;
  employeeCompanyId: string | null;
  // ... otros campos
}
```

### CompanyContext
```typescript
// Función para cargar automáticamente la empresa del empleado
autoLoadEmployeeCompany(companyId: string): Promise<void>
```

### App.tsx
```typescript
// Lógica de validación
if (isEmployee && !employeeCompanyId) {
  // Mostrar error
}

if (!selectedCompanyId && !isEmployee) {
  // Mostrar selector de empresa (solo para no-empleados)
}
```

## Configuración de Empleados en la Base de Datos

Para que un empleado tenga acceso correcto, debe:

1. **Existir en la tabla `employees`** con su email
2. **Tener un `company_id` asignado** en la tabla `employees`
3. **Tener permisos configurados** en el sistema de autenticación externo
4. **Tener `has_access: true`** en la respuesta de autenticación

### Ejemplo de Registro de Empleado

```sql
INSERT INTO employees (
  company_id,
  employee_code,
  first_name,
  last_name,
  email,
  hire_date,
  active
) VALUES (
  'uuid-de-la-empresa',
  'EMP-001',
  'Juan',
  'Pérez',
  'juan.perez@empresa.com',
  '2025-01-15',
  true
);
```

## Seguridad

- Los empleados solo pueden acceder a datos de su propia empresa (controlado por RLS)
- Los permisos se validan en cada operación
- No pueden cambiar de empresa manualmente
- El `company_id` está protegido contra modificaciones no autorizadas

## Troubleshooting

### Empleado no puede acceder
1. Verificar que existe en la tabla `employees`
2. Verificar que tiene `company_id` asignado
3. Verificar que tiene permisos configurados
4. Verificar que `has_access: true` en autenticación

### Empleado ve "Sin Empresa Asignada"
1. Asignar `company_id` en la tabla `employees`
2. Refrescar la página o volver a autenticarse
