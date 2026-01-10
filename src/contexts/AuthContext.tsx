import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, Employee } from '../lib/supabase';
import {
  getStoredAuthData,
  clearAuthData,
  isTokenExpired,
  ExternalAuthUser,
  ExternalAuthTenant,
  hasModulePermission,
  hasAnyPermission,
  canRead,
  canCreate,
  canUpdate,
  canDelete
} from '../lib/externalAuth';

interface AuthContextType {
  user: ExternalAuthUser | null;
  employee: Employee | null;
  tenant: ExternalAuthTenant | null;
  hasAccess: boolean;
  loading: boolean;
  isAuthenticated: boolean;
  isEmployee: boolean;
  employeeCompanyId: string | null;
  signOut: () => Promise<void>;
  refreshAuth: () => void;
  hasModulePermission: (module: string, permission: string) => boolean;
  hasAnyPermission: (module: string) => boolean;
  canRead: (module: string) => boolean;
  canCreate: (module: string) => boolean;
  canUpdate: (module: string) => boolean;
  canDelete: (module: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ExternalAuthUser | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [tenant, setTenant] = useState<ExternalAuthTenant | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [employeeCompanyId, setEmployeeCompanyId] = useState<string | null>(null);

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
      setHasAccess(false);
      setLoading(false);
      return;
    }

    setUser(authData.user);
    setTenant(authData.tenant);
    setHasAccess(authData.hasAccess);

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

      if (data && data.company_id) {
        setEmployeeCompanyId(data.company_id);
      }
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
    setHasAccess(false);
    setEmployeeCompanyId(null);
    window.location.href = '/';
  };

  const isAuthenticated = !!user && !!getStoredAuthData().token && !isTokenExpired();
  const isEmployee = user?.role === 'empleado';

  const checkModulePermission = (module: string, permission: string) => {
    return hasModulePermission(user, module, permission);
  };

  const checkAnyPermission = (module: string) => {
    return hasAnyPermission(user, module);
  };

  const checkCanRead = (module: string) => {
    return canRead(user, module);
  };

  const checkCanCreate = (module: string) => {
    return canCreate(user, module);
  };

  const checkCanUpdate = (module: string) => {
    return canUpdate(user, module);
  };

  const checkCanDelete = (module: string) => {
    return canDelete(user, module);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        employee,
        tenant,
        hasAccess,
        loading,
        isAuthenticated,
        isEmployee,
        employeeCompanyId,
        signOut,
        refreshAuth,
        hasModulePermission: checkModulePermission,
        hasAnyPermission: checkAnyPermission,
        canRead: checkCanRead,
        canCreate: checkCanCreate,
        canUpdate: checkCanUpdate,
        canDelete: checkCanDelete
      }}
    >
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
