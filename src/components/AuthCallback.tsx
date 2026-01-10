import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { exchangeCodeForToken, storeAuthData, parseCallbackUrl } from '../lib/externalAuth';
import { supabase } from '../lib/supabase';
import { LogoIcon } from './ui/Logo';

interface AuthCallbackProps {
  onSuccess: () => void;
}

export default function AuthCallback({ onSuccess }: AuthCallbackProps) {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    handleCallback();
  }, []);

  const getErrorMessage = (err: any): string => {
    const errorMessage = err?.message || '';
    const errorText = err?.response?.text || '';

    if (errorMessage.includes('CODE_ALREADY_USED') || errorText.includes('CODE_ALREADY_USED')) {
      return 'Su sesión ha expirado. Por favor, autentíquese nuevamente.';
    }

    if (errorMessage.includes('401') || errorText.includes('401')) {
      return 'Su sesión ha expirado o las credenciales no son válidas. Por favor, inicie sesión nuevamente.';
    }

    if (errorMessage.includes('No authorization code')) {
      return 'No se recibió el código de autorización. Por favor, intente iniciar sesión nuevamente.';
    }

    if (errorMessage.includes('failed') || errorMessage.includes('Failed')) {
      return 'Error al procesar la autenticación. Por favor, intente nuevamente.';
    }

    return 'Ocurrió un error durante la autenticación. Por favor, intente nuevamente.';
  };

  const handleCallback = async () => {
    try {
      const { code } = parseCallbackUrl(window.location.href);

      if (!code) {
        throw new Error('No authorization code found');
      }

      setStatus('processing');

      const authResponse = await exchangeCodeForToken(code);

      if (!authResponse.success) {
        throw new Error('Authentication failed');
      }

      storeAuthData(authResponse.data);

      const { user, tenant } = authResponse.data;

      const { data: existingAppUser } = await supabase
        .from('app_users')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();

      if (!existingAppUser) {
        const { error: appUserError } = await supabase
          .from('app_users')
          .insert({
            email: user.email,
            name: user.name,
            role: user.role,
            active: true,
          });

        if (appUserError) {
          console.error('Error creating app user:', appUserError);
        }
      }

      let { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('legal_name', tenant.organization_name)
        .maybeSingle();

      if (!company) {
        const { data: newCompany, error: companyError } = await supabase
          .from('companies')
          .insert({
            code: tenant.id.substring(0, 10).toUpperCase(),
            legal_name: tenant.organization_name,
            trade_name: tenant.name,
            tax_id: tenant.id,
            email: tenant.owner_email,
            active: true,
          })
          .select()
          .single();

        if (companyError) {
          console.error('Error creating company:', companyError);
          throw companyError;
        }
        company = newCompany;
      }

      if (user.role.toLowerCase() === 'empleado' || user.role.toLowerCase() === 'employee') {
        const { data: existingEmployee, error: checkError } = await supabase
          .from('employees')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking employee:', checkError);
        }

        if (!existingEmployee) {
          const nameParts = user.name.split(' ');
          const firstName = nameParts[0] || user.name;
          const lastName = nameParts.slice(1).join(' ') || '';

          const employeeNumber = `EMP-${Date.now().toString().slice(-6)}`;

          const { error: employeeError } = await supabase.from('employees').insert({
            employee_number: employeeNumber,
            company_id: company.id,
            first_name: firstName,
            last_name: lastName,
            email: user.email,
            status: 'active',
            hire_date: new Date().toISOString().split('T')[0],
            work_location: 'remote',
          });

          if (employeeError) {
            console.error('Error creating employee:', employeeError);
            throw employeeError;
          }
        }
      } else {
        const { data: appUserData } = await supabase
          .from('app_users')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();

        if (appUserData && company) {
          const { data: existingUserCompany } = await supabase
            .from('user_companies')
            .select('id')
            .eq('user_id', appUserData.id)
            .eq('company_id', company.id)
            .maybeSingle();

          if (!existingUserCompany) {
            const { error: userCompanyError } = await supabase
              .from('user_companies')
              .insert({
                user_id: appUserData.id,
                company_id: company.id,
                role: user.role,
                active: true,
              });

            if (userCompanyError) {
              console.error('Error creating user-company relationship:', userCompanyError);
            }
          }
        }
      }

      setStatus('success');

      setTimeout(() => {
        window.history.replaceState({}, '', '/');
        onSuccess();
      }, 1500);

    } catch (err: any) {
      console.error('Auth callback error:', err);
      setError(getErrorMessage(err));
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 flex justify-center">
          <LogoIcon size={64} />
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          {status === 'processing' && (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                Procesando autenticación...
              </h2>
              <p className="text-slate-600">
                Por favor espera mientras completamos tu inicio de sesión
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                ¡Autenticación exitosa!
              </h2>
              <p className="text-slate-600">
                Redirigiendo al dashboard...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                Error de autenticación
              </h2>
              <p className="text-slate-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Volver al inicio
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
