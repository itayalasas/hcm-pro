import { useEffect, useState } from 'react';
import { Briefcase, AlertCircle } from 'lucide-react';
import { exchangeCodeForToken, storeAuthData, parseCallbackUrl } from '../lib/externalAuth';
import { supabase } from '../lib/supabase';

interface AuthCallbackProps {
  onSuccess: () => void;
}

export default function AuthCallback({ onSuccess }: AuthCallbackProps) {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    handleCallback();
  }, []);

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

      const { data: existingEmployee, error: checkError } = await supabase
        .from('employees')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (!existingEmployee) {
        const nameParts = user.name.split(' ');
        const firstName = nameParts[0] || user.name;
        const lastName = nameParts.slice(1).join(' ') || '';

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

          if (companyError) throw companyError;
          company = newCompany;
        }

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

        if (employeeError) throw employeeError;
      }

      setStatus('success');

      setTimeout(() => {
        window.history.replaceState({}, '', '/');
        onSuccess();
      }, 1500);

    } catch (err: any) {
      console.error('Auth callback error:', err);
      setError(err.message || 'Authentication failed');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl mb-4">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">HCM Pro</h1>
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
