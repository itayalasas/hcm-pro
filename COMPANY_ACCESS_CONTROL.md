# Control de Acceso por Empresa

## Roles del Sistema

### SuperAdmin
- **Descripción**: Administrador del sistema completo
- **Acceso**: Todas las empresas del sistema
- **Identificación**: `role === 'superadmin'` o `'super_admin'` o `'superadministrador'`
- **Uso**: Para gestión del sistema completo

### Admin
- **Descripción**: Administrador de empresa
- **Acceso**: Solo las empresas asignadas en `user_companies`
- **Identificación**: `role === 'admin'` o `'administrador'`
- **Uso**: Para gestionar una empresa específica

### Manager
- **Descripción**: Gerente de departamento/área
- **Acceso**: Solo las empresas asignadas en `user_companies`
- **Identificación**: `role === 'manager'`
- **Uso**: Para gestión de equipos dentro de una empresa

### Employee
- **Descripción**: Empleado regular
- **Acceso**: Solo las empresas asignadas en `user_companies`
- **Identificación**: `role === 'employee'`
- **Uso**: Para acceso básico de empleado

## Flujo de Autenticación y Selección de Empresa

### 1. Login
Usuario se autentica con el sistema externo y sus datos se sincronizan en `app_users`.

### 2. Selección de Empresa (CompanySelector)
- **SuperAdmin**: Ve todas las empresas del sistema
- **Otros roles**: Solo ven las empresas asignadas en `user_companies`

### 3. Empresa Seleccionada
La empresa seleccionada se guarda en:
- `localStorage`: `selected_company_id`
- `CompanyContext`: `selectedCompanyId` y `currentCompany`

## Aislamiento de Datos por Empresa

### Tablas con company_id
Todas las siguientes tablas DEBEN filtrar por `company_id`:

- `business_units`
- `company_settings`
- `cost_centers`
- `custom_fields`
- `departments`
- `employee_compensation`
- `employee_contracts`
- `employee_documents`
- `employee_personal_data`
- `employee_work_history`
- `employees`
- `evaluation_cycles`
- `evaluation_models`
- `evaluations`
- `leave_balances`
- `leave_requests`
- `leave_types`
- `payroll_concepts`
- `payroll_details`
- `payroll_periods`
- `positions`
- `system_parameters`
- `user_companies`
- `work_locations`
- `workflows`

### Implementación en Componentes

```typescript
import { useCompany } from '../contexts/CompanyContext';

function MyComponent() {
  const { selectedCompanyId } = useCompany();

  const loadData = async () => {
    // SIEMPRE filtrar por company_id
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('company_id', selectedCompanyId);
  };

  const createRecord = async (newData) => {
    // SIEMPRE incluir company_id al crear registros
    const { data, error } = await supabase
      .from('employees')
      .insert({
        ...newData,
        company_id: selectedCompanyId
      });
  };
}
```

## Políticas RLS (Row Level Security)

### Patrón Estándar para Tablas con company_id

```sql
-- Usuarios pueden ver registros de sus empresas asignadas
CREATE POLICY "Users can view their company data"
  ON table_name FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id
      FROM user_companies
      WHERE user_id = auth.uid()
      AND active = true
    )
  );

-- Admins pueden insertar en sus empresas
CREATE POLICY "Admins can insert company data"
  ON table_name FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
      AND uc.company_id = table_name.company_id
      AND uc.role IN ('admin', 'manager')
      AND uc.active = true
    )
  );
```

## Sincronización de Usuarios

### Edge Function: sync-users
Ubicación: `supabase/functions/sync-users/index.ts`

Esta función sincroniza usuarios del sistema externo a `app_users`:
- Se ejecuta después del login exitoso
- Crea o actualiza el registro en `app_users`
- Permite asignar empresas al usuario

## Verificaciones Importantes

### ✅ Hacer SIEMPRE:
1. Filtrar queries por `selectedCompanyId`
2. Incluir `company_id` al crear registros
3. Verificar que el usuario tenga acceso a la empresa
4. Usar el rol apropiado para permisos

### ❌ NO Hacer NUNCA:
1. Queries sin filtro de `company_id` (excepto SuperAdmin en casos específicos)
2. Crear registros sin `company_id`
3. Confiar solo en el frontend para seguridad
4. Permitir acceso a datos de otras empresas

## Debugging

### Ver empresas de un usuario:
```sql
SELECT
  uc.user_id,
  uc.company_id,
  uc.role,
  c.legal_name
FROM user_companies uc
JOIN companies c ON c.id = uc.company_id
JOIN app_users au ON au.id = uc.user_id
WHERE au.email = 'usuario@ejemplo.com';
```

### Ver rol del usuario:
```sql
SELECT id, email, name, role
FROM app_users
WHERE email = 'usuario@ejemplo.com';
```
