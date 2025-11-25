/*
  # Add Payroll Concept Percentages Configuration
  
  1. Purpose
    - Store percentage values for payroll concepts (BPS, FRL, IRPF, etc.)
    - Allow configuration per company and country
    
  2. Changes
    - Add percentage fields to payroll_concepts table
    - Create default percentage values for Uruguay
    
  3. Percentage Values for Uruguay (2025)
    - Aporte Jubilatorio: 15%
    - FRL: 0.1%
    - Seguro de Salud: 3%
    - Adicional Salud: 1.5%
    - Aporte Patronal BPS: 7.5%
    - Aporte Patronal FRL: 0.125%
    - Aporte Patronal Salud: 5%
*/

-- Add percentage and formula fields to payroll_concepts if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payroll_concepts' AND column_name = 'percentage_value'
  ) THEN
    ALTER TABLE payroll_concepts ADD COLUMN percentage_value numeric(5,4);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payroll_concepts' AND column_name = 'fixed_amount'
  ) THEN
    ALTER TABLE payroll_concepts ADD COLUMN fixed_amount numeric(12,2);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payroll_concepts' AND column_name = 'formula_expression'
  ) THEN
    ALTER TABLE payroll_concepts ADD COLUMN formula_expression text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payroll_concepts' AND column_name = 'applies_to_gross'
  ) THEN
    ALTER TABLE payroll_concepts ADD COLUMN applies_to_gross boolean DEFAULT true;
  END IF;
END $$;

-- Update existing concepts with percentage values
UPDATE payroll_concepts 
SET percentage_value = 0.15, applies_to_gross = true
WHERE code = 'APORTE_JUB';

UPDATE payroll_concepts 
SET percentage_value = 0.001, applies_to_gross = true
WHERE code = 'FRL';

UPDATE payroll_concepts 
SET percentage_value = 0.03, applies_to_gross = true
WHERE code = 'SEGURO_SALUD';

UPDATE payroll_concepts 
SET percentage_value = 0.015, applies_to_gross = true
WHERE code = 'ADIC_SALUD';

UPDATE payroll_concepts 
SET percentage_value = 0.075, applies_to_gross = true
WHERE code = 'APORTE_PATRON_BPS';

UPDATE payroll_concepts 
SET percentage_value = 0.00125, applies_to_gross = true
WHERE code = 'APORTE_PATRON_FRL';

UPDATE payroll_concepts 
SET percentage_value = 0.05, applies_to_gross = true
WHERE code = 'APORTE_PATRON_SALUD';

-- Create function to calculate concept amount
CREATE OR REPLACE FUNCTION calculate_concept_amount(
  p_concept_id uuid,
  p_base_amount numeric,
  p_worked_days integer DEFAULT 30,
  p_total_days integer DEFAULT 30
)
RETURNS numeric AS $$
DECLARE
  v_calculation_type text;
  v_percentage numeric;
  v_fixed_amount numeric;
  v_result numeric;
BEGIN
  SELECT calculation_type, percentage_value, fixed_amount
  INTO v_calculation_type, v_percentage, v_fixed_amount
  FROM payroll_concepts
  WHERE id = p_concept_id;
  
  IF v_calculation_type = 'percentage' THEN
    v_result := p_base_amount * COALESCE(v_percentage, 0);
  ELSIF v_calculation_type = 'fixed' THEN
    v_result := COALESCE(v_fixed_amount, 0);
  ELSE
    -- For formula type, return 0 for now (will be calculated separately)
    v_result := 0;
  END IF;
  
  -- Prorate by worked days if applicable
  IF p_worked_days < p_total_days THEN
    v_result := v_result * (p_worked_days::numeric / p_total_days::numeric);
  END IF;
  
  RETURN ROUND(v_result, 2);
END;
$$ LANGUAGE plpgsql;
