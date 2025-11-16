/*
  # Insert Code Configurations for Master Data Entities

  ## Overview
  Adds code configurations for master data entities that need automatic codes.

  ## Entity Types Added
  - academic_level (ACAD-001)
  - educational_institution (INST-001)
  - field_of_study (FIELD-001)
  - employment_type (ETYPE-001)
  - work_location (LOC-001)
*/

DO $$
DECLARE
  company_record RECORD;
BEGIN
  FOR company_record IN SELECT id FROM companies LOOP
    -- Academic Levels
    IF NOT EXISTS (
      SELECT 1 FROM code_configurations
      WHERE company_id = company_record.id AND entity_type = 'academic_level'
    ) THEN
      INSERT INTO code_configurations (
        company_id, entity_type, prefix, separator,
        use_year, use_month, sequence_length, current_sequence, sample, active
      ) VALUES (
        company_record.id, 'academic_level', 'ACAD', '-',
        false, false, 3, 0, 'ACAD-001', true
      );
    END IF;

    -- Educational Institutions
    IF NOT EXISTS (
      SELECT 1 FROM code_configurations
      WHERE company_id = company_record.id AND entity_type = 'educational_institution'
    ) THEN
      INSERT INTO code_configurations (
        company_id, entity_type, prefix, separator,
        use_year, use_month, sequence_length, current_sequence, sample, active
      ) VALUES (
        company_record.id, 'educational_institution', 'INST', '-',
        false, false, 3, 0, 'INST-001', true
      );
    END IF;

    -- Fields of Study
    IF NOT EXISTS (
      SELECT 1 FROM code_configurations
      WHERE company_id = company_record.id AND entity_type = 'field_of_study'
    ) THEN
      INSERT INTO code_configurations (
        company_id, entity_type, prefix, separator,
        use_year, use_month, sequence_length, current_sequence, sample, active
      ) VALUES (
        company_record.id, 'field_of_study', 'FIELD', '-',
        false, false, 3, 0, 'FIELD-001', true
      );
    END IF;

    -- Employment Types
    IF NOT EXISTS (
      SELECT 1 FROM code_configurations
      WHERE company_id = company_record.id AND entity_type = 'employment_type'
    ) THEN
      INSERT INTO code_configurations (
        company_id, entity_type, prefix, separator,
        use_year, use_month, sequence_length, current_sequence, sample, active
      ) VALUES (
        company_record.id, 'employment_type', 'ETYPE', '-',
        false, false, 3, 0, 'ETYPE-001', true
      );
    END IF;

    -- Work Locations
    IF NOT EXISTS (
      SELECT 1 FROM code_configurations
      WHERE company_id = company_record.id AND entity_type = 'work_location'
    ) THEN
      INSERT INTO code_configurations (
        company_id, entity_type, prefix, separator,
        use_year, use_month, sequence_length, current_sequence, sample, active
      ) VALUES (
        company_record.id, 'work_location', 'LOC', '-',
        false, false, 3, 0, 'LOC-001', true
      );
    END IF;
  END LOOP;
END $$;