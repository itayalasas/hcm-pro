/*
  # Seed Banks Data for LATAM Countries

  ## Overview
  Seeds bank data for major LATAM countries including Uruguay, Chile, Colombia, 
  Argentina, Peru, and Mexico with their respective banks and SWIFT codes.

  ## Data Seeded
  - Uruguay (UY): BROU, Santander, Itaú, BBVA, Scotiabank, Heritage, HSBC
  - Chile (CL): Banco de Chile, BancoEstado, Santander, BCI, Itaú, Scotiabank, BBVA
  - Colombia (CO): Bancolombia, Davivienda, Banco de Bogotá, BBVA, Scotiabank, Itaú
  - Argentina (AR): Banco Nación, Banco Provincia, Santander, BBVA, Galicia, Macro
  - Peru (PE): BCP, BBVA Continental, Interbank, Scotiabank, BanBif
  - Mexico (MX): BBVA Bancomer, Santander, Banamex, Banorte, HSBC, Scotiabank

  ## Important Notes
  1. Banks are inserted without company_id (will be available globally)
  2. SWIFT codes are included for international transfers
  3. All banks are set as active by default
  4. Codes follow each country's banking system numbering
*/

-- Insert Uruguay Banks
INSERT INTO banks (code, name, country, swift_code, is_active) VALUES
  ('001', 'Banco República (BROU)', 'UY', 'BROUUYMMXXX', true),
  ('002', 'Banco Santander Uruguay', 'UY', 'BSCHUYMMXXX', true),
  ('003', 'Itaú Uruguay', 'UY', 'ITAUUYMMXXX', true),
  ('004', 'BBVA Uruguay', 'UY', 'BBVAUYMMXXX', true),
  ('005', 'Scotiabank Uruguay', 'UY', 'NOSCUYMMXXX', true),
  ('006', 'Banco Heritage', 'UY', 'HERIUYMMXXX', true),
  ('007', 'HSBC Bank Uruguay', 'UY', 'HSBCUYMMXXX', true),
  ('008', 'Citibank Uruguay', 'UY', 'CITIUYMMXXX', true)
ON CONFLICT (company_id, code, country) DO NOTHING;

-- Insert Chile Banks
INSERT INTO banks (code, name, country, swift_code, is_active) VALUES
  ('001', 'Banco de Chile', 'CL', 'BCHICLRMXXX', true),
  ('012', 'BancoEstado', 'CL', 'BECTCLRMXXX', true),
  ('037', 'Banco Santander Chile', 'CL', 'BSCHCLRMXXX', true),
  ('016', 'Banco de Crédito e Inversiones (BCI)', 'CL', 'CREDCLRMXXX', true),
  ('039', 'Itaú Corpbanca', 'CL', 'ITAUCLRMXXX', true),
  ('014', 'Scotiabank Chile', 'CL', 'SCOTCLRMXXX', true),
  ('504', 'BBVA Chile', 'CL', 'BBVACLRMXXX', true),
  ('009', 'Banco Internacional', 'CL', 'BINVCLRMXXX', true)
ON CONFLICT (company_id, code, country) DO NOTHING;

-- Insert Colombia Banks
INSERT INTO banks (code, name, country, swift_code, is_active) VALUES
  ('007', 'Bancolombia', 'CO', 'COLOCOBMXXX', true),
  ('051', 'Davivienda', 'CO', 'CAFECOBMXXX', true),
  ('001', 'Banco de Bogotá', 'CO', 'BBOGGOBMXXX', true),
  ('013', 'BBVA Colombia', 'CO', 'BBVACOBMXXX', true),
  ('012', 'Banco Colpatria', 'CO', 'COLPCOBMXXX', true),
  ('006', 'Itaú Colombia', 'CO', 'ITAUCOBMXXX', true),
  ('009', 'Citibank Colombia', 'CO', 'CITICOBMXXX', true),
  ('023', 'Banco de Occidente', 'CO', 'OCCICOBMXXX', true),
  ('019', 'Scotiabank Colpatria', 'CO', 'COLPCOBMXXX', true)
ON CONFLICT (company_id, code, country) DO NOTHING;

-- Insert Argentina Banks
INSERT INTO banks (code, name, country, swift_code, is_active) VALUES
  ('011', 'Banco de la Nación Argentina', 'AR', 'NACNARBAARK', true),
  ('014', 'Banco de la Provincia de Buenos Aires', 'AR', 'PRBAARBAXXX', true),
  ('072', 'Banco Santander Río', 'AR', 'BSCHARARXXX', true),
  ('017', 'BBVA Argentina', 'AR', 'BBVAARBA000', true),
  ('007', 'Banco Galicia', 'AR', 'GALAARBA000', true),
  ('285', 'Banco Macro', 'AR', 'MACRARBA000', true),
  ('150', 'ICBC Argentina', 'AR', 'ICBKARBAXXX', true),
  ('044', 'Banco Hipotecario', 'AR', 'HCBAARBA000', true),
  ('016', 'Citibank Argentina', 'AR', 'CITIARBA000', true)
ON CONFLICT (company_id, code, country) DO NOTHING;

-- Insert Peru Banks
INSERT INTO banks (code, name, country, swift_code, is_active) VALUES
  ('002', 'Banco de Crédito del Perú (BCP)', 'PE', 'BCPLPEPL000', true),
  ('011', 'BBVA Continental', 'PE', 'BCONPEPL000', true),
  ('003', 'Interbank', 'PE', 'BINPPEPL000', true),
  ('009', 'Scotiabank Perú', 'PE', 'BSUDPEPL000', true),
  ('038', 'BanBif', 'PE', 'EBANPEPL000', true),
  ('007', 'Citibank Perú', 'PE', 'CITIPEPL000', true),
  ('001', 'Banco de la Nación', 'PE', 'NACIPEPL000', true),
  ('035', 'Banco Pichincha', 'PE', 'PICPPEPL000', true)
ON CONFLICT (company_id, code, country) DO NOTHING;

-- Insert Mexico Banks
INSERT INTO banks (code, name, country, swift_code, is_active) VALUES
  ('012', 'BBVA Bancomer', 'MX', 'BCMRMXMMPYM', true),
  ('014', 'Santander México', 'MX', 'BMSXMXMMXXX', true),
  ('002', 'Banamex (Citibanamex)', 'MX', 'BNMXMXMMXXX', true),
  ('072', 'Banorte', 'MX', 'MENOMXMTXXX', true),
  ('021', 'HSBC México', 'MX', 'BIMEMXMMXXX', true),
  ('044', 'Scotiabank Inverlat', 'MX', 'MBINMXMMXXX', true),
  ('036', 'Inbursa', 'MX', 'INVLMXMMXXX', true),
  ('106', 'Bank of America México', 'MX', 'BOFAMXMMXXX', true),
  ('058', 'Banco Regional (Banregio)', 'MX', 'ABMXMXMMXXX', true)
ON CONFLICT (company_id, code, country) DO NOTHING;