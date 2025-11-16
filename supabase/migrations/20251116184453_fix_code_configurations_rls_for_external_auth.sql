/*
  # Deshabilitar RLS en code_configurations para Autenticación Externa

  ## Descripción
  Deshabilita RLS en la tabla code_configurations para permitir su uso con
  autenticación externa. El control de acceso se maneja a nivel de aplicación
  mediante el company_id filtrado en el frontend.

  ## Cambios
  - Deshabilita RLS en code_configurations
  - Elimina las políticas RLS existentes (ya no son necesarias)
*/

-- Eliminar políticas RLS existentes
DROP POLICY IF EXISTS "Users can view code configurations of their companies" ON code_configurations;
DROP POLICY IF EXISTS "Users can insert code configurations for their companies" ON code_configurations;
DROP POLICY IF EXISTS "Users can update code configurations of their companies" ON code_configurations;
DROP POLICY IF EXISTS "Users can delete code configurations of their companies" ON code_configurations;

-- Deshabilitar RLS
ALTER TABLE code_configurations DISABLE ROW LEVEL SECURITY;
