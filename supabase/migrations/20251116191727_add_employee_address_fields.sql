/*
  # Agregar campos de dirección a empleados

  ## Descripción
  Agrega campos para almacenar información de dirección completa de los empleados,
  incluyendo país, ciudad, código ISO3 y dirección detallada.

  ## Cambios
  1. Agregar columnas a la tabla employees:
     - address_street: Dirección completa (calle, número, colonia)
     - address_city: Ciudad
     - address_country: País
     - address_country_iso3: Código ISO3 del país
     - postal_code: Código postal (opcional)
*/

-- Agregar columnas de dirección
DO $$
BEGIN
  -- address_street
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'address_street'
  ) THEN
    ALTER TABLE employees ADD COLUMN address_street text;
  END IF;

  -- address_city
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'address_city'
  ) THEN
    ALTER TABLE employees ADD COLUMN address_city text;
  END IF;

  -- address_country
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'address_country'
  ) THEN
    ALTER TABLE employees ADD COLUMN address_country text;
  END IF;

  -- address_country_iso3
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'address_country_iso3'
  ) THEN
    ALTER TABLE employees ADD COLUMN address_country_iso3 varchar(3);
  END IF;

  -- postal_code
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'postal_code'
  ) THEN
    ALTER TABLE employees ADD COLUMN postal_code varchar(20);
  END IF;
END $$;
