# Instrucciones para Ejecutar Migraciones

## Error: "Could not find the table 'public.app_users'"

Si ves este error al sincronizar usuarios, significa que la tabla `app_users` no existe en tu base de datos Supabase.

## Solución

Necesitas ejecutar la migración SQL manualmente en tu base de datos Supabase.

### Opción 1: Usar el Dashboard de Supabase (Recomendado)

1. Ve a tu proyecto en [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Navega a **SQL Editor** en el menú lateral
3. Crea una nueva query
4. Copia y pega el contenido del archivo:
   ```
   supabase/migrations/20251115070000_create_app_users_table.sql
   ```
5. Haz clic en **RUN** para ejecutar la migración
6. Verifica que se ejecutó correctamente (debería mostrar "Success")

### Opción 2: Usar Supabase CLI

Si tienes Supabase CLI instalado:

```bash
# Navega al directorio del proyecto
cd /path/to/project

# Ejecuta las migraciones pendientes
supabase db push

# O ejecuta una migración específica
supabase db execute --file supabase/migrations/20251115070000_create_app_users_table.sql
```

## Verificar que la Migración se Aplicó

1. Ve al **Table Editor** en Supabase Dashboard
2. Busca la tabla `app_users`
3. Verifica que tiene las siguientes columnas:
   - id (uuid)
   - email (text)
   - name (text)
   - role (text)
   - permissions (jsonb)
   - metadata (jsonb)
   - is_active (boolean)
   - last_sync_at (timestamptz)
   - created_at (timestamptz)
   - updated_at (timestamptz)

## Después de Ejecutar la Migración

1. Regresa a la aplicación
2. Ve a **Configuración > Usuarios**
3. Haz clic en **"Sincronizar Usuarios"**
4. Ahora debería funcionar correctamente

## Lista de Todas las Migraciones

Asegúrate de que todas estas migraciones estén aplicadas:

1. `20251115034401_create_core_hcm_schema.sql`
2. `20251115035836_20251115_create_core_hcm_schema.sql`
3. `20251115035853_20251115_seed_test_data.sql`
4. `20251115035952_20251115_allow_employee_self_registration.sql`
5. `20251115042444_20251115_allow_company_creation_on_auth.sql`
6. `20251115042955_20251115_allow_anonymous_company_creation.sql`
7. `20251115050541_create_user_companies_table.sql`
8. `20251115050611_create_departments_table.sql`
9. `20251115050704_create_locations_settings_and_update_employees.sql`
10. `20251115055804_add_employee_documents_and_history.sql`
11. `20251115060409_create_configuration_tables.sql`
12. **`20251115070000_create_app_users_table.sql`** ← Esta es la nueva

## Contacto

Si sigues teniendo problemas, contacta al administrador del sistema con los detalles del error.
