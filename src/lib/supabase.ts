import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Employee = {
  id: string;
  employee_number: string;
  user_id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  email: string;
  photo_url?: string;
  status: string;
  hire_date: string;
  business_unit_id?: string;
  position_id?: string;
  cost_center_id?: string;
  direct_manager_id?: string;
  work_location?: string;
};

export type Company = {
  id: string;
  code: string;
  legal_name: string;
  trade_name?: string;
  tax_id: string;
  logo_url?: string;
  primary_color: string;
};

export type LeaveRequest = {
  id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason?: string;
  status: string;
  approved_by?: string;
  approval_date?: string;
  approval_comments?: string;
};

export type LeaveBalance = {
  id: string;
  employee_id: string;
  leave_type_id: string;
  year: number;
  total_days: number;
  used_days: number;
  pending_days: number;
  available_days: number;
};
