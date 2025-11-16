# Flujo de Autenticación Externa - HCM Pro

## Configuración

Las siguientes variables están configuradas en `.env`:

```env
VITE_AUTH_API_KEY=ak_production_d9e9d023c004378ce2957f1240677a41
VITE_AUTH_APP_ID=app_41e38063-776
VITE_AUTH_URL=https://auth-flowbridge.netlify.app
VITE_AUTH_CALLBACK_URL=https://zp1v56uxy8rdx5ypatb0ockcb9tr6a-oci3--5173--cf284e50.local-credentialless.webcontainer-api.io/callback
VITE_AUTH_EXCHANGE_URL=https://sfqtmnncgiqkveaoqckt.supabase.co/functions/v1/auth-exchange-code
```

## Flujo de Autenticación

### 1. Inicio de Sesión

Cuando el usuario hace clic en "Iniciar sesión con cuenta corporativa":

```
Usuario → HCM Pro → Redirección a sistema externo
```

**URL generada:**
```
https://auth-flowbridge.netlify.app/login?app_id=app_41e38063-776&redirect_uri=https%3A%2F%2F...%2Fcallback&api_key=ak_production_d9e9d023c004378ce2957f1240677a41
```

### 2. Callback de Autenticación

Después de autenticarse, el usuario es redirigido de vuelta con un código:

```
https://[tu-app]/callback?code=0ad141fe-719b-4d89-8932-6fe9c3e21815&state=authenticated
```

### 3. Intercambio de Código

La aplicación intercepta el código y hace una llamada a la API de exchange:

**Request:**
```json
POST https://sfqtmnncgiqkveaoqckt.supabase.co/functions/v1/auth-exchange-code

{
  "code": "0ad141fe-719b-4d89-8932-6fe9c3e21815",
  "application_id": "app_41e38063-776"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "Bearer",
    "expires_in": 86400,
    "user": {
      "id": "a61513a7-b090-498e-8e3b-1b93bf8c4971",
      "email": "payalaortiz@gmail.com",
      "name": "Pedro Ayala Ortiz",
      "role": "user",
      "permissions": {}
    },
    "tenant": {
      "id": "438694c9-b4bd-4c79-af93-8b1471bc66dd",
      "name": "Pedro Ayala Ortiz",
      "owner_user_id": "a61513a7-b090-498e-8e3b-1b93bf8c4971",
      "owner_email": "payalaortiz@gmail.com",
      "organization_name": "Pedro Ayala Ortiz Organization",
      "status": "active"
    },
    "has_access": false,
    "available_plans": []
  }
}
```

### 4. Creación/Vinculación de Datos

Una vez recibida la respuesta, el sistema automáticamente:

1. **Almacena tokens en localStorage:**
   - `external_auth_token`
   - `external_auth_refresh_token`
   - `external_auth_user`
   - `external_auth_tenant`
   - `external_auth_expires_at`

2. **Sincroniza usuario con app_users:** ⭐ NUEVO
   - Llama al edge function `sync-users`
   - Crea o actualiza el registro en `app_users`
   - Permite asignar empresas posteriormente

3. **Busca/Crea la empresa (Company):**
   - Si existe una empresa con el nombre de la organización del tenant → la usa
   - Si no existe → crea una nueva empresa con los datos del tenant

4. **Busca/Crea el empleado (Employee):**
   - Si existe un empleado con el email del usuario → lo vincula
   - Si no existe → crea un nuevo registro de empleado con:
     - Nombre completo parseado del campo `name`
     - Email del usuario
     - Número de empleado autogenerado
     - Vinculado a la empresa

### 5. Selección de Empresa

**Para SuperAdmin (role = 'superadmin'):**
- Ve TODAS las empresas del sistema
- Puede seleccionar cualquier empresa

**Para otros roles (admin, manager, employee):**
- Solo ve las empresas asignadas en `user_companies`
- Si no tiene empresas asignadas: Mensaje informativo
- Debe esperar a que un administrador le asigne una empresa

### 6. Acceso al Sistema

Una vez seleccionada la empresa:
- La empresa se guarda en `localStorage` como `selected_company_id`
- Se carga en `CompanyContext`
- Todos los datos se filtran automáticamente por `company_id`

## Archivos Clave

### 1. `src/lib/externalAuth.ts`
Maneja todas las operaciones de autenticación externa:
- Construcción de URL de login
- Intercambio de código por tokens
- Almacenamiento y recuperación de datos
- Verificación de expiración de tokens

### 2. `src/components/AuthCallback.tsx`
Componente que procesa la respuesta del sistema de autenticación:
- Extrae el código de la URL
- Llama a la API de exchange
- Crea/actualiza registros en la base de datos
- Maneja errores y estados de carga

### 3. `src/contexts/AuthContext.tsx`
Contexto global de autenticación:
- Verifica si el usuario está autenticado
- Carga los datos del empleado
- Proporciona funciones de logout
- Mantiene el estado de autenticación sincronizado

### 4. `src/App.tsx`
Componente principal que maneja el flujo:
- Muestra LoginPage si no está autenticado
- Detecta y maneja el callback
- Muestra el dashboard cuando está autenticado

## Seguridad

- Los tokens se almacenan en localStorage
- Las políticas RLS de Supabase protegen los datos
- Los tokens tienen expiración (24 horas por defecto)
- El sistema verifica la expiración antes de cada operación

## Flujo de Datos

```
┌─────────────┐
│  Usuario    │
└──────┬──────┘
       │ Click "Iniciar sesión"
       ▼
┌─────────────────────┐
│   Sistema Externo   │
│  (FlowBridge Auth)  │
└──────┬──────────────┘
       │ Callback con code
       ▼
┌─────────────────────┐
│   AuthCallback      │
│   Component         │
└──────┬──────────────┘
       │ Exchange code
       ▼
┌─────────────────────┐
│   API Exchange      │
│   (Edge Function)   │
└──────┬──────────────┘
       │ Tokens + User data
       ▼
┌─────────────────────┐
│   localStorage      │
│   + Supabase DB     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│   Dashboard         │
└─────────────────────┘
```

## Control de Acceso por Empresa

### Roles y Permisos

**SuperAdmin:**
- Role en API: `superadmin`, `super_admin`, o `superadministrador`
- Acceso: Todas las empresas del sistema

**Administrador:**
- Role en API: `administrador`, `administrator`, o `admin`
- Acceso: Solo empresas asignadas en `user_companies`

**Manager/Employee:**
- Role en API: `manager` o `employee`
- Acceso: Solo empresas asignadas en `user_companies`

### Asignación de Empresas

Los administradores pueden asignar empresas a usuarios desde:
```
Configuración > Usuarios > [Usuario] > Asignar Empresa
```

Esto crea un registro en `user_companies`:
```sql
INSERT INTO user_companies (user_id, company_id, role, is_default)
VALUES ('user-uuid', 'company-uuid', 'admin', true);
```

### Mensaje sin Empresas Asignadas

Si un usuario no tiene empresas asignadas, verá:
```
Sin Empresas Asignadas

Tu cuenta ha sido creada exitosamente, pero aún no
tienes acceso a ninguna empresa.

Siguiente paso:
Un administrador de la empresa debe asignarte acceso
antes de que puedas ingresar al sistema.
```

## Documentación Adicional

Ver `COMPANY_ACCESS_CONTROL.md` para:
- Detalles de implementación
- Políticas RLS
- Ejemplos de código
- Queries de verificación

## Próximos Pasos

1. ✅ Integración de autenticación externa
2. ✅ Sincronización automática de usuarios a app_users
3. ✅ Control de acceso basado en empresas asignadas
4. ✅ Aislamiento de datos por company_id
5. ⏳ Implementar refresh token automático
6. ⏳ Agregar manejo de permisos basado en `user.permissions`
7. ⏳ Implementar lógica de suscripciones con `has_access` y `available_plans`
