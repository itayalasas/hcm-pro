/*
  # Seed Payroll Master Data (Fixed)

  1. Data Insertion
    - Contributor types (BPS types for Uruguay as example)
    - Contribution regimes
    - Company types
    - Company document types
    - Economic activities (CIUU codes)
    - Submission types
    - Currencies

  2. Notes
    - Data is based on Latin American payroll systems
    - Can be extended for other countries
*/

-- Contributor Types (NC01)
INSERT INTO contributor_types (code, name, description, country_code, display_order) VALUES
('85', 'Industria y Comercio', 'Empresas del sector industrial y comercial', 'URY', 1),
('82', 'Rural', 'Empresas del sector rural y agropecuario', 'URY', 2),
('84', 'Construcción', 'Empresas del sector construcción', 'URY', 3),
('86', 'Transporte', 'Empresas del sector transporte', 'URY', 4),
('87', 'Servicios', 'Empresas del sector servicios', 'URY', 5)
ON CONFLICT (code) DO NOTHING;

-- Contribution Regimes (NC02)
INSERT INTO contribution_regimes (code, name, description, country_code, display_order) VALUES
('IND_COM', 'Industria y Comercio', 'Régimen para industria y comercio', 'URY', 1),
('CONST', 'Construcción', 'Régimen para construcción', 'URY', 2),
('RURAL', 'Rural', 'Régimen para sector rural', 'URY', 3),
('SERV_DOM', 'Servicio Doméstico', 'Régimen para servicio doméstico', 'URY', 4),
('TRANSPORTE', 'Transporte', 'Régimen para transporte', 'URY', 5)
ON CONFLICT (code) DO NOTHING;

-- Company Types (NC03)
INSERT INTO company_types (code, name, description, display_order) VALUES
('UNIP', 'Unipersonal', 'Empresa unipersonal', 1),
('SRL', 'Sociedad de Responsabilidad Limitada', 'S.R.L.', 2),
('SAS', 'Sociedad por Acciones Simplificada', 'S.A.S.', 3),
('SA', 'Sociedad Anónima', 'S.A.', 4),
('COOP', 'Cooperativa', 'Cooperativa', 5),
('ASSOC', 'Asociación Civil', 'Asociación sin fines de lucro', 6),
('FUND', 'Fundación', 'Fundación', 7),
('OTHER', 'Otro', 'Otro tipo de organización', 99)
ON CONFLICT (code) DO NOTHING;

-- Company Document Types (NC04)
INSERT INTO company_document_types (code, name, description, country_code, display_order) VALUES
('RUT', 'RUT', 'Registro Único Tributario (Uruguay)', 'URY', 1),
('RFC', 'RFC', 'Registro Federal de Contribuyentes (México)', 'MEX', 2),
('RUC', 'RUC', 'Registro Único de Contribuyentes (Perú, Ecuador)', 'PER', 3),
('NIT', 'NIT', 'Número de Identificación Tributaria (Colombia, Bolivia)', 'COL', 4),
('CUIT', 'CUIT', 'Clave Única de Identificación Tributaria (Argentina)', 'ARG', 5),
('CNPJ', 'CNPJ', 'Cadastro Nacional da Pessoa Jurídica (Brasil)', 'BRA', 6),
('EIN', 'EIN', 'Employer Identification Number (USA)', 'USA', 7)
ON CONFLICT (code) DO NOTHING;

-- Economic Activities (NC05) - Sample CIUU codes
INSERT INTO economic_activities (code, name, description, classification_system, display_order) VALUES
('0111', 'Cultivo de cereales', 'Cultivo de cereales excepto arroz, legumbres y semillas oleaginosas', 'CIUU', 1),
('1010', 'Elaboración y conservación de carne', 'Producción, elaboración y conservación de carne y productos cárnicos', 'CIUU', 2),
('1511', 'Curtido y adobo de cueros', 'Curtido y adobo de cueros; fabricación de maletas, bolsos de mano', 'CIUU', 3),
('2411', 'Fabricación de sustancias químicas', 'Fabricación de sustancias químicas básicas, abonos', 'CIUU', 4),
('4520', 'Mantenimiento de vehículos', 'Mantenimiento y reparación de vehículos automotores', 'CIUU', 5),
('4711', 'Comercio al por menor', 'Comercio al por menor en comercios no especializados', 'CIUU', 6),
('5510', 'Hoteles', 'Actividades de alojamiento de hoteles', 'CIUU', 7),
('5610', 'Restaurantes', 'Actividades de restaurantes y de servicio móvil de comidas', 'CIUU', 8),
('6201', 'Programación informática', 'Actividades de programación informática', 'CIUU', 9),
('6311', 'Procesamiento de datos', 'Procesamiento de datos, hospedaje y actividades conexas', 'CIUU', 10),
('6920', 'Servicios de contabilidad', 'Actividades de contabilidad, teneduría de libros', 'CIUU', 11),
('7020', 'Consultoría de gestión', 'Actividades de consultoría de gestión empresarial', 'CIUU', 12),
('8010', 'Seguridad privada', 'Actividades de seguridad privada', 'CIUU', 13),
('8511', 'Educación preescolar', 'Enseñanza preescolar', 'CIUU', 14),
('8610', 'Actividades de hospitales', 'Actividades de hospitales y clínicas', 'CIUU', 15)
ON CONFLICT (code) DO NOTHING;

-- Submission Types (NC07)
INSERT INTO submission_types (code, name, description, display_order) VALUES
('ORIG', 'Original', 'Envío original de nómina', 1),
('RECT', 'Rectificativa', 'Envío rectificativo para corregir errores', 2),
('SUST', 'Sustitutiva', 'Envío sustitutivo que reemplaza completamente el anterior', 3)
ON CONFLICT (code) DO NOTHING;

-- Update existing currencies table with display_order
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'currencies' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE currencies ADD COLUMN display_order INTEGER DEFAULT 0;
  END IF;
END $$;

-- Insert currencies using existing schema
INSERT INTO currencies (code, name, symbol) VALUES
('UYU', 'Peso Uruguayo', '$'),
('MXN', 'Peso Mexicano', '$'),
('ARS', 'Peso Argentino', '$'),
('CLP', 'Peso Chileno', '$'),
('COP', 'Peso Colombiano', '$'),
('PEN', 'Sol Peruano', 'S/'),
('BRL', 'Real Brasileño', 'R$'),
('EUR', 'Euro', '€'),
('GBP', 'Libra Esterlina', '£')
ON CONFLICT (code) DO NOTHING;
