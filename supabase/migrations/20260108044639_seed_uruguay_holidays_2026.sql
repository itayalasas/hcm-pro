/*
  # Feriados de Uruguay 2026
  
  1. Propósito
    - Agregar feriados nacionales de Uruguay para el año 2026
    - Marcar feriados recurrentes para que se repitan cada año
    
  2. Feriados Incluidos
    - Año Nuevo (1 de enero) - Recurrente
    - Día de los Reyes (6 de enero) - Recurrente
    - Carnaval (23-24 de febrero) - NO recurrente (fecha variable)
    - Semana Santa (3-6 de abril) - NO recurrente (fecha variable)
    - Desembarco de los 33 Orientales (19 de abril) - Recurrente
    - Día de los Trabajadores (1 de mayo) - Recurrente
    - Batalla de Las Piedras (18 de mayo) - Recurrente
    - Natalicio de Artigas (19 de junio) - Recurrente
    - Jura de la Constitución (18 de julio) - Recurrente
    - Día de la Independencia (25 de agosto) - Recurrente
    - Día de la Diversidad Cultural (12 de octubre) - Recurrente
    - Día de los Difuntos (2 de noviembre) - Recurrente
    - Navidad (25 de diciembre) - Recurrente
*/

-- Insertar feriados de Uruguay 2026 para todas las empresas existentes
DO $$
DECLARE
  company_record RECORD;
BEGIN
  FOR company_record IN SELECT id FROM companies LOOP
    -- Feriados recurrentes
    INSERT INTO holidays (company_id, date, name, recurring, is_active)
    VALUES 
      (company_record.id, '2026-01-01', 'Año Nuevo', true, true),
      (company_record.id, '2026-01-06', 'Día de los Reyes', true, true),
      (company_record.id, '2026-04-19', 'Desembarco de los 33 Orientales', true, true),
      (company_record.id, '2026-05-01', 'Día de los Trabajadores', true, true),
      (company_record.id, '2026-05-18', 'Batalla de Las Piedras', true, true),
      (company_record.id, '2026-06-19', 'Natalicio de Artigas', true, true),
      (company_record.id, '2026-07-18', 'Jura de la Constitución', true, true),
      (company_record.id, '2026-08-25', 'Día de la Independencia', true, true),
      (company_record.id, '2026-10-12', 'Día de la Diversidad Cultural', true, true),
      (company_record.id, '2026-11-02', 'Día de los Difuntos', true, true),
      (company_record.id, '2026-12-25', 'Navidad', true, true)
    ON CONFLICT (company_id, date) DO NOTHING;
    
    -- Feriados NO recurrentes (fechas variables)
    INSERT INTO holidays (company_id, date, name, recurring, is_active)
    VALUES 
      (company_record.id, '2026-02-23', 'Carnaval (Lunes)', false, true),
      (company_record.id, '2026-02-24', 'Carnaval (Martes)', false, true),
      (company_record.id, '2026-04-03', 'Jueves Santo', false, true),
      (company_record.id, '2026-04-06', 'Lunes de Pascua', false, true)
    ON CONFLICT (company_id, date) DO NOTHING;
  END LOOP;
END $$;
