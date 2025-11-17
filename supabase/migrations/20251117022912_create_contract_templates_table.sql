/*
  # Create Contract Templates Table

  1. New Tables
    - `contract_templates`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `name` (text) - Nombre de la plantilla
      - `position_id` (uuid, nullable, foreign key to positions) - Puesto asociado (opcional)
      - `content` (text) - Contenido de la plantilla con variables
      - `version` (integer) - Versión de la plantilla
      - `is_active` (boolean) - Si es la versión activa
      - `created_by` (uuid) - Usuario que creó la plantilla
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `notes` (text) - Notas sobre cambios en esta versión

  2. Security
    - Enable RLS on `contract_templates` table
    - Add policies for authenticated users to manage templates in their company

  3. Notes
    - Las variables se marcan con corchetes: [NOMBRE_VARIABLE]
    - Solo puede haber una versión activa por puesto
    - Si position_id es null, es una plantilla genérica
*/

-- Create contract_templates table
CREATE TABLE IF NOT EXISTS contract_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  position_id uuid REFERENCES positions(id) ON DELETE SET NULL,
  content text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  notes text,
  CONSTRAINT unique_active_template_per_position UNIQUE (company_id, position_id, is_active) 
    DEFERRABLE INITIALLY DEFERRED
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_contract_templates_company ON contract_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_contract_templates_position ON contract_templates(position_id);
CREATE INDEX IF NOT EXISTS idx_contract_templates_active ON contract_templates(company_id, is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view templates in their company"
  ON contract_templates FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert templates in their company"
  ON contract_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update templates in their company"
  ON contract_templates FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete templates in their company"
  ON contract_templates FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

-- Insert default template
INSERT INTO contract_templates (company_id, name, content, version, is_active, notes)
SELECT 
  id as company_id,
  'Plantilla General' as name,
  'CONTRATO INDIVIDUAL DE TRABAJO

Entre:
[NOMBRE_EMPRESA], con domicilio en [DIRECCION_EMPRESA], representada en este acto por [REPRESENTANTE_EMPRESA], en calidad de [CARGO_REPRESENTANTE], a quien en adelante se denominará "EL EMPLEADOR", por una parte.

Y por la otra, [NOMBRE_EMPLEADO], titular de la cédula de identidad/DNI número [RFC_EMPLEADO], con domicilio en [DIRECCION_EMPLEADO], [CIUDAD_EMPLEADO], [PAIS_EMPLEADO], quien en adelante se denominará "EL TRABAJADOR", convienen celebrar el presente contrato de trabajo, el cual se regirá por las siguientes cláusulas:

CLÁUSULAS

PRIMERA – Objeto:
El EMPLEADOR contrata al TRABAJADOR para desempeñar el cargo de [PUESTO_EMPLEADO], cuyas funciones principales serán las correspondientes a su puesto de trabajo.

SEGUNDA – Jornada laboral:
El TRABAJADOR trabajará una jornada según el tipo de contrato [TIPO_EMPLEO], en el horario establecido por la empresa. Cualquier modificación será notificada con la debida anticipación.

TERCERA – Duración del contrato:
Este contrato tendrá una duración [TIPO_EMPLEO], comenzando a partir del día [FECHA_INICIO].

CUARTA – Remuneración:
El TRABAJADOR recibirá una remuneración mensual de $[SALARIO] MXN, pagadera mensualmente mediante depósito a la cuenta bancaria proporcionada:
- Banco: [BANCO]
- Cuenta: [NUMERO_CUENTA]
- Tipo: [TIPO_CUENTA]

QUINTA – Obligaciones del trabajador:
El TRABAJADOR se compromete a cumplir con sus funciones con la debida diligencia, eficiencia y responsabilidad, respetando las políticas internas, confidencialidad y normas de seguridad vigentes en la empresa.

SEXTA – Beneficios:
El TRABAJADOR tendrá derecho a los beneficios establecidos por la ley laboral vigente.

SÉPTIMA – Información de Salud:
El TRABAJADOR declara contar con carnet de salud número [CARNET_SALUD] con vigencia hasta [VIGENCIA_CARNET].

OCTAVA – Contacto de Emergencia:
En caso de emergencia, la empresa contactará a [CONTACTO_EMERGENCIA], [RELACION_EMERGENCIA], al teléfono [TELEFONO_EMERGENCIA].

NOVENA – Confidencialidad:
El TRABAJADOR se obliga a guardar estricta reserva de toda información relacionada con el EMPLEADOR, incluso después de la terminación del presente contrato.

DÉCIMA – Terminación:
Cualquiera de las partes podrá dar por finalizado este contrato conforme a las disposiciones legales vigentes, debiendo comunicarlo por escrito con la antelación establecida por ley.

DÉCIMA PRIMERA – Legislación aplicable:
Este contrato se regirá por las disposiciones de la Ley Federal del Trabajo de México.

Firmas:

_________________________              _________________________
[REPRESENTANTE_EMPRESA]                [NOMBRE_EMPLEADO]
[CARGO_REPRESENTANTE]                  RFC: [RFC_EMPLEADO]
Por [NOMBRE_EMPRESA]

Fecha: [FECHA_CONTRATO]' as content,
  1 as version,
  true as is_active,
  'Plantilla inicial del sistema' as notes
FROM companies
WHERE NOT EXISTS (
  SELECT 1 FROM contract_templates WHERE contract_templates.company_id = companies.id
);