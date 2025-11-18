/*
  # Add Company Payroll Configuration Fields

  1. Changes to `companies` table
    - Add payroll configuration fields
    - NC01: Tipo de contribuyente BPS
    - NC02: Tipo de aporte / Régimen
    - NC03: Tipo de empresa
    - NC04: Tipo de documento empresa (RUT para BPS)
    - NC05: Actividad económica (GIRO/CIUU)
    - NC06: Dirección (departamento/localidad) - Códigos INE
    - NC07: Tipo de envío
    - NC08: Período de cargo de nómina
    - Additional fields for payroll processing

  2. Notes
    - All fields are optional to allow gradual configuration
    - Values will be validated against master data tables
    - These fields are required for payroll processing in many countries
*/

-- Add payroll configuration fields to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS contributor_type_code VARCHAR(10);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS contribution_regime_code VARCHAR(10);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS company_type_code VARCHAR(10);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS company_document_type_code VARCHAR(10);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS economic_activity_code VARCHAR(20);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS location_code VARCHAR(20);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS submission_type VARCHAR(50);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS payroll_period_format VARCHAR(20);

-- Additional payroll configuration fields
ALTER TABLE companies ADD COLUMN IF NOT EXISTS payroll_start_day INTEGER DEFAULT 1;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS payroll_end_day INTEGER DEFAULT 30;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS payment_day INTEGER DEFAULT 30;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS minimum_wage DECIMAL(15,2);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS currency_code VARCHAR(3) DEFAULT 'USD';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS fiscal_year_start_month INTEGER DEFAULT 1;

-- Legal representative fields
ALTER TABLE companies ADD COLUMN IF NOT EXISTS legal_representative_name VARCHAR(255);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS legal_representative_title VARCHAR(100);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS legal_representative_id VARCHAR(50);

-- Contact and registration fields
ALTER TABLE companies ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS registration_date DATE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS industry_sector VARCHAR(100);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS employee_count_range VARCHAR(50);

-- Comments for documentation
COMMENT ON COLUMN companies.contributor_type_code IS 'Tipo de contribuyente BPS (NC01): 85=Industria y Comercio, 82=Rural, 84=Construcción';
COMMENT ON COLUMN companies.contribution_regime_code IS 'Tipo de aporte/Régimen (NC02): Industria y Comercio, Construcción, Rural, Servicio doméstico';
COMMENT ON COLUMN companies.company_type_code IS 'Tipo de empresa (NC03): Unipersonal, SRL, SAS, SA';
COMMENT ON COLUMN companies.company_document_type_code IS 'Tipo de documento empresa (NC04): RUT (único aceptado para BPS)';
COMMENT ON COLUMN companies.economic_activity_code IS 'Actividad económica GIRO/CIUU (NC05): Códigos CIUU opcionales pero recomendados';
COMMENT ON COLUMN companies.location_code IS 'Dirección departamento/localidad (NC06): Códigos INE';
COMMENT ON COLUMN companies.submission_type IS 'Tipo de envío (NC07): Original, Rectificativa, Sustitutiva';
COMMENT ON COLUMN companies.payroll_period_format IS 'Período de cargo de nómina (NC08): Formato MM/AAAA';
