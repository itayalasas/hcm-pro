/*
  # Deshabilitar RLS en app_users para autenticación externa

  1. Changes
    - Deshabilitar RLS en app_users
    - Eliminar todas las políticas RLS existentes
    
  2. Reason
    - El sistema usa autenticación externa, no Supabase Auth
    - auth.uid() devuelve NULL con autenticación externa
    - Las políticas RLS bloquean inserts durante el callback de autenticación
    - El control de acceso se maneja a nivel de aplicación
*/

-- Deshabilitar RLS en app_users
ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas RLS existentes
DROP POLICY IF EXISTS "Authenticated users can view all users" ON app_users;
DROP POLICY IF EXISTS "Prevent direct insert" ON app_users;
DROP POLICY IF EXISTS "Prevent direct update" ON app_users;
DROP POLICY IF EXISTS "Prevent direct delete" ON app_users;
DROP POLICY IF EXISTS "Usuarios pueden ver su propio registro" ON app_users;
DROP POLICY IF EXISTS "Administradores pueden ver todos los usuarios" ON app_users;

COMMENT ON TABLE app_users IS 'Tabla de usuarios de aplicación. RLS deshabilitado para external auth. Acceso público permitido.';
