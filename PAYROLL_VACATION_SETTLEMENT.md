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
- **SÍ** se descuenta el 15% de BPS (Seguridad Social) sobre el monto de liquidación
- **SÍ** está sujeto a IRPF (Impuesto a la Renta)
- Debe pagarse ANTES del período de vacaciones
- El cálculo de aportes (BPS) se hace sobre el monto total de la liquidación, no sobre el salario base

### Cómo Crear una Nómina de Liquidación

1. Ir a **Nómina > Períodos de Nómina**
2. Clic en **Crear Período**
3. Seleccionar tipo: **"Liquidación de Vacaciones"**
4. Ingresar fechas de inicio y fin del período (ej: 15 enero - 31 enero)
5. El sistema **automáticamente**:
   - Busca empleados con solicitudes de vacaciones APROBADAS en ese período
   - Pre-selecciona esos empleados
   - Muestra notificación con cantidad de empleados encontrados
6. Continuar con el wizard para procesar la nómina

**Notas importantes:**
- La nómina NO incluye el salario base, solo el pago por días de vacaciones
- Solo se procesan empleados con solicitudes aprobadas en el período
- Si un empleado no tiene solicitudes aprobadas, no se genera recibo para él

### Proceso Automático

Al procesar la nómina de liquidación:

1. El sistema busca **solicitudes de vacaciones aprobadas** del empleado que caen dentro del período
2. Suma los días de todas las solicitudes en ese rango
3. Calcula: **(Salario / 30) × Días de vacaciones**
4. Crea el concepto "Liquidación de Vacaciones" en el recibo con:
   - Cantidad: Número de días de vacaciones
   - Tarifa: Salario diario (Salario/30)
   - Total: Tarifa × Días
5. El recibo muestra SOLO el pago de vacaciones (sin salario base)

**Ejemplo:** Pedro tiene vacaciones aprobadas del 19-23 enero (5 días). Al generar nómina del 15-31 enero, el sistema:
- Detecta las vacaciones del 19-23
- Calcula: $160,000 / 30 = $5,333.33 por día
- Genera recibo por: $5,333.33 × 5 = $26,666.67
- El recibo muestra:
  - **Concepto:** "Vacaciones"
  - **Detalles:** "5 días"
  - **Haberes:** $26,666.67
  - **Aporte Jubilatorio (BPS 15%):** $4,000 (calculado sobre $26,666.67, no sobre el salario base)

### Funciones de Base de Datos

**`calculate_vacation_settlement_by_period(employee_id, start_date, end_date)`**

Busca solicitudes de vacaciones aprobadas del empleado en el período y retorna:
- `vacation_days` - Días de vacaciones aprobadas en el período
- `daily_rate` - Tarifa por día (salario/30)
- `total_amount` - Monto total a pagar

**`get_employees_with_approved_vacations(company_id, start_date, end_date)`**

Retorna lista de empleados con solicitudes de vacaciones aprobadas en el período:
- `employee_id` - ID del empleado
- `employee_name` - Nombre completo
- `total_vacation_days` - Total de días de vacaciones en el período

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
- **Nota:** El monto de liquidación se registra como `base_salary` en el período de nómina
- **BPS (15%):** Se calcula automáticamente sobre el monto total de la liquidación
- **Sujeto a IRPF:** SÍ

### UNPAID_LEAVE - Descuento por Ausencias

- **Categoría:** Descuento (deducción)
- **Cálculo:** Fórmula
- **Fórmula:** `(base_salary / 30) * unpaid_days`
- **Aplica BPS:** SÍ (reduce base imponible)

---

## 5. Flujo de Trabajo Completo

### Escenario 1: Liquidar Vacaciones

**Ejemplo con Pedro Ayala:**
1. **Situación:** Pedro tiene vacaciones aprobadas del **19 al 23 de enero** (5 días)
2. **Salario:** $160,000 mensuales
3. **Proceso de nómina:**
   - Usuario crea período tipo "Liquidación de Vacaciones"
   - Ingresa fechas: **15 enero al 31 enero**
   - Sistema automáticamente:
     - Busca solicitudes aprobadas en ese período
     - Encuentra la solicitud de Pedro (19-23 enero)
     - Pre-selecciona a Pedro
     - Muestra: "1 empleado(s) con vacaciones aprobadas encontrado(s)"
   - Usuario continúa con el wizard
   - Sistema procesa:
     - Calcula: $160,000 / 30 = **$5,333.33** por día
     - Total: $5,333.33 × 5 días = **$26,666.67**
4. **Recibo generado:**
   - **Sueldo Básico:** Se muestra como "Vacaciones" / "5 días" / **$26,666.67**
   - **Aporte Jubilatorio (BPS 15%):** $4,000 (calculado sobre $26,666.67)
   - **Total Gravado:** $26,666.67
   - **Total Descuentos:** $4,000
   - **Neto:** $22,666.67

**Importante:**
- El recibo muestra "Vacaciones X días" en lugar de "Sueldo Básico"
- BPS (15%) SÍ se calcula sobre el monto de liquidación
- IRPF también se calcula según corresponda
- Solo se genera recibo para empleados con solicitudes aprobadas en el período
- Los días vienen de las solicitudes aprobadas, no del balance general

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
