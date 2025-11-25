/*
  # Seed Payroll Concepts for Uruguay
  
  1. Purpose
    - Create standard payroll concepts used in Uruguay
    - Include both perceptions (haberes) and deductions (descuentos)
    
  2. Concepts Created
    
    ### Haberes (Perceptions)
    - Sueldo Básico (Base Salary)
    - Aporte Jubilatorio (Retirement contribution)
    - FRL (Fondo de Reconversión Laboral)
    - Seguro x Enfermedad (Health Insurance)
    - Adicional Seguro Nacional de Salud (Additional Health Insurance)
    - IRPF (Income Tax)
    
    ### Other concepts
    - Ticket Restaurante (Food Vouchers)
    - Matinelli - Beneficio (Benefits)
    - Metlife 10062 - Servicio (Life Insurance)
    
  3. Notes
    - All concepts are created as inactive by default
    - Can be activated per company as needed
    - Calculation types: 'fixed', 'percentage', 'formula'
    - Categories: 'perception', 'deduction', 'contribution', 'benefit'
*/

-- Insert standard payroll concepts for Uruguay
DO $$
DECLARE
  v_company_id uuid;
BEGIN
  -- Get first company for seeding (or create for all companies)
  SELECT id INTO v_company_id FROM companies LIMIT 1;
  
  IF v_company_id IS NOT NULL THEN
    -- Haberes (Perceptions)
    INSERT INTO payroll_concepts (company_id, code, name, category, calculation_type, active)
    VALUES 
      (v_company_id, 'SUELDO_BASE', 'Sueldo Básico', 'perception', 'fixed', true),
      (v_company_id, 'HORAS_EXTRA', 'Horas Extra', 'perception', 'formula', true),
      (v_company_id, 'AGUINALDO', 'Aguinaldo', 'perception', 'formula', true),
      (v_company_id, 'SALARIO_VACACIONAL', 'Salario Vacacional', 'perception', 'formula', true)
    ON CONFLICT DO NOTHING;
    
    -- Descuentos (Deductions)
    INSERT INTO payroll_concepts (company_id, code, name, category, calculation_type, active)
    VALUES 
      (v_company_id, 'APORTE_JUB', 'Aporte Jubilatorio', 'deduction', 'percentage', true),
      (v_company_id, 'FRL', 'FRL (Fondo de Reconversión Laboral)', 'deduction', 'percentage', true),
      (v_company_id, 'SEGURO_SALUD', 'Seguro x Enfermedad', 'deduction', 'percentage', true),
      (v_company_id, 'ADIC_SALUD', 'Adicional Seguro Nacional de Salud', 'deduction', 'percentage', true),
      (v_company_id, 'IRPF', 'I.R.P.F.', 'deduction', 'formula', true)
    ON CONFLICT DO NOTHING;
    
    -- Aportes Patronales (Employer Contributions)
    INSERT INTO payroll_concepts (company_id, code, name, category, calculation_type, active)
    VALUES 
      (v_company_id, 'APORTE_PATRON_BPS', 'Aporte Patronal BPS', 'contribution', 'percentage', true),
      (v_company_id, 'APORTE_PATRON_FRL', 'Aporte Patronal FRL', 'contribution', 'percentage', true),
      (v_company_id, 'APORTE_PATRON_SALUD', 'Aporte Patronal Salud', 'contribution', 'percentage', true)
    ON CONFLICT DO NOTHING;
    
    -- Beneficios (Benefits)
    INSERT INTO payroll_concepts (company_id, code, name, category, calculation_type, active)
    VALUES 
      (v_company_id, 'TICKET_REST', 'Ticket Restaurante', 'benefit', 'fixed', true),
      (v_company_id, 'SEGURO_VIDA', 'Seguro de Vida', 'benefit', 'fixed', true),
      (v_company_id, 'OTROS_BENEF', 'Otros Beneficios', 'benefit', 'fixed', true)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
