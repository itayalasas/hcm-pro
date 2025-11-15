/*
  # Seed Test Data
  
  Creates initial test data including a demo company, positions, and leave types.
  Also provides instructions for creating the first user.
*/

-- Insert countries
INSERT INTO countries (code, name, phone_code, currency_code) VALUES
  ('USA', 'United States', '+1', 'USD'),
  ('MEX', 'Mexico', '+52', 'MXN'),
  ('ARG', 'Argentina', '+54', 'ARS')
ON CONFLICT (code) DO NOTHING;

-- Insert currencies
INSERT INTO currencies (code, name, symbol, decimal_places) VALUES
  ('USD', 'US Dollar', '$', 2),
  ('MXN', 'Mexican Peso', '$', 2),
  ('ARS', 'Argentine Peso', '$', 2)
ON CONFLICT (code) DO NOTHING;

-- Insert demo company
INSERT INTO companies (
  id,
  code, 
  legal_name, 
  trade_name, 
  tax_id, 
  country_id,
  email,
  primary_color
)
SELECT
  'a1111111-1111-1111-1111-111111111111'::uuid,
  'DEMO',
  'Demo Corporation Inc.',
  'Demo Corp',
  '12-3456789',
  id,
  'contact@democorp.com',
  '#0066CC'
FROM countries WHERE code = 'USA'
ON CONFLICT (code) DO NOTHING;

-- Insert business units
INSERT INTO business_units (company_id, code, name, type) VALUES
  ('a1111111-1111-1111-1111-111111111111'::uuid, 'HQ', 'Headquarters', 'division'),
  ('a1111111-1111-1111-1111-111111111111'::uuid, 'HR', 'Human Resources', 'department'),
  ('a1111111-1111-1111-1111-111111111111'::uuid, 'IT', 'Information Technology', 'department')
ON CONFLICT (company_id, code) DO NOTHING;

-- Insert positions
INSERT INTO positions (
  company_id, 
  code, 
  title, 
  description,
  salary_band_min,
  salary_band_max,
  currency_id,
  level
)
SELECT
  'a1111111-1111-1111-1111-111111111111'::uuid,
  'POS-001',
  'HR Manager',
  'Manages all HR operations',
  60000,
  90000,
  c.id,
  'senior'
FROM currencies c WHERE c.code = 'USD'
ON CONFLICT (company_id, code) DO NOTHING;

INSERT INTO positions (
  company_id, 
  code, 
  title, 
  description,
  salary_band_min,
  salary_band_max,
  currency_id,
  level
)
SELECT
  'a1111111-1111-1111-1111-111111111111'::uuid,
  'POS-002',
  'Software Developer',
  'Develops software applications',
  50000,
  80000,
  c.id,
  'mid'
FROM currencies c WHERE c.code = 'USD'
ON CONFLICT (company_id, code) DO NOTHING;

-- Insert leave types
INSERT INTO leave_types (
  company_id,
  country_id,
  code,
  name,
  description,
  is_paid,
  annual_days,
  requires_approval
)
SELECT
  'a1111111-1111-1111-1111-111111111111'::uuid,
  ct.id,
  'VAC',
  'Vacation',
  'Annual paid vacation leave',
  true,
  15,
  true
FROM countries ct WHERE ct.code = 'USA'
ON CONFLICT (company_id, code) DO NOTHING;

INSERT INTO leave_types (
  company_id,
  country_id,
  code,
  name,
  description,
  is_paid,
  annual_days,
  requires_approval
)
SELECT
  'a1111111-1111-1111-1111-111111111111'::uuid,
  ct.id,
  'SICK',
  'Sick Leave',
  'Medical leave',
  true,
  10,
  false
FROM countries ct WHERE ct.code = 'USA'
ON CONFLICT (company_id, code) DO NOTHING;