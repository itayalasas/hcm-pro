/*
  # Tabla de Relación Usuario-Empresa
  
  1. Nueva Tabla
    - `user_companies` - Relación entre usuarios y empresas
      - `id` (uuid, PK)
      - `user_id` (uuid, FK a auth.users)
      - `company_id` (uuid, FK a companies)
      - `role` (text) - admin, manager, employee
      - `is_default` (boolean) - Empresa por defecto del usuario
      - `active` (boolean)
      
  2. Seguridad
    - RLS habilitado
    - Usuarios pueden ver sus propias asociaciones
    - Admins pueden gestionar usuarios de su empresa
*/

-- Tabla de Relación Usuario-Empresa
CREATE TABLE IF NOT EXISTS user_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'employee')),
  is_default boolean DEFAULT false,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_user_companies_user ON user_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_company ON user_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_default ON user_companies(user_id, is_default);

ALTER TABLE user_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own company associations"
  ON user_companies FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their first company"
  ON user_companies FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage company users"
  ON user_companies FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.company_id = user_companies.company_id
      AND uc.user_id = auth.uid()
      AND uc.role = 'admin'
    )
  );
