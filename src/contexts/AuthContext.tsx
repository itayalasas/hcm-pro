import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, Employee } from '../lib/supabase';
import { getStoredAuthData, clearAuthData, isTokenExpired, ExternalAuthUser, ExternalAuthTenant } from '../lib/externalAuth';

interface AuthContextType {
  user: ExternalAuthUser | null;
  employee: Employee | null;
  tenant: ExternalAuthTenant | null;
  loading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ExternalAuthUser | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [tenant, setTenant] = useState<ExternalAuthTenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const authData = getStoredAuthData();

    if (!authData.token || !authData.user || isTokenExpired()) {
      clearAuthData();
      setUser(null);
      setEmployee(null);
      setTenant(null);
      setLoading(false);
      return;
    }

    setUser(authData.user);
    setTenant(authData.tenant);

    // Set current user in database session for RLS policies
    try {
      const { data: appUserData } = await supabase
        .from('app_users')
        .select('id')
        .eq('email', authData.user.email)
        .maybeSingle();

      if (appUserData) {
        await supabase.rpc('set_current_user', { user_id: appUserData.id });
      }
    } catch (error) {
      console.error('Error setting current user:', error);
    }

    loadEmployeeData(authData.user.email);
  };

  const loadEmployeeData = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setEmployee(data);
    } catch (error) {
      console.error('Error loading employee data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshAuth = () => {
    checkAuth();
  };

  const signOut = async () => {
    clearAuthData();
    localStorage.removeItem('selected_company_id');
    setUser(null);
    setEmployee(null);
    setTenant(null);
    window.location.href = '/';
  };

  const isAuthenticated = !!user && !!getStoredAuthData().token && !isTokenExpired();

  return (
    <AuthContext.Provider value={{ user, employee, tenant, loading, isAuthenticated, signOut, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
