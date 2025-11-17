import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NavigationProvider, useNavigation } from './contexts/NavigationContext';
import { CompanyProvider, useCompany } from './contexts/CompanyContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import EmployeeList from './components/employees/EmployeeList';
import EmployeeReports from './components/employees/EmployeeReports';
import LeaveRequests from './components/leave/LeaveRequests';
import Evaluations from './components/performance/Evaluations';
import PayrollPeriods from './components/payroll/PayrollPeriods';
import Companies from './components/organization/Companies';
import BusinessUnits from './components/organization/BusinessUnits';
import Positions from './components/organization/Positions';
import Organigram from './components/organization/Organigram';
import ContractTemplates from './components/organization/ContractTemplates';
import ConfigurationMain from './components/settings/ConfigurationMain';
import AuthCallback from './components/AuthCallback';
import CompanySelector from './components/CompanySelector';
import { ExternalLink } from 'lucide-react';
import { getAuthLoginUrl } from './lib/externalAuth';
import Logo, { LogoIcon } from './components/ui/Logo';
//prueba
function LoginPage() {
  const handleExternalLogin = () => {
    const loginUrl = getAuthLoginUrl();
    window.location.href = loginUrl;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 flex justify-center">
          <Logo size="xl" showText={true} />
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 backdrop-blur-sm bg-opacity-95">
          <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">
            Bienvenido
          </h2>

          <p className="text-slate-600 text-center mb-8">
            Gestiona el capital humano de tu empresa de manera eficiente
          </p>

          <button
            onClick={handleExternalLogin}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            <ExternalLink className="w-5 h-5" />
            Iniciar sesión con cuenta corporativa
          </button>

          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
            <p className="text-xs text-slate-700 text-center font-medium">
              Sistema seguro de autenticación empresarial
            </p>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-slate-600">
          <p>© 2025 EmplySys. Todos los derechos reservados.</p>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 animate-pulse">
            <LogoIcon size={64} />
          </div>
          <p className="text-slate-700 font-medium">Cargando...</p>
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
      case '/employees/new':
        return <EmployeeList />;
      case '/employees/reports':
        return <EmployeeReports />;
      case '/time/requests':
        return <LeaveRequests />;
      case '/performance/evaluations':
        return <Evaluations />;
      case '/payroll/periods':
        return <PayrollPeriods />;
      case '/organization/companies':
        return <Companies />;
      case '/organization/units':
        return <BusinessUnits />;
      case '/organization/positions':
        return <Positions />;
      case '/organization/chart':
        return <Organigram />;
      case '/organization/contract-templates':
        return <ContractTemplates />;
      case '/config/master-data':
      case '/config/workflows':
      case '/config/custom-fields':
      case '/config/parameters':
        return <ConfigurationMain />;
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
