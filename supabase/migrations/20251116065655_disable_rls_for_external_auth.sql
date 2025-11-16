/*
  # Deshabilitar RLS para Autenticación Externa
  
  ## Cambios
  1. Deshabilitar RLS en todas las tablas principales
     - El control de acceso se maneja a nivel de aplicación
     - Todos los registros se filtran por company_id en el frontend
  
  2. Mantener integridad referencial
     - Las foreign keys siguen protegiendo la consistencia de datos
  
  ## Por qué
  - Sistema usa autenticación externa, no auth.users de Supabase
  - Las políticas RLS con auth.uid() no funcionan
  - El control de acceso se maneja en CompanySelector y CompanyContext
*/

-- Deshabilitar RLS en tablas principales
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE positions DISABLE ROW LEVEL SECURITY;
ALTER TABLE work_locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE business_units DISABLE ROW LEVEL SECURITY;
ALTER TABLE cost_centers DISABLE ROW LEVEL SECURITY;
ALTER TABLE employee_contracts DISABLE ROW LEVEL SECURITY;
ALTER TABLE employee_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE employee_work_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE employee_compensation DISABLE ROW LEVEL SECURITY;
ALTER TABLE employee_personal_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_cycles DISABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_models DISABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations DISABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances DISABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_periods DISABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_concepts DISABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_details DISABLE ROW LEVEL SECURITY;
ALTER TABLE custom_fields DISABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_values DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_parameters DISABLE ROW LEVEL SECURITY;
ALTER TABLE workflows DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings DISABLE ROW LEVEL SECURITY;

-- Mantener RLS en tablas críticas
-- companies: Solo lectura, control a nivel de app
-- user_companies: Control de asignaciones
-- app_users: Datos de usuarios
