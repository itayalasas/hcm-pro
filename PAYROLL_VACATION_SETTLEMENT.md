# Sistema de Nómina - Liquidación de Vacaciones y Descuentos

## Resumen

El sistema implementa dos funcionalidades clave para el procesamiento de nómina en Uruguay:

1. **Liquidación de Vacaciones** - Pago de días de vacaciones acumulados no tomados
2. **Descuentos por Ausencias No Remuneradas** - Descuentos automáticos en nómina mensual

---

## 1. Liquidación de Vacaciones

### Conceptos Básicos

En Uruguay, los trabajadores tienen derecho a:
- **20 días hábiles** de licencia por año trabajado
- Se generan **1.66 días por mes** trabajado
- Los días se pueden tomar como vacaciones o liquidar (pagar en efectivo)

### Cálculo del Salario Vacacional

**Fórmula:**
```
Salario Vacacional = (Salario Mensual / 30) × Días a liquidar
```

**Características:**
- **NO** se descuenta el 15% de BPS (Seguridad Social)
- **SÍ** está sujeto a IRPF (Impuesto a la Renta)
- Debe pagarse ANTES del período de vacaciones

### Cómo Crear una Nómina de Liquidación

1. Ir a **Nómina > Períodos de Nómina**
2. Clic en **Crear Período**
3. Seleccionar tipo: **"Liquidación de Vacaciones"**
4. Completar fechas y seleccionar empleados
5. El sistema calculará automáticamente:
   - Lee `available_days` del saldo de vacaciones del empleado
   - Tarifa diaria: Salario / 30
   - Monto total: Tarifa diaria × Días disponibles

**Nota importante:** En la nómina de liquidación NO se incluye el salario base mensual, solo se paga el valor de los días de vacaciones acumulados.

### Proceso Automático

Al procesar la nómina de liquidación:

1. El sistema consulta `leave_balances` para obtener días disponibles
2. Calcula el monto según la fórmula de Uruguay
3. Crea el concepto "Liquidación de Vacaciones" en el recibo
4. **Actualiza automáticamente** el saldo de vacaciones:
   - Descuenta de `carryover_days` primero (días arrastrados del año anterior)
   - Luego descuenta de `total_days` (días del año actual)
   - Registra en `settled_days` los días liquidados
   - Actualiza `last_settlement_date`

### Funciones de Base de Datos

**`calculate_vacation_settlement(employee_id, year, days_to_settle)`**

Retorna:
- `available_days` - Días disponibles totales
- `days_to_pay` - Días que se van a liquidar
- `daily_rate` - Tarifa por día (salario/30)
- `total_amount` - Monto total a pagar

---

## 2. Descuentos por Ausencias No Remuneradas

### Conceptos Básicos

Cuando un empleado tiene ausencias no remuneradas (ej: licencia sin goce de sueldo), se debe descontar proporcionalmente de su salario mensual.

### Cálculo del Descuento

**Fórmula:**
```
Descuento = (Salario Mensual / 30) × Días no remunerados
```

### Proceso Automático en Nómina Mensual

Al crear una nómina **mensual**, el sistema:

1. Busca todas las ausencias aprobadas del tipo "no remunerado" (`is_paid = false`)
2. Calcula los días que caen dentro del período de nómina
3. Calcula el descuento: (Salario / 30) × Días
4. Agrega automáticamente el concepto "Descuento por Ausencias No Remuneradas"
5. El descuento aparece en el recibo de pago

### Tipos de Ausencias

El sistema diferencia automáticamente:
- **Ausencias remuneradas** (VAC, SIK) - NO generan descuento
- **Ausencias no remuneradas** (UNP) - SÍ generan descuento automático

### Funciones de Base de Datos

**`calculate_unpaid_leave_deductions(employee_id, start_date, end_date)`**

Retorna:
- `unpaid_days` - Total de días no remunerados en el período
- `daily_rate` - Tarifa por día (salario/30)
- `total_deduction` - Monto total a descontar

---

## 3. Integración con Asistencia

### Calendario del Equipo

El módulo de "Asistencia > Calendario del Equipo" muestra:
- Ausencias aprobadas (vacaciones, licencias)
- Feriados nacionales
- Días no laborables (configurables por empresa)

### Relación con Nómina

Las ausencias registradas en el calendario impactan automáticamente la nómina:

1. **Vacaciones aprobadas:**
   - Se descuentan del saldo en `leave_balances`
   - Aparecen en el calendario
   - Pueden liquidarse en efectivo

2. **Ausencias no remuneradas aprobadas:**
   - Aparecen en el calendario
   - Generan descuento automático en la nómina mensual
   - Se registran en el recibo

---

## 4. Conceptos de Nómina Creados

### VACATION_PAY - Liquidación de Vacaciones

- **Categoría:** Haber (percepción)
- **Cálculo:** Fórmula
- **Fórmula:** `(base_salary / 30) * vacation_days`
- **Aplica BPS:** NO
- **Sujeto a IRPF:** SÍ

### UNPAID_LEAVE - Descuento por Ausencias

- **Categoría:** Descuento (deducción)
- **Cálculo:** Fórmula
- **Fórmula:** `(base_salary / 30) * unpaid_days`
- **Aplica BPS:** SÍ (reduce base imponible)

---

## 5. Flujo de Trabajo Completo

### Escenario 1: Liquidar Vacaciones

**Ejemplo con Maria Victoria Ortiz:**
1. Empleada tiene acumulados **16.67 días** de vacaciones en 2026
2. Su salario mensual es **$65,200**
3. Decide liquidar todos sus días acumulados
4. Proceso:
   - Crear nómina tipo "Liquidación de Vacaciones"
   - Sistema calcula: $65,200 / 30 = **$2,173.33** por día
   - Total a pagar: $2,173.33 × 16.67 = **$36,229.47**
   - Recibo muestra:
     - **Bruto:** $36,229.47 (solo liquidación, sin salario base)
     - **Deducciones:** IRPF según tasa aplicable
     - **Neto:** $36,229.47 - IRPF
   - Se descuentan 16.67 días del saldo disponible
   - Quedan 0 días disponibles

**Importante:** El monto de la liquidación NO tiene descuento de BPS (15%), pero SÍ está sujeto a IRPF.

### Escenario 2: Ausencia No Remunerada

1. Empleado solicita 3 días de licencia sin goce de sueldo
2. Solicitud es aprobada
3. Proceso en nómina mensual:
   - Sistema detecta 3 días no remunerados
   - Calcula: $50,000 / 30 = $1,666.67 por día
   - Descuento: $1,666.67 × 3 = $5,000
   - El recibo muestra el descuento detallado
   - Salario neto = Salario bruto - Descuentos - Aportes

---

## Referencias

- [Calculadora Salario Vacacional Uruguay 2025](https://misalario.uy/calculadora-salario-vacacional-uruguay-2025/)
- [Cómo se calcula el salario vacacional en Uruguay](https://memory.com.uy/blog-general/como-se-calcula-el-salario-vacacional/)
- [Salario vacacional en Uruguay - BuscoJobs](https://www.buscojobs.com.uy/blog/salario-vacacional-en-uruguay-como-calcularlo/)
