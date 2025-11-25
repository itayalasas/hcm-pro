/*
  # Fix Payroll Concepts Categories
  
  1. Changes
    - Change BPS, FONASA, FRL, IRPF from 'contribution' to 'deduction'
    - These are employee deductions, not employer contributions
    - Keep the employer contribution versions separate
  
  2. Security
    - No RLS changes needed
*/

-- Update employee deduction concepts that were incorrectly categorized as contributions
UPDATE payroll_concepts
SET category = 'deduction'
WHERE code IN ('BPS', 'FONASA', 'FRL', 'IRPF')
  AND category = 'contribution';

-- Verify the changes
-- BPS should now be 'deduction' (employee contribution)
-- APORTE_PATRON_BPS remains 'contribution' (employer contribution)
