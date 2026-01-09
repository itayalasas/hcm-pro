/*
  # Función de cálculo progresivo de IRPF

  ## Descripción
  Calcula el IRPF (Impuesto a la Renta de las Personas Físicas) de forma progresiva
  basándose en los tramos de BPC configurados para Uruguay.

  ## Función: calculate_irpf
  
  **Parámetros:**
  - `p_company_id` - ID de la compañía
  - `p_gross_salary` - Salario bruto imponible
  - `p_fiscal_year` - Año fiscal (opcional, por defecto año actual)

  **Retorna:**
  - `irpf_amount` (decimal) - Monto de IRPF a descontar

  ## Lógica de Cálculo Progresivo

  El cálculo es progresivo, lo que significa que cada tramo se aplica SOLO a la
  porción del salario que cae dentro de ese rango.

  **Ejemplo:**
  - Salario: $100,000
  - BPC: $6,576
  - Tramos:
    * 0-7 BPC ($0-$46,032): 0%
    * 7-10 BPC ($46,033-$65,760): 10%
    * 10-15 BPC ($65,761-$98,640): 15%
    * 15-30 BPC ($98,641-$197,280): 24%

  **Cálculo:**
  1. Tramo 1: $46,032 × 0% = $0
  2. Tramo 2: ($65,760 - $46,032) × 10% = $1,972.80
  3. Tramo 3: ($98,640 - $65,760) × 15% = $4,932
  4. Tramo 4: ($100,000 - $98,640) × 24% = $326.40
  
  **Total IRPF = $7,231.20**
*/

CREATE OR REPLACE FUNCTION calculate_irpf(
  p_company_id uuid,
  p_gross_salary decimal,
  p_fiscal_year integer DEFAULT NULL
)
RETURNS decimal
LANGUAGE plpgsql
AS $$
DECLARE
  v_fiscal_year integer;
  v_config_id uuid;
  v_bpc_value decimal;
  v_min_non_taxable_bpc decimal;
  v_min_non_taxable_amount decimal;
  v_bracket record;
  v_bracket_from_amount decimal;
  v_bracket_to_amount decimal;
  v_taxable_in_bracket decimal;
  v_total_irpf decimal := 0;
BEGIN
  -- Si no se especifica año fiscal, usar el año actual
  v_fiscal_year := COALESCE(p_fiscal_year, EXTRACT(YEAR FROM CURRENT_DATE)::integer);
  
  -- Si el salario es 0 o negativo, no hay IRPF
  IF p_gross_salary <= 0 THEN
    RETURN 0;
  END IF;
  
  -- Obtener configuración de IRPF activa para el año
  SELECT id, bpc_value, minimum_non_taxable_bpc
  INTO v_config_id, v_bpc_value, v_min_non_taxable_bpc
  FROM irpf_configuration
  WHERE company_id = p_company_id
    AND fiscal_year = v_fiscal_year
    AND is_active = true
  LIMIT 1;
  
  -- Si no hay configuración, retornar 0
  IF v_config_id IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Calcular el mínimo no imponible en pesos
  v_min_non_taxable_amount := v_bpc_value * v_min_non_taxable_bpc;
  
  -- Si el salario está por debajo del mínimo no imponible, no hay IRPF
  IF p_gross_salary <= v_min_non_taxable_amount THEN
    RETURN 0;
  END IF;
  
  -- Calcular IRPF de forma progresiva por cada tramo
  FOR v_bracket IN (
    SELECT from_bpc, to_bpc, rate
    FROM irpf_brackets
    WHERE irpf_config_id = v_config_id
    ORDER BY sort_order
  ) LOOP
    -- Calcular los límites del tramo en pesos
    v_bracket_from_amount := v_bpc_value * v_bracket.from_bpc;
    
    IF v_bracket.to_bpc IS NULL THEN
      -- Último tramo (sin límite superior)
      v_bracket_to_amount := NULL;
    ELSE
      v_bracket_to_amount := v_bpc_value * v_bracket.to_bpc;
    END IF;
    
    -- Calcular cuánto del salario cae en este tramo
    IF v_bracket_to_amount IS NULL THEN
      -- Último tramo: todo lo que excede el mínimo del tramo
      IF p_gross_salary > v_bracket_from_amount THEN
        v_taxable_in_bracket := p_gross_salary - v_bracket_from_amount;
      ELSE
        v_taxable_in_bracket := 0;
      END IF;
    ELSE
      -- Tramo intermedio
      IF p_gross_salary <= v_bracket_from_amount THEN
        -- El salario no llega a este tramo
        v_taxable_in_bracket := 0;
      ELSIF p_gross_salary >= v_bracket_to_amount THEN
        -- El salario abarca todo este tramo
        v_taxable_in_bracket := v_bracket_to_amount - v_bracket_from_amount;
      ELSE
        -- El salario cae parcialmente en este tramo
        v_taxable_in_bracket := p_gross_salary - v_bracket_from_amount;
      END IF;
    END IF;
    
    -- Sumar el IRPF de este tramo
    v_total_irpf := v_total_irpf + (v_taxable_in_bracket * v_bracket.rate);
  END LOOP;
  
  -- Redondear a 2 decimales
  RETURN ROUND(v_total_irpf, 2);
END;
$$;

-- Comentario sobre la función
COMMENT ON FUNCTION calculate_irpf IS 'Calcula el IRPF de forma progresiva basándose en tramos de BPC configurados para Uruguay';
