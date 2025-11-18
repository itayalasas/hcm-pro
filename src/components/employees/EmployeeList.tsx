import { useEffect, useState } from 'react';
import { Search, Filter, Download, Plus, Mail, Phone, MapPin, Briefcase, Eye } from 'lucide-react';
import { supabase, Employee } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useNavigation } from '../../contexts/NavigationContext';
import AddEmployeeWizard from './AddEmployeeWizard';
import EmployeeProfile from './EmployeeProfile';

export default function EmployeeList() {
  const { selectedCompanyId } = useCompany();
  const { currentView, navigate } = useNavigation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddWizard, setShowAddWizard] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedCompanyId) {
      loadEmployees();
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    if (currentView === '/employees/new') {
      setShowAddWizard(true);
    }
  }, [currentView]);

  const loadEmployees = async () => {
    try {
      if (!selectedCompanyId) {
        setEmployees([]);
        return;
      }

      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          position:positions(id, title, code),
          department:departments(id, name, code)
        `)
        .eq('company_id', selectedCompanyId)
        .order('last_name', { ascending: true });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = `${emp.first_name} ${emp.last_name} ${emp.email} ${emp.employee_number}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'inactive': return 'bg-slate-100 text-slate-700';
      case 'terminated': return 'bg-red-100 text-red-700';
      case 'suspended': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };


  if (selectedEmployeeId) {
    return (
      <EmployeeProfile
        employeeId={selectedEmployeeId}
        onBack={() => setSelectedEmployeeId(null)}
      />
    );
  }

  if (!selectedCompanyId) {
    return (
      <div className="text-center py-12">
        <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-500">Seleccione una empresa para ver los empleados</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Empleados</h1>
          <p className="text-slate-600">{filteredEmployees.length} empleados en total</p>
        </div>
        <button
          onClick={() => setShowAddWizard(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Agregar Empleado
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 mb-6">
        <div className="p-4 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar empleados..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los Estados</option>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="terminated">Terminado</option>
              <option value="suspended">Suspendido</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
              <Filter className="w-5 h-5" />
              Filtros
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
              <Download className="w-5 h-5" />
              Exportar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="w-1/5 px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Empleado
                </th>
                <th className="w-32 px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="w-1/5 px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="w-1/5 px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Puesto
                </th>
                <th className="w-32 px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Contratación
                </th>
                <th className="w-24 px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="w-28 px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center min-w-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                        {employee.first_name[0]}{employee.last_name[0]}
                      </div>
                      <div className="ml-3 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {employee.first_name} {employee.last_name}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{employee.work_location || 'No especificado'}</span>
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-xs text-slate-900 font-mono block truncate">{employee.employee_number}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm min-w-0">
                      <p className="text-slate-900 flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{employee.email}</span>
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm min-w-0">
                      <p className="text-slate-900 flex items-center gap-1 truncate">
                        <Briefcase className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{employee.position?.title || 'Sin puesto'}</span>
                      </p>
                      <p className="text-slate-500 text-xs truncate">{employee.department?.name || 'Sin departamento'}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-900">
                    {new Date(employee.hire_date).toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(employee.status)}`}>
                      {employee.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm font-medium">
                    <button
                      onClick={() => setSelectedEmployeeId(employee.id)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-900 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No se encontraron empleados</p>
          </div>
        )}
      </div>

      <AddEmployeeWizard
        isOpen={showAddWizard}
        onClose={() => {
          setShowAddWizard(false);
          navigate('/employees');
        }}
        onSuccess={() => {
          setShowAddWizard(false);
          navigate('/employees');
          loadEmployees();
        }}
      />
    </div>
  );
}
