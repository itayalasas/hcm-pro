/*
  # Agregar estado "Contabilizada" a períodos de nómina
  
  1. Modificaciones
    - Actualizar el constraint del campo status en payroll_periods para incluir 'accounted'
    - Agregar campos de auditoría para rollback y contabilización
    
  2. Nuevos campos
    - `accounted_at` (timestamptz) - Fecha cuando se contabilizó
    - `accounted_by` (uuid) - Usuario que contabilizó
    - `rollback_count` (integer) - Contador de veces que se hizo rollback
    - `last_rollback_at` (timestamptz) - Última fecha de rollback
    - `last_rollback_by` (uuid) - Último usuario que hizo rollback
    
  3. Estados disponibles
    - draft: Borrador (editable)
    - calculated: Calculada
    - validated: Validada
    - approved: Aprobada (puede hacer rollback o contabilizar)
    - accounted: Contabilizada (enviada a contabilidad)
    - paid: Pagada
    - cancelled: Cancelada
*/

-- Drop existing constraint if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'payroll_periods_status_check'
  ) THEN
    ALTER TABLE payroll_periods DROP CONSTRAINT payroll_periods_status_check;
  END IF;
END $$;

-- Add new constraint with 'accounted' status
ALTER TABLE payroll_periods 
ADD CONSTRAINT payroll_periods_status_check 
CHECK (status IN ('draft', 'calculated', 'validated', 'approved', 'accounted', 'paid', 'cancelled'));

-- Add audit fields for accounting
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payroll_periods' AND column_name = 'accounted_at'
  ) THEN
    ALTER TABLE payroll_periods ADD COLUMN accounted_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payroll_periods' AND column_name = 'accounted_by'
  ) THEN
    ALTER TABLE payroll_periods ADD COLUMN accounted_by UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payroll_periods' AND column_name = 'rollback_count'
  ) THEN
    ALTER TABLE payroll_periods ADD COLUMN rollback_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payroll_periods' AND column_name = 'last_rollback_at'
  ) THEN
    ALTER TABLE payroll_periods ADD COLUMN last_rollback_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payroll_periods' AND column_name = 'last_rollback_by'
  ) THEN
    ALTER TABLE payroll_periods ADD COLUMN last_rollback_by UUID;
  END IF;
END $$;

-- Add index for faster querying by status
CREATE INDEX IF NOT EXISTS idx_payroll_periods_status ON payroll_periods(status);
CREATE INDEX IF NOT EXISTS idx_payroll_periods_company_status ON payroll_periods(company_id, status);
