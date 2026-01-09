/*
  # Cargar datos de IRPF 2025 para Uruguay

  ## Descripción
  Carga la configuración de IRPF vigente para Uruguay en 2025:
  - BPC (Base de Prestaciones y Contribuciones): $6,576
  - Mínimo no imponible: 7 BPC = $46,032

  ## Tramos de IRPF 2025 (mensual)
  
  | Tramo (BPC)     | Rango en $UYU           | Tasa IRPF |
  |-----------------|-------------------------|-----------|
  | Hasta 7 BPC     | Hasta $46,032          | 0%        |
  | 7 - 10 BPC      | $46,033 - $65,760      | 10%       |
  | 10 - 15 BPC     | $65,761 - $98,640      | 15%       |
  | 15 - 30 BPC     | $98,641 - $197,280     | 24%       |
  | 30 - 50 BPC     | $197,281 - $328,800    | 25%       |
  | 50 - 75 BPC     | $328,801 - $493,200    | 27%       |
  | 75 - 115 BPC    | $493,201 - $756,240    | 31%       |
  | Más de 115 BPC  | Desde $756,241         | 36%       |

  **Importante:** El mínimo no imponible es 7 BPC = $46,032 mensuales.
  Por debajo de este monto, no se paga IRPF.
*/

-- Primero, crear una función para insertar la configuración de IRPF para una compañía
CREATE OR REPLACE FUNCTION create_irpf_config_2025_uruguay(p_company_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_config_id uuid;
BEGIN
  -- Verificar si ya existe configuración para 2025
  SELECT id INTO v_config_id
  FROM irpf_configuration
  WHERE company_id = p_company_id
    AND fiscal_year = 2025;
  
  IF v_config_id IS NOT NULL THEN
    -- Ya existe, eliminar tramos antiguos
    DELETE FROM irpf_brackets WHERE irpf_config_id = v_config_id;
  ELSE
    -- Crear nueva configuración
    INSERT INTO irpf_configuration (
      company_id,
      fiscal_year,
      bpc_value,
      minimum_non_taxable_bpc,
      is_active
    ) VALUES (
      p_company_id,
      2025,
      6576.00,
      7.00,
      true
    )
    RETURNING id INTO v_config_id;
  END IF;
  
  -- Insertar tramos de IRPF 2025
  INSERT INTO irpf_brackets (irpf_config_id, from_bpc, to_bpc, rate, sort_order) VALUES
    (v_config_id, 0, 7, 0.00, 1),        -- Hasta 7 BPC: 0%
    (v_config_id, 7, 10, 0.10, 2),       -- 7-10 BPC: 10%
    (v_config_id, 10, 15, 0.15, 3),      -- 10-15 BPC: 15%
    (v_config_id, 15, 30, 0.24, 4),      -- 15-30 BPC: 24%
    (v_config_id, 30, 50, 0.25, 5),      -- 30-50 BPC: 25%
    (v_config_id, 50, 75, 0.27, 6),      -- 50-75 BPC: 27%
    (v_config_id, 75, 115, 0.31, 7),     -- 75-115 BPC: 31%
    (v_config_id, 115, NULL, 0.36, 8);   -- Más de 115 BPC: 36%
  
END;
$$;

-- Comentario
COMMENT ON FUNCTION create_irpf_config_2025_uruguay IS 'Crea/actualiza la configuración de IRPF 2025 para Uruguay para una compañía específica';
