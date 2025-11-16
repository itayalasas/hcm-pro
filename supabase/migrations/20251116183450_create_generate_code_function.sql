/*
  # Función para Generar Códigos Automáticos

  ## Descripción
  Esta migración crea una función que genera códigos automáticos basados en la configuración
  de cada entidad y empresa.

  ## Función
  - `generate_entity_code(entity_type text, company_id uuid)` - Genera el siguiente código para una entidad
*/

-- Función para generar código automático
CREATE OR REPLACE FUNCTION generate_entity_code(
  p_entity_type text,
  p_company_id uuid DEFAULT NULL
)
RETURNS text AS $$
DECLARE
  v_config record;
  v_code text;
  v_year text;
  v_month text;
  v_sequence text;
  v_next_sequence integer;
BEGIN
  -- Obtener la configuración activa para esta entidad y empresa
  -- Primero buscar configuración específica de la empresa, luego la global
  SELECT * INTO v_config
  FROM code_configurations
  WHERE entity_type = p_entity_type
    AND (company_id = p_company_id OR (company_id IS NULL AND p_company_id IS NOT NULL))
    AND active = true
  ORDER BY company_id NULLS LAST
  LIMIT 1;

  -- Si no existe configuración, usar valores por defecto
  IF v_config IS NULL THEN
    v_config.prefix := UPPER(SUBSTRING(p_entity_type, 1, 3));
    v_config.use_year := false;
    v_config.use_month := false;
    v_config.sequence_length := 4;
    v_config.separator := '-';
    v_config.current_sequence := 0;
  END IF;

  -- Calcular el siguiente número de secuencia
  v_next_sequence := COALESCE(v_config.current_sequence, 0) + 1;

  -- Actualizar la secuencia en la configuración
  IF v_config.id IS NOT NULL THEN
    UPDATE code_configurations
    SET current_sequence = v_next_sequence,
        updated_at = now()
    WHERE id = v_config.id;
  END IF;

  -- Construir el código
  v_code := v_config.prefix;

  -- Agregar año si está configurado
  IF v_config.use_year THEN
    v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
    IF v_config.separator != '' THEN
      v_code := v_code || v_config.separator || v_year;
    ELSE
      v_code := v_code || v_year;
    END IF;
  END IF;

  -- Agregar mes si está configurado
  IF v_config.use_month THEN
    v_month := TO_CHAR(CURRENT_DATE, 'MM');
    IF v_config.separator != '' THEN
      v_code := v_code || v_config.separator || v_month;
    ELSE
      v_code := v_code || v_month;
    END IF;
  END IF;

  -- Agregar secuencia con padding de ceros
  v_sequence := LPAD(v_next_sequence::text, v_config.sequence_length, '0');
  IF v_config.separator != '' AND (v_config.use_year OR v_config.use_month OR v_config.prefix != '') THEN
    v_code := v_code || v_config.separator || v_sequence;
  ELSE
    v_code := v_code || v_sequence;
  END IF;

  RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permisos a usuarios autenticados
GRANT EXECUTE ON FUNCTION generate_entity_code(text, uuid) TO authenticated;
