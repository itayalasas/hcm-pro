/*
  # Seed Bank Account Types Data

  ## Overview
  Seeds standard bank account types used across LATAM countries for payroll and banking.

  ## Account Types Seeded
  1. Cuenta Corriente (Checking Account) - Standard checking account
  2. Cuenta de Ahorros (Savings Account) - Standard savings account
  3. Cuenta Nómina (Payroll Account) - Dedicated payroll account
  4. Cuenta Vista (Current Account) - Instant access account (common in Chile)
  5. Cuenta RUT (RUT Account) - Basic account tied to tax ID (Chile specific)
  6. Cuenta Sueldo (Salary Account) - Salary deposit account (Argentina/Uruguay)

  ## Important Notes
  1. Account types are inserted without company_id (available globally)
  2. All account types are set as active by default
  3. Codes follow a standardized numbering system
  4. Descriptions provide context for each account type
*/

-- Insert Bank Account Types
INSERT INTO bank_account_types (code, name, description, is_active) VALUES
  ('001', 'Cuenta Corriente', 'Cuenta bancaria para transacciones diarias, cheques y débitos automáticos', true),
  ('002', 'Cuenta de Ahorros', 'Cuenta bancaria para ahorro con posibilidad de generar intereses', true),
  ('003', 'Cuenta Nómina', 'Cuenta dedicada exclusivamente para el depósito de nómina', true),
  ('004', 'Cuenta Vista', 'Cuenta de acceso inmediato sin restricciones (común en Chile)', true),
  ('005', 'Cuenta RUT', 'Cuenta básica vinculada al RUT sin costos de mantención (Chile)', true),
  ('006', 'Cuenta Sueldo', 'Cuenta para depósito de sueldo sin costo de mantenimiento', true),
  ('007', 'Cuenta Electrónica', 'Cuenta digital sin chequera, operación 100% online', true)
ON CONFLICT (company_id, code) DO NOTHING;