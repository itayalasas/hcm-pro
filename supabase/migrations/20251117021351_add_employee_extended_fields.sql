/*
  # Add Extended Employee Fields

  1. Changes to employees table
    - Add health information fields:
      - `health_card_number` (text) - Número de carnet de salud
      - `health_card_expiry` (date) - Vigencia del carnet
      - `health_card_file_url` (text) - URL del archivo del carnet
    
    - Add banking information fields:
      - `bank_name` (text) - Nombre del banco
      - `bank_account_number` (text) - Número de cuenta
      - `bank_account_type` (text) - Tipo de cuenta (checking/savings)
      - `bank_routing_number` (text) - Código de routing/CLABE
    
    - Add emergency contact fields:
      - `emergency_contact_name` (text) - Nombre del contacto
      - `emergency_contact_relationship` (text) - Relación con el empleado
      - `emergency_contact_phone` (text) - Teléfono de emergencia
      - `emergency_contact_phone_alt` (text) - Teléfono alternativo

  2. Notes
    - All new fields are optional
    - File URLs will be stored in Supabase Storage
*/

-- Add health information fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'health_card_number'
  ) THEN
    ALTER TABLE employees ADD COLUMN health_card_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'health_card_expiry'
  ) THEN
    ALTER TABLE employees ADD COLUMN health_card_expiry date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'health_card_file_url'
  ) THEN
    ALTER TABLE employees ADD COLUMN health_card_file_url text;
  END IF;
END $$;

-- Add banking information fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'bank_name'
  ) THEN
    ALTER TABLE employees ADD COLUMN bank_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'bank_account_number'
  ) THEN
    ALTER TABLE employees ADD COLUMN bank_account_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'bank_account_type'
  ) THEN
    ALTER TABLE employees ADD COLUMN bank_account_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'bank_routing_number'
  ) THEN
    ALTER TABLE employees ADD COLUMN bank_routing_number text;
  END IF;
END $$;

-- Add emergency contact fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'emergency_contact_name'
  ) THEN
    ALTER TABLE employees ADD COLUMN emergency_contact_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'emergency_contact_relationship'
  ) THEN
    ALTER TABLE employees ADD COLUMN emergency_contact_relationship text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'emergency_contact_phone'
  ) THEN
    ALTER TABLE employees ADD COLUMN emergency_contact_phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'emergency_contact_phone_alt'
  ) THEN
    ALTER TABLE employees ADD COLUMN emergency_contact_phone_alt text;
  END IF;
END $$;