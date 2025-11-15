/*
  # Tabla de Usuarios de Aplicación y Relaciones con Empresas

  ## Overview
  Sistema para sincronizar usuarios desde la API externa de autenticación y
  gestionar sus relaciones con empresas.

  ## New Tables Created

  ### 1. app_users
    - `id` (uuid, primary key) - ID del usuario (sincronizado desde API externa)
    - `email` (text, unique) - Email del usuario
    - `name` (text) - Nombre completo
    - `role` (text) - Rol del usuario en el sistema de auth
    - `permissions` (jsonb) - Permisos del usuario
    - `metadata` (jsonb) - Metadata adicional
    - `is_active` (boolean) - Estado del usuario
    - `last_sync_at` (timestamptz) - Última sincronización
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ### 2. Mejoras a user_companies
    - Asegurar que la tabla user_companies conecta correctamente con app_users
    - Agregar campos adicionales si es necesario

  ## Security
  - RLS enabled en todas las tablas
  - Solo administradores pueden gestionar usuarios
  - Usuarios pueden ver sus propias asignaciones
*/

-- Tabla de Usuarios de la Aplicación
CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text,
  permissions jsonb DEFAULT '[]',
  metadata jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  last_sync_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_active ON app_users(is_active);

-- Enable RLS
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies para app_users
CREATE POLICY "Usuarios pueden ver su propio registro"
  ON app_users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Administradores pueden ver todos los usuarios"
  ON app_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
      AND uc.role = 'admin'
    )
  );

-- Mejorar políticas de user_companies
DROP POLICY IF EXISTS "Admins can view all company relationships" ON user_companies;
DROP POLICY IF EXISTS "Admins can insert company relationships" ON user_companies;
DROP POLICY IF EXISTS "Admins can update company relationships" ON user_companies;
DROP POLICY IF EXISTS "Admins can delete company relationships" ON user_companies;

CREATE POLICY "Admins can view all company relationships"
  ON user_companies FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
      AND uc.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert company relationships"
  ON user_companies FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
      AND uc.role = 'admin'
    )
  );

CREATE POLICY "Admins can update company relationships"
  ON user_companies FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
      AND uc.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete company relationships"
  ON user_companies FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
      AND uc.role = 'admin'
    )
  );

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para app_users
DROP TRIGGER IF EXISTS update_app_users_updated_at ON app_users;
CREATE TRIGGER update_app_users_updated_at
  BEFORE UPDATE ON app_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
