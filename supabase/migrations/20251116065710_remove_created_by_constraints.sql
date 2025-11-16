/*
  # Eliminar Constraints de created_by
  
  ## Cambios
  1. Eliminar foreign keys de created_by que referencian auth.users
  2. Hacer campos created_by nullable y sin constraints
  
  ## Por qué
  - Sistema usa autenticación externa
  - No hay usuarios en auth.users
  - Los campos created_by pueden ser NULL o eliminados
*/

-- Eliminar foreign keys de created_by si existen
DO $$
DECLARE
    constraint_rec RECORD;
BEGIN
    FOR constraint_rec IN
        SELECT conname, conrelid::regclass AS table_name
        FROM pg_constraint
        WHERE contype = 'f'
        AND confrelid = 'auth.users'::regclass
        AND conname LIKE '%created_by%'
    LOOP
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I', 
                      constraint_rec.table_name, 
                      constraint_rec.conname);
    END LOOP;
END $$;

-- Hacer que created_by sea nullable en todas las tablas
ALTER TABLE departments ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE positions ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE work_locations ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE custom_fields ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE workflows ALTER COLUMN created_by DROP NOT NULL;
