/*
  # Create Payroll Master Data Tables

  1. New Tables
    - `contributor_types` - Tipos de contribuyente BPS (NC01)
    - `contribution_regimes` - Tipos de aporte/régimen (NC02)
    - `company_types` - Tipos de empresa (NC03)
    - `company_document_types` - Tipos de documento empresa (NC04)
    - `economic_activities` - Actividades económicas CIUU/GIRO (NC05)
    - `submission_types` - Tipos de envío (NC07)
    - `currencies` - Monedas del sistema

  2. Security
    - Enable RLS on all tables
    - Policies for authenticated users to read
    - Only system admins can modify
*/

-- Contributor Types (NC01)
CREATE TABLE IF NOT EXISTS contributor_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  country_code VARCHAR(3),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE contributor_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read contributor types"
  ON contributor_types FOR SELECT
  TO authenticated
  USING (true);

-- Contribution Regimes (NC02)
CREATE TABLE IF NOT EXISTS contribution_regimes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  country_code VARCHAR(3),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE contribution_regimes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read contribution regimes"
  ON contribution_regimes FOR SELECT
  TO authenticated
  USING (true);

-- Company Types (NC03)
CREATE TABLE IF NOT EXISTS company_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  country_code VARCHAR(3),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE company_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read company types"
  ON company_types FOR SELECT
  TO authenticated
  USING (true);

-- Company Document Types (NC04)
CREATE TABLE IF NOT EXISTS company_document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  country_code VARCHAR(3),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE company_document_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read company document types"
  ON company_document_types FOR SELECT
  TO authenticated
  USING (true);

-- Economic Activities (NC05)
CREATE TABLE IF NOT EXISTS economic_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  country_code VARCHAR(3),
  classification_system VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE economic_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read economic activities"
  ON economic_activities FOR SELECT
  TO authenticated
  USING (true);

-- Submission Types (NC07)
CREATE TABLE IF NOT EXISTS submission_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE submission_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read submission types"
  ON submission_types FOR SELECT
  TO authenticated
  USING (true);

-- Currencies
CREATE TABLE IF NOT EXISTS currencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(3) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  symbol VARCHAR(10),
  country_code VARCHAR(3),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read currencies"
  ON currencies FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contributor_types_code ON contributor_types(code);
CREATE INDEX IF NOT EXISTS idx_contribution_regimes_code ON contribution_regimes(code);
CREATE INDEX IF NOT EXISTS idx_company_types_code ON company_types(code);
CREATE INDEX IF NOT EXISTS idx_company_document_types_code ON company_document_types(code);
CREATE INDEX IF NOT EXISTS idx_economic_activities_code ON economic_activities(code);
CREATE INDEX IF NOT EXISTS idx_submission_types_code ON submission_types(code);
CREATE INDEX IF NOT EXISTS idx_currencies_code ON currencies(code);
