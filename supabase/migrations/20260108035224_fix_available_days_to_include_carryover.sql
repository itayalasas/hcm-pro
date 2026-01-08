/*
  # Corregir Fórmula de Días Disponibles para Incluir Días Arrastrados

  1. Propósito
    - La columna available_days no incluía los días de arrastre (carryover_days)
    - Actualizar la fórmula para incluir los días arrastrados del año anterior
    
  2. Fórmula Anterior
    - available_days = total_days - used_days - pending_days
    
  3. Fórmula Nueva
    - available_days = total_days + carryover_days - used_days - pending_days
    
  4. Cambios
    - Eliminar la columna generada actual
    - Recrear la columna con la fórmula correcta
*/

-- Eliminar la columna generada actual
ALTER TABLE leave_balances DROP COLUMN IF EXISTS available_days;

-- Recrear la columna con la fórmula correcta que incluye carryover_days
ALTER TABLE leave_balances 
ADD COLUMN available_days numeric 
GENERATED ALWAYS AS (
  COALESCE(total_days, 0) 
  + COALESCE(carryover_days, 0) 
  - COALESCE(used_days, 0) 
  - COALESCE(pending_days, 0)
) STORED;
