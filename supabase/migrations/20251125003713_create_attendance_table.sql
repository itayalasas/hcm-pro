/*
  # Create Attendance Table
  
  1. Purpose
    - Track employee attendance for payroll calculations
    - Store worked days, hours, and absences
    
  2. New Tables
    - `attendance_records`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `employee_id` (uuid, foreign key to employees)
      - `date` (date)
      - `status` (text) - present, absent, vacation, sick_leave, etc.
      - `hours_worked` (numeric)
      - `overtime_hours` (numeric)
      - `notes` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  3. Security
    - Enable RLS
    - Add policies for company-based access
*/

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  status text NOT NULL DEFAULT 'present',
  hours_worked numeric(5,2) DEFAULT 8.0,
  overtime_hours numeric(5,2) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- Enable RLS
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view attendance for their company"
  ON attendance_records FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert attendance for their company"
  ON attendance_records FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update attendance for their company"
  ON attendance_records FOR UPDATE
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

CREATE POLICY "Users can delete attendance for their company"
  ON attendance_records FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_attendance_company_employee 
  ON attendance_records(company_id, employee_id, date);

-- Create function to calculate worked days in a period
CREATE OR REPLACE FUNCTION calculate_worked_days(
  p_employee_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS TABLE (
  total_days integer,
  worked_days integer,
  absent_days integer,
  total_hours numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (p_end_date - p_start_date + 1)::integer as total_days,
    COUNT(CASE WHEN status = 'present' THEN 1 END)::integer as worked_days,
    COUNT(CASE WHEN status = 'absent' THEN 1 END)::integer as absent_days,
    COALESCE(SUM(hours_worked), 0) as total_hours
  FROM attendance_records
  WHERE employee_id = p_employee_id
    AND date BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql;
