import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function setCurrentUser() {
  const userStr = localStorage.getItem('external_auth_user');
  const user = userStr ? JSON.parse(userStr) : null;

  if (user?.id) {
    await supabase.rpc('set_current_user', { user_id: user.id });
  }
}

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
  phone?: string;
  mobile?: string;
  address_street?: string;
  address_city?: string;
  address_country?: string;
  address_country_iso3?: string;
  date_of_birth?: string;
  national_id?: string;
  salary?: number;
  employment_type?: string;
  health_card_number?: string;
  health_card_expiry?: string;
  bank_id?: string;
  bank_account_number?: string;
  bank_account_type_id?: string;
  bank_routing_number?: string;
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;
  emergency_contact_phone_alt?: string;
  position?: { id: string; title: string; code: string };
  department?: { id: string; name: string; code: string };
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
