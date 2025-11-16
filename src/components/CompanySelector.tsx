import { useState, useEffect } from 'react';
import { Building2, Check, Loader2, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getStoredAuthData, clearAuthData } from '../lib/externalAuth';
import Button from './ui/Button';
import Logo from './ui/Logo';

interface Company {
  id: string;
  code: string;
  legal_name: string;
  trade_name: string;
}

interface UserCompany {
  company_id: string;
  role: string;
  is_default: boolean;
  companies: Company;
}

interface CompanySelectorProps {
  onCompanySelected: (companyId: string) => void;
}

export default function CompanySelector({ onCompanySelected }: CompanySelectorProps) {
  const [companies, setCompanies] = useState<UserCompany[]>([]);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);

  useEffect(() => {
    loadUserCompanies();
  }, []);

  const handleSignOut = () => {
    clearAuthData();
    localStorage.removeItem('selected_company_id');
    window.location.href = '/';
  };

  const checkSystemAdmin = () => {
    try {
      // Obtener datos del usuario autenticado desde el sistema externo
      const authData = getStoredAuthData();

      if (!authData.user) return false;

      // Solo el rol "superadmin" tiene acceso a TODAS las empresas
      // Los roles "admin", "administrador" solo tienen acceso a sus empresas asignadas
      const isSuperAdmin = authData.user.role === 'superadmin' ||
                           authData.user.role === 'super_admin' ||
                           authData.user.role === 'superadministrador';

      console.log('[CompanySelector] User role:', authData.user.role, '| Is SuperAdmin:', isSuperAdmin);

      return isSuperAdmin;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };

  const loadUserCompanies = async () => {
    try {
      // Verificar si es superadministrador del sistema
      const isSuperAdmin = checkSystemAdmin();
      setIsSystemAdmin(isSuperAdmin);

      if (isSuperAdmin) {
        // Si es superadmin, cargar TODAS las empresas
        const { data: allCompaniesData, error: allError } = await supabase
          .from('companies')
          .select('id, code, legal_name, trade_name')
          .eq('active', true)
          .order('legal_name', { ascending: true });

        if (allError) throw allError;

        // Obtener las empresas asignadas para saber el rol
        const authData = getStoredAuthData();
        const userEmail = authData?.user?.email;

        // Buscar el usuario en app_users por email
        const { data: appUser } = await supabase
          .from('app_users')
          .select('id')
          .eq('email', userEmail)
          .maybeSingle();

        if (!appUser) {
          console.error('Usuario no encontrado en app_users');
          setLoading(false);
          return;
        }

        const { data: userCompaniesData } = await supabase
          .from('user_companies')
          .select('company_id, role, is_default')
          .eq('user_id', appUser.id)
          .eq('active', true);

        // Mapear todas las empresas con información de rol si la tiene
        const companiesWithRole = allCompaniesData?.map(company => {
          const userCompany = userCompaniesData?.find(uc => uc.company_id === company.id);
          return {
            company_id: company.id,
            role: userCompany?.role || 'admin',
            is_default: userCompany?.is_default || false,
            companies: company
          };
        }) || [];

        setCompanies(companiesWithRole);
        setAllCompanies(allCompaniesData || []);

        // Seleccionar empresa por defecto
        const defaultCompany = companiesWithRole.find(uc => uc.is_default);
        if (defaultCompany) {
          setSelectedCompany(defaultCompany.company_id);
        } else if (companiesWithRole.length > 0) {
          setSelectedCompany(companiesWithRole[0].company_id);
        }
      } else {
        // Si NO es superadmin, solo cargar sus empresas asignadas en user_companies
        const authData = getStoredAuthData();
        const userEmail = authData?.user?.email;

        // Buscar el usuario en app_users por email
        const { data: appUser } = await supabase
          .from('app_users')
          .select('id')
          .eq('email', userEmail)
          .maybeSingle();

        if (!appUser) {
          console.error('Usuario no encontrado en app_users');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('user_companies')
          .select(`
            company_id,
            role,
            is_default,
            companies:company_id (
              id,
              code,
              legal_name,
              trade_name
            )
          `)
          .eq('user_id', appUser.id)
          .eq('active', true)
          .order('is_default', { ascending: false });

        if (error) throw error;

        setCompanies(data as any);

        const defaultCompany = data?.find((uc: any) => uc.is_default);
        if (defaultCompany) {
          setSelectedCompany(defaultCompany.company_id);
        } else if (data && data.length === 1) {
          setSelectedCompany((data[0] as any).company_id);
        }
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    if (selectedCompany) {
      localStorage.setItem('selected_company_id', selectedCompany);

      // Si es superadmin del sistema y la empresa no está en user_companies, crear la relación
      if (isSystemAdmin) {
        const authData = getStoredAuthData();

        if (authData.user) {
          // Buscar el usuario en app_users por email
          const { data: appUser } = await supabase
            .from('app_users')
            .select('id')
            .eq('email', authData.user.email)
            .maybeSingle();

          if (appUser) {
            // Verificar si el usuario ya tiene relación con esta empresa
            const { data: existing } = await supabase
              .from('user_companies')
              .select('id')
              .eq('user_id', appUser.id)
              .eq('company_id', selectedCompany)
              .maybeSingle();

            if (!existing) {
              await supabase
                .from('user_companies')
                .insert({
                  user_id: appUser.id,
                  company_id: selectedCompany,
                  role: 'admin',
                  active: true
                });
            }
          }
        }
      }

      onCompanySelected(selectedCompany);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Cargando empresas...</p>
          </div>
        </div>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="fixed inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Sin Empresas Asignadas</h2>
            <p className="text-slate-600 mb-4">
              Tu cuenta ha sido creada exitosamente, pero aún no tienes acceso a ninguna empresa.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm text-blue-900 font-medium mb-2">Siguiente paso:</p>
              <p className="text-sm text-blue-700">
                Un administrador de la empresa debe asignarte acceso antes de que puedas ingresar al sistema.
                Por favor, contacta a tu administrador.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={handleSignOut}
            >
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <Logo size="md" showText={true} variant="white" />
            {isSystemAdmin && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white bg-opacity-20 backdrop-blur rounded-lg">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Admin Sistema</span>
              </div>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold">Selecciona una Empresa</h2>
            <p className="text-blue-100 text-sm">Elige la empresa con la que deseas trabajar</p>
          </div>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {isSystemAdmin && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900">Acceso de SuperAdministrador</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Tienes acceso a todas las empresas del sistema ({companies.length} en total)
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {companies.map((userCompany) => {
              const company = userCompany.companies;
              const isSelected = selectedCompany === company.id;

              return (
                <button
                  key={company.id}
                  onClick={() => setSelectedCompany(company.id)}
                  className={`
                    w-full p-5 rounded-xl border-2 transition-all text-left
                    ${isSelected
                      ? 'border-blue-600 bg-blue-50 shadow-md'
                      : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'
                    }
                  `}
                >
                  <div className="flex items-start gap-4">
                    <div className={`
                      w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0
                      ${isSelected ? 'bg-blue-600' : 'bg-gradient-to-br from-slate-600 to-slate-700'}
                    `}>
                      <Building2 className="w-7 h-7 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-lg font-bold text-slate-900 truncate">
                          {company.legal_name}
                        </h3>
                        {isSelected && (
                          <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-slate-500 mb-2 truncate">
                        {company.trade_name}
                      </p>

                      <div className="flex items-center gap-3 text-xs flex-wrap">
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded font-medium">
                          {company.code}
                        </span>
                        <span className={`px-2 py-1 rounded font-medium ${
                          userCompany.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : userCompany.role === 'manager'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {userCompany.role === 'admin' ? 'Administrador' :
                           userCompany.role === 'manager' ? 'Manager' : 'Empleado'}
                        </span>
                        {userCompany.is_default && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-medium">
                            Por Defecto
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-slate-600">
              {companies.length} {companies.length === 1 ? 'empresa disponible' : 'empresas disponibles'}
              {isSystemAdmin && ' (Acceso total)'}
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleSignOut}
              >
                Cerrar Sesión
              </Button>
              <Button
                variant="primary"
                onClick={handleContinue}
                disabled={!selectedCompany}
              >
                Continuar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
