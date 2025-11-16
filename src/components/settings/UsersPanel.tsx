import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, RefreshCw, Plus, Trash2, Building2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

interface AppUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  is_active: boolean;
  last_sync_at: string;
  companies?: { id: string; legal_name: string; role: string }[];
}

interface Company {
  id: string;
  legal_name: string;
  code: string;
}

interface SyncResult {
  success: boolean;
  message: string;
  stats: {
    total: number;
    synced: number;
    updated: number;
    errors: number;
  };
  errors?: string[];
}

export default function UsersPanel() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadUsers(), loadCompanies()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('app_users')
        .select('*')
        .order('name');

      if (usersError) throw usersError;

      const usersWithCompanies = await Promise.all(
        (usersData || []).map(async (user) => {
          const { data: userCompanies } = await supabase
            .from('user_companies')
            .select(`
              role,
              company:companies(id, legal_name)
            `)
            .eq('user_id', user.id)
            .eq('active', true);

          return {
            ...user,
            companies: userCompanies?.map((uc: any) => ({
              id: uc.company.id,
              legal_name: uc.company.legal_name,
              role: uc.role,
            })) || [],
          };
        })
      );

      setUsers(usersWithCompanies);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, legal_name, code')
        .eq('active', true)
        .order('legal_name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/sync-users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      setSyncResult(result);
      setShowSyncModal(true);

      if (result.success) {
        await loadUsers();
      }
    } catch (error) {
      console.error('Error syncing users:', error);
      setSyncResult({
        success: false,
        message: 'Error de conexión',
        stats: { total: 0, synced: 0, updated: 0, errors: 1 },
        errors: ['No se pudo conectar con el servicio de sincronización'],
      });
      setShowSyncModal(true);
    } finally {
      setSyncing(false);
    }
  };

  const handleAssignCompany = async () => {
    if (!selectedUser || !selectedCompanyId) {
      setToast({ message: 'Por favor seleccione una empresa', type: 'warning' });
      return;
    }

    const roleMapping: Record<string, 'admin' | 'manager' | 'employee'> = {
      'admin': 'admin',
      'manager': 'manager',
      'employee': 'employee',
      'user': 'employee',
      'Administrador': 'admin',
      'Gerente': 'manager',
      'Empleado': 'employee',
      'Usuario': 'employee',
    };

    const userRole = roleMapping[selectedUser.role] || 'employee';

    try {
      const { error } = await supabase
        .from('user_companies')
        .insert({
          user_id: selectedUser.id,
          company_id: selectedCompanyId,
          role: userRole,
          active: true,
        });

      if (error) {
        if (error.code === '23505') {
          setToast({ message: 'Este usuario ya está asignado a esta empresa', type: 'warning' });
        } else {
          throw error;
        }
        return;
      }

      setShowAssignModal(false);
      setSelectedUser(null);
      setSelectedCompanyId('');
      setToast({ message: 'Empresa asignada exitosamente', type: 'success' });
      loadUsers();
    } catch (error) {
      console.error('Error assigning company:', error);
      setToast({ message: 'Error al asignar empresa', type: 'error' });
    }
  };

  const handleRemoveCompany = async (userId: string, companyId: string) => {
    if (!confirm('¿Está seguro de quitar esta empresa del usuario?')) return;

    try {
      const { error } = await supabase
        .from('user_companies')
        .delete()
        .eq('user_id', userId)
        .eq('company_id', companyId);

      if (error) throw error;
      setToast({ message: 'Empresa removida exitosamente', type: 'success' });
      loadUsers();
    } catch (error) {
      console.error('Error removing company:', error);
      setToast({ message: 'Error al quitar empresa', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gestión de Usuarios</h2>
          <p className="text-slate-600 mt-1">Sincroniza usuarios y asigna empresas</p>
        </div>
        <Button onClick={handleSync} disabled={syncing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Sincronizando...' : 'Sincronizar Usuarios'}
        </Button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-medium mb-1">Sincronización de Usuarios</p>
          <p>Los usuarios se sincronizan desde el sistema de autenticación. Usa el botón "Sincronizar Usuarios" para obtener la lista actualizada.</p>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">No hay usuarios sincronizados</p>
          <Button onClick={handleSync} disabled={syncing}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Sincronizar Ahora
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-white border border-slate-200 rounded-lg p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-slate-900">{user.name}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      user.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {user.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                    {user.role && (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                        {user.role}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mb-1">{user.email}</p>
                  <p className="text-xs text-slate-500">
                    Última sincronización: {new Date(user.last_sync_at).toLocaleString('es-ES')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedUser(user);
                    setShowAssignModal(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Asignar Empresa
                </Button>
              </div>

              {user.companies && user.companies.length > 0 ? (
                <div className="border-t border-slate-200 pt-4">
                  <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Empresas Asignadas ({user.companies.length})
                  </h4>
                  <div className="space-y-2">
                    {user.companies.map((company) => (
                      <div
                        key={company.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-slate-900">{company.legal_name}</span>
                          <span className="px-2 py-0.5 text-xs font-medium bg-slate-200 text-slate-700 rounded">
                            {company.role}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveCompany(user.id, company.id)}
                          className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Quitar empresa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="border-t border-slate-200 pt-4">
                  <p className="text-sm text-slate-500 italic">Sin empresas asignadas</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedUser(null);
          setSelectedCompanyId('');
        }}
        title={`Asignar Empresa a ${selectedUser?.name}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Empresa *
            </label>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar empresa...</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.legal_name} ({company.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Rol en la Empresa
            </label>
            <div className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-700">
              {selectedUser?.role === 'admin' || selectedUser?.role === 'Administrador' ? 'Administrador' :
               selectedUser?.role === 'manager' || selectedUser?.role === 'Gerente' ? 'Gerente' : 'Empleado'}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              El rol se sincroniza automáticamente desde el sistema de autenticación
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowAssignModal(false);
                setSelectedUser(null);
                setSelectedCompanyId('');
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button onClick={handleAssignCompany} className="flex-1">
              Asignar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showSyncModal}
        onClose={() => {
          setShowSyncModal(false);
        }}
        title="Resultado de Sincronización"
      >
        {syncResult && (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg border-2 ${
              syncResult.success && syncResult.stats.errors === 0
                ? 'bg-green-50 border-green-200'
                : syncResult.stats.errors > 0
                ? 'bg-amber-50 border-amber-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                {syncResult.success && syncResult.stats.errors === 0 ? (
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                ) : syncResult.stats.errors > 0 ? (
                  <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className={`font-semibold mb-1 ${
                    syncResult.success && syncResult.stats.errors === 0
                      ? 'text-green-900'
                      : syncResult.stats.errors > 0
                      ? 'text-amber-900'
                      : 'text-red-900'
                  }`}>
                    {syncResult.success && syncResult.stats.errors === 0
                      ? 'Sincronización Completada'
                      : syncResult.stats.errors > 0
                      ? 'Sincronización Completada con Advertencias'
                      : 'Error en Sincronización'}
                  </h3>
                  <p className={`text-sm ${
                    syncResult.success && syncResult.stats.errors === 0
                      ? 'text-green-700'
                      : syncResult.stats.errors > 0
                      ? 'text-amber-700'
                      : 'text-red-700'
                  }`}>
                    {syncResult.message}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500 uppercase font-medium mb-1">Total Procesados</p>
                <p className="text-2xl font-bold text-slate-900">{syncResult.stats.total}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-green-600 uppercase font-medium mb-1">Nuevos</p>
                <p className="text-2xl font-bold text-green-700">{syncResult.stats.synced}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-600 uppercase font-medium mb-1">Actualizados</p>
                <p className="text-2xl font-bold text-blue-700">{syncResult.stats.updated}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-xs text-red-600 uppercase font-medium mb-1">Errores</p>
                <p className="text-2xl font-bold text-red-700">{syncResult.stats.errors}</p>
              </div>
            </div>

            {syncResult.errors && syncResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-900">Detalles de Errores:</h4>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {syncResult.errors.map((error, index) => (
                    <div key={index} className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                      {error}
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-xs text-blue-900">
                    <strong>Nota:</strong> Si ves el error "Could not find the table 'public.app_users'",
                    necesitas ejecutar las migraciones de base de datos. Contacta al administrador del sistema.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button
                onClick={() => {
                  setShowSyncModal(false);
                }}
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
          <div className={`px-6 py-4 rounded-lg shadow-lg border-2 flex items-center gap-3 ${
            toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
            toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
            'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {toast.type === 'error' && <XCircle className="w-5 h-5" />}
            {toast.type === 'warning' && <AlertCircle className="w-5 h-5" />}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
