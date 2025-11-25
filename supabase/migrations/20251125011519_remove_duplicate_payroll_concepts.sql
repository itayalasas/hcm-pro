/*
  # Remove Duplicate Payroll Concepts
  
  1. Changes
    - Deactivate duplicate BPS concept (keep APORTE_JUB which is the correct one)
    - Deactivate newer duplicate FRL and IRPF concepts
    - Keep the original concepts from the initial seed
  
  2. Notes
    - BPS and APORTE_JUB are the same (both 15% employee contribution)
    - We'll keep APORTE_JUB and deactivate BPS
*/

-- Deactivate BPS (duplicate of APORTE_JUB)
UPDATE payroll_concepts
SET active = false
WHERE code = 'BPS'
  AND id = '313b1dad-5b8f-46dd-8914-be6dc0f9c2b7';

-- Deactivate newer FRL duplicate
UPDATE payroll_concepts
SET active = false
WHERE code = 'FRL'
  AND id = '52f18c00-a32d-41dd-ab4d-8682bd84a6c6'
  AND category = 'deduction';

-- Deactivate newer IRPF duplicate
UPDATE payroll_concepts
SET active = false
WHERE code = 'IRPF'
  AND id = '21ca1dc0-95bb-4ed3-9969-f7dbccc5f662'
  AND category = 'deduction';
