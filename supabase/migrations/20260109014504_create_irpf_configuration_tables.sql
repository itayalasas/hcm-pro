/*
  # Crear tablas de configuración de IRPF

  ## Descripción
  Implementa el sistema de cálculo progresivo de IRPF basado en tramos de BPC
  (Base de Prestaciones y Contribuciones) para Uruguay.

  ## 1. Nuevas Tablas

  ### `irpf_configuration`
  Almacena el valor de BPC por año fiscal y compañía:
  - `id` (uuid, primary key)
  - `company_id` (uuid, foreign key)
  - `fiscal_year` (integer) - Año fiscal
  - `bpc_value` (decimal) - Valor de BPC en pesos uruguayos
  - `minimum_non_taxable_bpc` (decimal) - BPC mínimo no imponible (generalmente 7)
  - `is_active` (boolean) - Si esta configuración está activa
  - `created_at`, `updated_at`, `created_by`

  ### `irpf_brackets`
  Almacena los tramos de IRPF:
  - `id` (uuid, primary key)
  - `irpf_config_id` (uuid, foreign key)
  - `from_bpc` (decimal) - Desde X BPC
  - `to_bpc` (decimal) - Hasta X BPC (null para último tramo)
  - `rate` (decimal) - Tasa de IRPF (0.10 = 10%)
  - `sort_order` (integer) - Orden de los tramos

  ## 2. Seguridad
  - RLS habilitado para ambas tablas
  - Políticas para usuarios autenticados de la compañía

  ## 3. Notas Importantes
  - Los valores de BPC se actualizan anualmente por decreto
  - El cálculo es progresivo: cada tramo se aplica solo a la porción del salario en ese rango
  - El mínimo no imponible es típicamente 7 BPC en Uruguay
*/

-- Tabla de configuración de IRPF por año
CREATE TABLE IF NOT EXISTS irpf_configuration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  fiscal_year integer NOT NULL,
  bpc_value decimal(10,2) NOT NULL,
  minimum_non_taxable_bpc decimal(5,2) NOT NULL DEFAULT 7,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  
  CONSTRAINT unique_company_fiscal_year UNIQUE (company_id, fiscal_year),
  CONSTRAINT valid_bpc_value CHECK (bpc_value > 0),
  CONSTRAINT valid_minimum CHECK (minimum_non_taxable_bpc >= 0)
);

-- Tabla de tramos de IRPF
CREATE TABLE IF NOT EXISTS irpf_brackets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  irpf_config_id uuid NOT NULL REFERENCES irpf_configuration(id) ON DELETE CASCADE,
  from_bpc decimal(5,2) NOT NULL,
  to_bpc decimal(5,2),
  rate decimal(5,4) NOT NULL,
  sort_order integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_bracket_range CHECK (
    (to_bpc IS NULL) OR (to_bpc > from_bpc)
  ),
  CONSTRAINT valid_rate CHECK (rate >= 0 AND rate <= 1)
);

-- Índices
CREATE INDEX idx_irpf_config_company ON irpf_configuration(company_id);
CREATE INDEX idx_irpf_config_year ON irpf_configuration(fiscal_year);
CREATE INDEX idx_irpf_config_active ON irpf_configuration(company_id, is_active);
CREATE INDEX idx_irpf_brackets_config ON irpf_brackets(irpf_config_id);
CREATE INDEX idx_irpf_brackets_order ON irpf_brackets(irpf_config_id, sort_order);

-- RLS
ALTER TABLE irpf_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE irpf_brackets ENABLE ROW LEVEL SECURITY;

-- Políticas para irpf_configuration
CREATE POLICY "Users can view IRPF config of their company"
  ON irpf_configuration FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert IRPF config for their company"
  ON irpf_configuration FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update IRPF config of their company"
  ON irpf_configuration FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete IRPF config of their company"
  ON irpf_configuration FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

-- Políticas para irpf_brackets
CREATE POLICY "Users can view IRPF brackets of their company"
  ON irpf_brackets FOR SELECT
  TO authenticated
  USING (
    irpf_config_id IN (
      SELECT id FROM irpf_configuration 
      WHERE company_id IN (
        SELECT company_id FROM user_companies WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert IRPF brackets for their company"
  ON irpf_brackets FOR INSERT
  TO authenticated
  WITH CHECK (
    irpf_config_id IN (
      SELECT id FROM irpf_configuration 
      WHERE company_id IN (
        SELECT company_id FROM user_companies WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update IRPF brackets of their company"
  ON irpf_brackets FOR UPDATE
  TO authenticated
  USING (
    irpf_config_id IN (
      SELECT id FROM irpf_configuration 
      WHERE company_id IN (
        SELECT company_id FROM user_companies WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    irpf_config_id IN (
      SELECT id FROM irpf_configuration 
      WHERE company_id IN (
        SELECT company_id FROM user_companies WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete IRPF brackets of their company"
  ON irpf_brackets FOR DELETE
  TO authenticated
  USING (
    irpf_config_id IN (
      SELECT id FROM irpf_configuration 
      WHERE company_id IN (
        SELECT company_id FROM user_companies WHERE user_id = auth.uid()
      )
    )
  );
