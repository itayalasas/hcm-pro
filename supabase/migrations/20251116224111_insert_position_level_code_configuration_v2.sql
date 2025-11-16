/*
  # Insert Position Level Code Configuration

  1. Changes
    - Insert default code configuration for position_level entity type
    - Uses prefix 'NIV' (Nivel)
    - Simple sequential numbering without year/month
    - 4-digit sequence length
    - Hyphen separator
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM code_configurations 
    WHERE entity_type = 'position_level' AND company_id IS NULL
  ) THEN
    INSERT INTO code_configurations (
      entity_type,
      prefix,
      use_year,
      use_month,
      sequence_length,
      separator,
      sample,
      current_sequence,
      active
    ) VALUES (
      'position_level',
      'NIV',
      false,
      false,
      4,
      '-',
      'NIV-0001',
      0,
      true
    );
  END IF;
END $$;