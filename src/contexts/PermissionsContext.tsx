import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useCompany } from './CompanyContext';

interface Permission {
  permission_code: string;
  permission_name: string;
  granted: boolean;
}

interface PermissionsContextType {
  permissions: Map<string, Permission[]>;
  hasPermission: (moduleCode: string, permissionCode: string) => boolean;
  canApproveLeaveRequest: (leaveRequestId: string) => Promise<{ canApprove: boolean; reason: string }>;
  loading: boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  const [permissions, setPermissions] = useState<Map<string, Permission[]>>(new Map());
  const [loading, setLoading] = useState(true);

  const loadPermissions = async () => {
    if (!user) {
      setPermissions(new Map());
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const newPermissions = new Map<string, Permission[]>();

      if (user.permissions && typeof user.permissions === 'object') {
        for (const [moduleCode, perms] of Object.entries(user.permissions)) {
          if (Array.isArray(perms)) {
            const permissionsList: Permission[] = perms.map(p => ({
              permission_code: p,
              permission_name: p,
              granted: true
            }));
            newPermissions.set(moduleCode, permissionsList);
          }
        }
      }

      setPermissions(newPermissions);
    } catch (error) {
      console.error('Error loading permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, [user, currentCompany]);

  const hasPermission = (moduleCode: string, permissionCode: string): boolean => {
    const modulePermissions = permissions.get(moduleCode);
    if (!modulePermissions) return false;

    const permission = modulePermissions.find(p => p.permission_code === permissionCode);
    return permission?.granted === true;
  };

  const canApproveLeaveRequest = async (leaveRequestId: string): Promise<{ canApprove: boolean; reason: string }> => {
    if (!user || !currentCompany) {
      return { canApprove: false, reason: 'Usuario no autenticado' };
    }

    try {
      const { data, error } = await supabase
        .rpc('can_approve_leave_request', {
          p_approver_id: user.id,
          p_leave_request_id: leaveRequestId,
          p_company_id: currentCompany.id
        });

      if (error) throw error;

      if (data && data.length > 0) {
        return {
          canApprove: data[0].can_approve,
          reason: data[0].reason
        };
      }

      return { canApprove: false, reason: 'Error al verificar permisos' };
    } catch (error) {
      console.error('Error checking approval permission:', error);
      return { canApprove: false, reason: 'Error al verificar permisos' };
    }
  };

  return (
    <PermissionsContext.Provider
      value={{
        permissions,
        hasPermission,
        canApproveLeaveRequest,
        loading,
        refreshPermissions: loadPermissions
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}
