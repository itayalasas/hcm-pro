/*
  # Agregar columnas faltantes a evaluation_cycles

  ## Descripción
  Agrega las columnas que faltan en la tabla evaluation_cycles para soportar
  la funcionalidad completa del módulo de ciclos de evaluación.

  ## Cambios
  - Agregar columna `description` (texto)
  - Agregar columna `self_eval_deadline` (fecha)
  - Agregar columna `manager_eval_deadline` (fecha)
  - Agregar columna `updated_at` (timestamptz)
  - Agregar columna `created_by` (uuid)
  - Modificar restricción de status
*/

-- Agregar columnas faltantes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'evaluation_cycles' AND column_name = 'description'
  ) THEN
    ALTER TABLE evaluation_cycles ADD COLUMN description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'evaluation_cycles' AND column_name = 'self_eval_deadline'
  ) THEN
    ALTER TABLE evaluation_cycles ADD COLUMN self_eval_deadline date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'evaluation_cycles' AND column_name = 'manager_eval_deadline'
  ) THEN
    ALTER TABLE evaluation_cycles ADD COLUMN manager_eval_deadline date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'evaluation_cycles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE evaluation_cycles ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'evaluation_cycles' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE evaluation_cycles ADD COLUMN created_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Eliminar la restricción de status antigua si existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'evaluation_cycles' 
    AND constraint_name LIKE '%status%'
  ) THEN
    ALTER TABLE evaluation_cycles DROP CONSTRAINT IF EXISTS evaluation_cycles_status_check;
  END IF;
END $$;

-- Agregar nueva restricción de status
ALTER TABLE evaluation_cycles 
  ADD CONSTRAINT evaluation_cycles_status_check 
  CHECK (status IN ('planned', 'active', 'closed'));
