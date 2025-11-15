import { ReactNode, useState } from 'react';
import {
  LayoutDashboard, Users, Building2, Calendar, TrendingUp,
  FileText, DollarSign, Settings, LogOut, Menu, X, ChevronDown,
  Briefcase, Award, BookOpen, FolderTree
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  {
    name: 'Organization',
    icon: Building2,
    path: '/organization',
    children: [
      { name: 'Companies', path: '/organization/companies' },
      { name: 'Business Units', path: '/organization/units' },
      { name: 'Positions', path: '/organization/positions' },
      { name: 'Org Chart', path: '/organization/chart' },
    ]
  },
  {
    name: 'Employees',
    icon: Users,
    path: '/employees',
    children: [
      { name: 'All Employees', path: '/employees' },
      { name: 'Add Employee', path: '/employees/new' },
      { name: 'Reports', path: '/employees/reports' },
    ]
  },
  {
    name: 'Time & Attendance',
    icon: Calendar,
    path: '/time',
    children: [
      { name: 'Leave Requests', path: '/time/requests' },
      { name: 'Leave Balances', path: '/time/balances' },
      { name: 'Leave Types', path: '/time/types' },
      { name: 'Team Calendar', path: '/time/calendar' },
    ]
  },
  {
    name: 'Performance',
    icon: TrendingUp,
    path: '/performance',
    children: [
      { name: 'Evaluations', path: '/performance/evaluations' },
      { name: 'Evaluation Cycles', path: '/performance/cycles' },
      { name: 'Development Plans', path: '/performance/development' },
      { name: '9-Box Matrix', path: '/performance/matrix' },
    ]
  },
  {
    name: 'Payroll',
    icon: DollarSign,
    path: '/payroll',
    children: [
      { name: 'Payroll Periods', path: '/payroll/periods' },
      { name: 'Concepts', path: '/payroll/concepts' },
      { name: 'Formulas', path: '/payroll/formulas' },
      { name: 'Reports', path: '/payroll/reports' },
    ]
  },
  {
    name: 'Learning',
    icon: BookOpen,
    path: '/learning',
    children: [
      { name: 'Courses', path: '/learning/courses' },
      { name: 'Certifications', path: '/learning/certifications' },
      { name: 'Skills Matrix', path: '/learning/skills' },
    ]
  },
  {
    name: 'Documentation',
    icon: FileText,
    path: '/documents',
    children: [
      { name: 'Policies', path: '/documents/policies' },
      { name: 'Procedures', path: '/documents/procedures' },
      { name: 'Forms', path: '/documents/forms' },
    ]
  },
  {
    name: 'Configuration',
    icon: Settings,
    path: '/config',
    children: [
      { name: 'Master Data', path: '/config/master-data' },
      { name: 'Workflows', path: '/config/workflows' },
      { name: 'Custom Fields', path: '/config/custom-fields' },
      { name: 'System Parameters', path: '/config/parameters' },
    ]
  },
];

export default function Layout({ children }: LayoutProps) {
  const { employee, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedItems, setExpandedItems] = useState<string[]>(['Organization']);

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
                          <a
                            key={child.path}
                            href={child.path}
                            className="block px-3 py-1.5 text-sm text-slate-600 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors"
                          >
                            {child.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <a
                    href={item.path}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </a>
                )}
              </div>
            ))}
          </nav>

          <div className="p-3 border-t border-slate-200">
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {employee?.first_name?.[0]}{employee?.last_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {employee?.first_name} {employee?.last_name}
                </p>
                <p className="text-xs text-slate-500 truncate">{employee?.email}</p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
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
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
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
