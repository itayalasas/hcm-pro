# Sistema de Cálculo de IRPF

Este documento explica cómo funciona el sistema de cálculo progresivo de IRPF (Impuesto a la Renta de las Personas Físicas) implementado para Uruguay.

## Descripción General

El sistema calcula automáticamente el IRPF basándose en tramos de BPC (Base de Prestaciones y Contribuciones) configurables. El cálculo es **progresivo**, lo que significa que cada tramo se aplica solo a la porción del salario que cae dentro de ese rango.

## Componentes del Sistema

### 1. Base de Datos

#### Tabla: `irpf_configuration`
Almacena la configuración de IRPF por año fiscal:

- `id` - Identificador único
- `company_id` - ID de la compañía
- `fiscal_year` - Año fiscal (ej: 2025)
- `bpc_value` - Valor de BPC en pesos uruguayos (ej: $6,576 para 2025)
- `minimum_non_taxable_bpc` - BPC mínimo no imponible (típicamente 7 BPC)
- `is_active` - Si esta configuración está activa

#### Tabla: `irpf_brackets`
Almacena los tramos de IRPF:

- `id` - Identificador único
- `irpf_config_id` - Referencia a configuración de IRPF
- `from_bpc` - Desde X BPC
- `to_bpc` - Hasta X BPC (null para último tramo)
- `rate` - Tasa de IRPF (0.10 = 10%)
- `sort_order` - Orden de los tramos

### 2. Función de Cálculo: `calculate_irpf`

```sql
calculate_irpf(
  p_company_id uuid,
  p_gross_salary decimal,
  p_fiscal_year integer DEFAULT NULL
)
RETURNS decimal
```

Esta función calcula el IRPF de forma progresiva basándose en los tramos configurados.

## Tramos de IRPF 2025 para Uruguay

**BPC 2025: $6,576**
**Mínimo No Imponible: 7 BPC = $46,032**

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

## Cálculo Progresivo

El IRPF se calcula de forma **progresiva**: cada tramo se aplica solo a la porción del salario que cae dentro de ese rango.

### Ejemplo 1: Salario de $100,000

**Desglose del cálculo:**

1. **Tramo 1 (0-7 BPC):** $46,032 × 0% = **$0**
2. **Tramo 2 (7-10 BPC):** ($65,760 - $46,032) = $19,728 × 10% = **$1,972.80**
3. **Tramo 3 (10-15 BPC):** ($98,640 - $65,760) = $32,880 × 15% = **$4,932.00**
4. **Tramo 4 (15-30 BPC):** ($100,000 - $98,640) = $1,360 × 24% = **$326.40**

**IRPF Total = $7,231.20**

### Ejemplo 2: Salario de $50,000

**Desglose del cálculo:**

1. **Tramo 1 (0-7 BPC):** $46,032 × 0% = **$0**
2. **Tramo 2 (7-10 BPC):** ($50,000 - $46,032) = $3,968 × 10% = **$396.80**

**IRPF Total = $396.80**

### Ejemplo 3: Salario de $40,000

**Resultado:** El salario está por debajo del mínimo no imponible (7 BPC = $46,032)

**IRPF Total = $0** (No paga IRPF)

## Configuración en el Sistema

### Paso 1: Acceder a Configuración de IRPF

1. Ir a **Configuración > IRPF**
2. Se mostrará el panel de configuración de IRPF

### Paso 2: Cargar Configuración de Uruguay 2025

Para cargar automáticamente la configuración vigente de Uruguay 2025:

1. Hacer clic en el botón **"Cargar Uruguay 2025"**
2. El sistema creará automáticamente:
   - Configuración con BPC = $6,576
   - Mínimo no imponible = 7 BPC
   - Los 8 tramos de IRPF vigentes

### Paso 3: Configuración Manual

También puedes crear o editar configuraciones manualmente:

#### Configuración General:

- **Año Fiscal:** Año para el cual aplica la configuración
- **Valor de BPC:** Valor en pesos uruguayos del BPC
- **Mínimo No Imponible:** Cantidad de BPC bajo la cual no se paga IRPF
- **Configuración Activa:** Marcar si esta configuración debe usarse

#### Tramos de IRPF:

Para cada tramo configura:

- **Desde BPC:** Límite inferior del tramo en BPC
- **Hasta BPC:** Límite superior del tramo en BPC (dejar vacío para el último tramo)
- **Tasa %:** Porcentaje de IRPF para este tramo

### Vista Previa

El panel muestra una vista previa de los tramos configurados con los rangos en pesos y las tasas aplicables.

## Integración con Nómina

### Procesamiento Automático

Cuando se procesa una nómina:

1. El sistema detecta si hay un concepto con código `IRPF`
2. En lugar de usar un porcentaje fijo, llama a la función `calculate_irpf`
3. La función busca la configuración activa del año actual
4. Calcula el IRPF de forma progresiva según los tramos
5. Aplica el monto calculado al recibo

### Aplicación Universal

El cálculo progresivo se aplica a:

- ✅ Nómina mensual
- ✅ Liquidación de vacaciones
- ✅ Aguinaldo
- ✅ Cualquier otro tipo de liquidación

En todos los casos, el IRPF se calcula sobre el **salario bruto imponible** de ese período.

## Consideraciones Importantes

### Actualización Anual

Los valores de BPC y los tramos de IRPF se actualizan anualmente por decreto gubernamental. Por lo tanto:

1. **Crear nueva configuración cada año**
2. Marcar como activa la configuración del año vigente
3. Desactivar configuraciones de años anteriores

### Mínimo No Imponible

El mínimo no imponible (7 BPC = $46,032 mensuales para 2025) significa que:

- Salarios **por debajo** de este monto: **NO pagan IRPF**
- Salarios **por encima** de este monto: Pagan IRPF solo sobre el excedente

### Base Imponible

El IRPF se calcula sobre el **salario bruto** después de las deducciones permitidas por ley (como BPS). El sistema usa el `base_salary` registrado en el período de nómina.

### Liquidación de Vacaciones

Para liquidación de vacaciones:

- El `base_salary` es el **monto de la liquidación** (no el salario mensual del empleado)
- El IRPF se calcula sobre ese monto de liquidación
- Ejemplo: Liquidación de 5 días = $26,666.67 → IRPF se calcula sobre $26,666.67

## Función para Crear Configuración 2025

El sistema incluye una función auxiliar para crear/actualizar la configuración de Uruguay 2025:

```sql
SELECT create_irpf_config_2025_uruguay('company-id-uuid');
```

Esta función:

1. Verifica si ya existe configuración para 2025
2. Si existe, actualiza los tramos
3. Si no existe, crea la configuración completa con:
   - BPC = $6,576
   - Mínimo no imponible = 7 BPC
   - Los 8 tramos vigentes

## Ejemplo de Uso en la Aplicación

### Escenario: Procesar nómina mensual

1. **Empleado:** Juan Pérez
2. **Salario Bruto:** $120,000
3. **BPS (15%):** $18,000
4. **Base Imponible IRPF:** $120,000
5. **IRPF Calculado (progresivo):**
   - 0-46,032: $0
   - 46,033-65,760: $1,972.80
   - 65,761-98,640: $4,932.00
   - 98,641-120,000: $5,126.40
   - **Total IRPF: $12,031.20**
6. **Neto a Cobrar:** $120,000 - $18,000 - $12,031.20 = **$89,968.80**

### Recibo Generado:

```
CONCEPTOS          HABERES      DESCUENTOS
Sueldo Básico      $120,000.00
Aporte BPS (15%)                $18,000.00
IRPF (Progresivo)               $12,031.20
─────────────────────────────────────────
Total Gravado      $120,000.00  $30,031.20

Total Neto: $89,968.80
```

## Preguntas Frecuentes

### ¿Qué pasa si no hay configuración de IRPF?

Si no existe configuración activa para el año actual, el sistema retorna IRPF = $0.

### ¿Cómo actualizo los valores cada año?

1. Ir a Configuración > IRPF
2. Crear nueva configuración con el año nuevo
3. Ingresar el nuevo valor de BPC
4. Ajustar los tramos según decreto
5. Marcar como activa

### ¿Puedo tener múltiples configuraciones?

Sí, puedes tener una configuración por año fiscal. Solo una puede estar activa a la vez.

### ¿El cálculo es automático?

Sí, el cálculo es completamente automático cuando se procesa la nómina. No requiere intervención manual.

### ¿Se puede usar para otros países?

Sí, el sistema es flexible y permite configurar cualquier estructura de tramos e impuestos progresivos.

---

**Fecha de última actualización:** 9 de enero de 2026
**Versión de BPC:** $6,576 (2025)
**Fuente:** Banco de Previsión Social (BPS) - Uruguay
