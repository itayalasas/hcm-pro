/*
  # Corregir Función de Tipos de Ausencia por Defecto

  1. Propósito
    - Corregir el nombre del campo de max_days a annual_days
    - La tabla leave_types usa annual_days, no max_days
    
  2. Cambios
    - Actualizar la función create_default_leave_types para usar annual_days
*/

-- Reemplazar la función con el campo correcto
CREATE OR REPLACE FUNCTION create_default_leave_types(p_company_id uuid)
RETURNS void AS $$
BEGIN
  -- Verificar si ya existen tipos de ausencia para esta empresa
  IF EXISTS (SELECT 1 FROM leave_types WHERE company_id = p_company_id) THEN
    RAISE NOTICE 'La empresa ya tiene tipos de ausencia configurados';
    RETURN;
  END IF;

  -- Insertar tipos de ausencia por defecto
  INSERT INTO leave_types (company_id, code, name, description, is_paid, annual_days, requires_approval, active)
  VALUES
    (p_company_id, 'VAC', 'Vacaciones', 'Días de vacaciones anuales pagadas', true, 20, true, true),
    (p_company_id, 'SICK', 'Enfermedad', 'Licencia médica por enfermedad', true, 10, false, true),
    (p_company_id, 'PERS', 'Asuntos Personales', 'Días por asuntos personales sin goce de sueldo', false, 5, true, true),
    (p_company_id, 'MATE', 'Maternidad/Paternidad', 'Licencia por maternidad o paternidad', true, 90, true, true),
    (p_company_id, 'COMP', 'Compensación', 'Días compensatorios por horas extras', true, 10, true, true),
    (p_company_id, 'BERE', 'Duelo', 'Licencia por fallecimiento de familiar', true, 3, false, true),
    (p_company_id, 'MARR', 'Matrimonio', 'Licencia por matrimonio', true, 3, true, true),
    (p_company_id, 'STUD', 'Estudios', 'Licencia para estudios o exámenes', false, 5, true, true);

  RAISE NOTICE 'Tipos de ausencia por defecto creados exitosamente';
END;
$$ LANGUAGE plpgsql;
