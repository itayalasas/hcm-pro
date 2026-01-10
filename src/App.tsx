import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NavigationProvider, useNavigation } from './contexts/NavigationContext';
import { CompanyProvider, useCompany } from './contexts/CompanyContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import EmployeeList from './components/employees/EmployeeList';
import EmployeeReports from './components/employees/EmployeeReports';
import TimeAndAttendance from './components/attendance/TimeAndAttendance';
import Evaluations from './components/performance/Evaluations';
import EvaluationCycles from './components/performance/EvaluationCycles';
import DevelopmentPlans from './components/performance/DevelopmentPlans';
import NineBoxMatrix from './components/performance/NineBoxMatrix';
import PayrollPeriods from './components/payroll/PayrollPeriods';
import PayrollConcepts from './components/payroll/PayrollConcepts';
import PayrollFormulas from './components/payroll/PayrollFormulas';
import PayrollReports from './components/payroll/PayrollReports';
import Companies from './components/organization/Companies';
import BusinessUnits from './components/organization/BusinessUnits';
import Positions from './components/organization/Positions';
import Organigram from './components/organization/Organigram';
import ContractTemplates from './components/organization/ContractTemplates';
import ConfigurationMain from './components/settings/ConfigurationMain';
import Courses from './components/learning/Courses';
import Certifications from './components/learning/Certifications';
import SkillsMatrix from './components/learning/SkillsMatrix';
import Policies from './components/documents/Policies';
import Procedures from './components/documents/Procedures';
import Forms from './components/documents/Forms';
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
  const { user, loading, isAuthenticated, refreshAuth, isEmployee, employeeCompanyId, signOut } = useAuth();
  const { currentView } = useNavigation();
  const { selectedCompanyId, selectCompany, loading: companyLoading, autoLoadEmployeeCompany } = useCompany();
  const [isCallback, setIsCallback] = useState(false);
  const [employeeCompanyLoaded, setEmployeeCompanyLoaded] = useState(false);

  useEffect(() => {
    const url = window.location.href;
    if (url.includes('code=') && url.includes('callback')) {
      setIsCallback(true);
    }
  }, []);

  useEffect(() => {
    if (isEmployee && employeeCompanyId && !employeeCompanyLoaded && !companyLoading) {
      autoLoadEmployeeCompany(employeeCompanyId);
      setEmployeeCompanyLoaded(true);
    }
  }, [isEmployee, employeeCompanyId, employeeCompanyLoaded, companyLoading, autoLoadEmployeeCompany]);

  useEffect(() => {
    if (isEmployee && !employeeCompanyId && !loading && isAuthenticated) {
      const timer = setTimeout(() => {
        refreshAuth();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isEmployee, employeeCompanyId, loading, isAuthenticated, refreshAuth]);

  const handleCallbackSuccess = async () => {
    setIsCallback(false);
    await new Promise(resolve => setTimeout(resolve, 500));
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

  if (isEmployee && !employeeCompanyId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Verificando Acceso</h2>
            <p className="text-slate-600 mb-6">
              Estamos cargando tu información de empresa. Por favor espera...
            </p>
            <div className="space-y-3">
              <button
                onClick={() => refreshAuth()}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Intentar de nuevo
              </button>
              <button
                onClick={signOut}
                className="w-full py-2 px-4 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedCompanyId && !isEmployee) {
    return <CompanySelector onCompanySelected={selectCompany} />;
  }

  if (!selectedCompanyId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 animate-pulse">
            <LogoIcon size={64} />
          </div>
          <p className="text-slate-700 font-medium">Cargando información de la empresa...</p>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case '/':
      case 'dashboard':
        return isEmployee ? <EmployeeDashboard /> : <Dashboard />;
      case '/employees':
      case '/employees/new':
        return <EmployeeList />;
      case '/employees/reports':
        return <EmployeeReports />;
      case '/time/requests':
      case '/time/balances':
      case '/time/types':
      case '/time/calendar':
        return <TimeAndAttendance />;
      case '/performance/evaluations':
        return <Evaluations />;
      case '/performance/cycles':
        return <EvaluationCycles />;
      case '/performance/development':
        return <DevelopmentPlans />;
      case '/performance/matrix':
        return <NineBoxMatrix />;
      case '/payroll/periods':
        return <PayrollPeriods />;
      case '/payroll/concepts':
        return <PayrollConcepts />;
      case '/payroll/formulas':
        return <PayrollFormulas />;
      case '/payroll/reports':
        return <PayrollReports />;
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
      case '/learning/courses':
        return <Courses />;
      case '/learning/certifications':
        return <Certifications />;
      case '/learning/skills':
        return <SkillsMatrix />;
      case '/documents/policies':
        return <Policies />;
      case '/documents/procedures':
        return <Procedures />;
      case '/documents/forms':
        return <Forms />;
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
