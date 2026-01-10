/*
  # Deshabilitar RLS en user_companies para autenticación externa

  1. Changes
    - Deshabilitar RLS en user_companies
    - Eliminar todas las políticas RLS existentes
    
  2. Reason
    - El sistema usa autenticación externa, no Supabase Auth
    - auth.uid() devuelve NULL con autenticación externa
    - Las políticas RLS bloquean todo acceso
    - El control de acceso se maneja mediante set_current_user function
*/

-- Deshabilitar RLS en user_companies
ALTER TABLE user_companies DISABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas RLS existentes
DROP POLICY IF EXISTS "Users can view their own company associations" ON user_companies;
DROP POLICY IF EXISTS "Users can insert their first company" ON user_companies;
DROP POLICY IF EXISTS "Admins can manage company users" ON user_companies;
DROP POLICY IF EXISTS "Admins can view all company relationships" ON user_companies;
DROP POLICY IF EXISTS "Admins can insert company relationships" ON user_companies;
DROP POLICY IF EXISTS "Admins can update company relationships" ON user_companies;
DROP POLICY IF EXISTS "Admins can delete company relationships" ON user_companies;

COMMENT ON TABLE user_companies IS 'Tabla de relación usuario-empresa. RLS deshabilitado para external auth. Acceso público permitido.';
