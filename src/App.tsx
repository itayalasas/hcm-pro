import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NavigationProvider, useNavigation } from './contexts/NavigationContext';
import { CompanyProvider, useCompany } from './contexts/CompanyContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import EmployeeList from './components/employees/EmployeeList';
import LeaveRequests from './components/leave/LeaveRequests';
import Evaluations from './components/performance/Evaluations';
import PayrollPeriods from './components/payroll/PayrollPeriods';
import Companies from './components/organization/Companies';
import ConfigurationPanel from './components/settings/ConfigurationPanel';
import AuthCallback from './components/AuthCallback';
import CompanySelector from './components/CompanySelector';
import { Briefcase, ExternalLink } from 'lucide-react';
import { getAuthLoginUrl } from './lib/externalAuth';

function LoginPage() {
  const handleExternalLogin = () => {
    const loginUrl = getAuthLoginUrl();
    window.location.href = loginUrl;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl mb-4">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">HCM Pro</h1>
          <p className="text-slate-600">Enterprise Human Capital Management</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">
            Iniciar Sesión
          </h2>

          <p className="text-slate-600 text-center mb-6">
            Utiliza tu cuenta corporativa para acceder al sistema
          </p>

          <button
            onClick={handleExternalLogin}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-5 h-5" />
            Iniciar sesión con cuenta corporativa
          </button>

          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-600 text-center">
              Serás redirigido a nuestro sistema de autenticación seguro
            </p>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-slate-600">
          <p>© 2025 HCM Pro. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, loading, isAuthenticated, refreshAuth } = useAuth();
  const { currentView } = useNavigation();
  const { selectedCompanyId, selectCompany, loading: companyLoading } = useCompany();
  const [isCallback, setIsCallback] = useState(false);

  useEffect(() => {
    const url = window.location.href;
    if (url.includes('code=') && url.includes('callback')) {
      setIsCallback(true);
    }
  }, []);

  const handleCallbackSuccess = () => {
    setIsCallback(false);
    refreshAuth();
  };

  if (loading || companyLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl mb-4 animate-pulse">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (isCallback) {
    return <AuthCallback onSuccess={handleCallbackSuccess} />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (!selectedCompanyId) {
    return <CompanySelector onCompanySelected={selectCompany} />;
  }

  const renderView = () => {
    switch (currentView) {
      case '/':
      case 'dashboard':
        return <Dashboard />;
      case '/employees':
        return <EmployeeList />;
      case '/time/requests':
        return <LeaveRequests />;
      case '/performance/evaluations':
        return <Evaluations />;
      case '/payroll/periods':
        return <PayrollPeriods />;
      case '/organization/companies':
        return <Companies />;
      case '/configuration':
        return <ConfigurationPanel />;
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Sección en Desarrollo</h2>
            <p className="text-slate-600">Esta funcionalidad estará disponible pronto.</p>
            <p className="text-sm text-slate-400 mt-2">Vista: {currentView}</p>
          </div>
        );
    }
  };

  return (
    <Layout>
      {renderView()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <CompanyProvider>
        <NavigationProvider>
          <AppContent />
        </NavigationProvider>
      </CompanyProvider>
    </AuthProvider>
  );
}

export default App;
