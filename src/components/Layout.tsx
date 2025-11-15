import { ReactNode, useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard, Users, Building2, Calendar, TrendingUp,
  FileText, DollarSign, Settings, LogOut, Menu, X, ChevronDown,
  Briefcase, Award, BookOpen, FolderTree, User
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Tablero', icon: LayoutDashboard, path: '/' },
  {
    name: 'Organización',
    icon: Building2,
    path: '/organization',
    children: [
      { name: 'Empresas', path: '/organization/companies' },
      { name: 'Unidades de Negocio', path: '/organization/units' },
      { name: 'Puestos', path: '/organization/positions' },
      { name: 'Organigrama', path: '/organization/chart' },
    ]
  },
  {
    name: 'Empleados',
    icon: Users,
    path: '/employees',
    children: [
      { name: 'Todos los Empleados', path: '/employees' },
      { name: 'Agregar Empleado', path: '/employees/new' },
      { name: 'Reportes', path: '/employees/reports' },
    ]
  },
  {
    name: 'Tiempo y Asistencia',
    icon: Calendar,
    path: '/time',
    children: [
      { name: 'Solicitudes de Ausencia', path: '/time/requests' },
      { name: 'Saldos de Ausencia', path: '/time/balances' },
      { name: 'Tipos de Ausencia', path: '/time/types' },
      { name: 'Calendario del Equipo', path: '/time/calendar' },
    ]
  },
  {
    name: 'Desempeño',
    icon: TrendingUp,
    path: '/performance',
    children: [
      { name: 'Evaluaciones', path: '/performance/evaluations' },
      { name: 'Ciclos de Evaluación', path: '/performance/cycles' },
      { name: 'Planes de Desarrollo', path: '/performance/development' },
      { name: 'Matriz 9-Box', path: '/performance/matrix' },
    ]
  },
  {
    name: 'Nómina',
    icon: DollarSign,
    path: '/payroll',
    children: [
      { name: 'Períodos de Nómina', path: '/payroll/periods' },
      { name: 'Conceptos', path: '/payroll/concepts' },
      { name: 'Fórmulas', path: '/payroll/formulas' },
      { name: 'Reportes', path: '/payroll/reports' },
    ]
  },
  {
    name: 'Aprendizaje',
    icon: BookOpen,
    path: '/learning',
    children: [
      { name: 'Cursos', path: '/learning/courses' },
      { name: 'Certificaciones', path: '/learning/certifications' },
      { name: 'Matriz de Habilidades', path: '/learning/skills' },
    ]
  },
  {
    name: 'Documentación',
    icon: FileText,
    path: '/documents',
    children: [
      { name: 'Políticas', path: '/documents/policies' },
      { name: 'Procedimientos', path: '/documents/procedures' },
      { name: 'Formularios', path: '/documents/forms' },
    ]
  },
  {
    name: 'Configuración',
    icon: Settings,
    path: '/config',
    children: [
      { name: 'Datos Maestros', path: '/config/master-data' },
      { name: 'Flujos de Trabajo', path: '/config/workflows' },
      { name: 'Campos Personalizados', path: '/config/custom-fields' },
      { name: 'Parámetros del Sistema', path: '/config/parameters' },
    ]
  },
];

export default function Layout({ children }: LayoutProps) {
  const { user, employee, signOut } = useAuth();
  const { navigateTo } = useNavigation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedItems, setExpandedItems] = useState<string[]>(['Organización']);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigation = (path: string) => {
    navigateTo(path);
  };

  const toggleExpand = (name: string) => {
    setExpandedItems(prev =>
      prev.includes(name) ? prev.filter(item => item !== name) : [...prev, name]
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-slate-900">HCM Pro</span>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            {navigation.map((item) => (
              <div key={item.name} className="mb-1">
                {item.children ? (
                  <div>
                    <button
                      onClick={() => toggleExpand(item.name)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform ${expandedItems.includes(item.name) ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedItems.includes(item.name) && (
                      <div className="ml-8 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <button
                            key={child.path}
                            onClick={() => handleNavigation(child.path)}
                            className="w-full text-left block px-3 py-1.5 text-sm text-slate-600 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors"
                          >
                            {child.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => handleNavigation(item.path)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </button>
                )}
              </div>
            ))}
          </nav>

          <div className="p-3 border-t border-slate-200" ref={userMenuRef}>
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user?.name?.[0] || employee?.first_name?.[0]}{employee?.last_name?.[0]}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {user?.name || `${employee?.first_name} ${employee?.last_name}`}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{employee?.email || user?.email}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-slate-200 py-1">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>Mi Perfil</span>
                  </button>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Configuración</span>
                  </button>
                  <div className="border-t border-slate-200 my-1"></div>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      signOut();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      <div className={`transition-all duration-200 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </header>

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
