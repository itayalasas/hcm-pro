import { useEffect, useState } from 'react';
import { Calendar, Clock, FileText, TrendingUp, CheckCircle, XCircle, AlertCircle, Briefcase, Award, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  iconBg: string;
  iconColor: string;
}

function StatCard({ title, value, subtitle, icon: Icon, iconBg, iconColor }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mb-2">{value}</p>
          {subtitle && (
            <p className="text-sm text-slate-500">{subtitle}</p>
          )}
        </div>
        <div className={`${iconBg} p-3 rounded-xl`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

interface LeaveRequest {
  id: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  status: string;
  leave_type: {
    name: string;
  };
}

export default function EmployeeDashboard() {
  const { user, employee } = useAuth();
  const { selectedCompanyId } = useCompany();
  const [stats, setStats] = useState({
    vacationDays: 0,
    usedVacationDays: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    totalRequests: 0,
  });
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedCompanyId && (employee || user)) {
      loadEmployeeData();
    }
  }, [selectedCompanyId, employee, user]);

  const loadEmployeeData = async () => {
    if (!selectedCompanyId) return;

    try {
      setLoading(true);

      let employeeId = employee?.id;

      if (!employeeId && user?.email) {
        const { data: employeeData } = await supabase
          .from('employees')
          .select('id')
          .eq('email', user.email)
          .eq('company_id', selectedCompanyId)
          .maybeSingle();

        if (employeeData) {
          employeeId = employeeData.id;
        }
      }

      if (employeeId) {
        const [balanceResult, requestsResult] = await Promise.all([
          supabase
            .from('leave_balances')
            .select('*')
            .eq('employee_id', employeeId)
            .eq('company_id', selectedCompanyId)
            .maybeSingle(),
          supabase
            .from('leave_requests')
            .select(`
              id,
              start_date,
              end_date,
              days_requested,
              status,
              leave_type:leave_types(name)
            `)
            .eq('employee_id', employeeId)
            .eq('company_id', selectedCompanyId)
            .order('created_at', { ascending: false })
            .limit(10)
        ]);

        const balance = balanceResult.data;
        const requests = requestsResult.data || [];

        const pending = requests.filter(r => r.status === 'pending').length;
        const approved = requests.filter(r => r.status === 'approved').length;
        const rejected = requests.filter(r => r.status === 'rejected').length;

        setStats({
          vacationDays: balance?.available_days || 0,
          usedVacationDays: balance?.used_days || 0,
          pendingRequests: pending,
          approvedRequests: approved,
          rejectedRequests: rejected,
          totalRequests: requests.length,
        });

        setLeaveRequests(requests as LeaveRequest[]);
      }
    } catch (error) {
      console.error('Error loading employee data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprobada';
      case 'rejected':
        return 'Rechazada';
      case 'pending':
        return 'Pendiente';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Mi Panel</h1>
        <p className="text-slate-600">
          Bienvenido, {user?.name}. Aquí está tu información personal.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Días de Vacaciones Disponibles"
          value={stats.vacationDays}
          subtitle={`${stats.usedVacationDays} días utilizados`}
          icon={Calendar}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Solicitudes Pendientes"
          value={stats.pendingRequests}
          subtitle="Esperando aprobación"
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Solicitudes Aprobadas"
          value={stats.approvedRequests}
          subtitle="Este año"
          icon={CheckCircle}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <StatCard
          title="Total de Solicitudes"
          value={stats.totalRequests}
          subtitle={`${stats.rejectedRequests} rechazadas`}
          icon={FileText}
          iconBg="bg-slate-50"
          iconColor="text-slate-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Mis Solicitudes Recientes</h2>
          {leaveRequests.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No tienes solicitudes de ausencia</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaveRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-slate-900">
                        {request.leave_type?.name || 'Ausencia'}
                      </h3>
                      <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        {getStatusText(request.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span>
                        {formatDate(request.start_date)} - {formatDate(request.end_date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {request.days_requested} {request.days_requested === 1 ? 'día' : 'días'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Acciones Rápidas</h2>
          <div className="space-y-3">
            <button className="w-full p-4 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group">
              <Calendar className="w-6 h-6 text-slate-400 group-hover:text-blue-600 mb-2" />
              <h3 className="font-medium text-slate-900 mb-1">Solicitar Ausencia</h3>
              <p className="text-xs text-slate-500">Vacaciones, permisos médicos</p>
            </button>
            <button className="w-full p-4 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group">
              <FileText className="w-6 h-6 text-slate-400 group-hover:text-blue-600 mb-2" />
              <h3 className="font-medium text-slate-900 mb-1">Ver Recibos de Pago</h3>
              <p className="text-xs text-slate-500">Historial de nómina</p>
            </button>
            <button className="w-full p-4 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group">
              <BookOpen className="w-6 h-6 text-slate-400 group-hover:text-blue-600 mb-2" />
              <h3 className="font-medium text-slate-900 mb-1">Mis Cursos</h3>
              <p className="text-xs text-slate-500">Capacitación y desarrollo</p>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Mi Información</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Posición</p>
                  <p className="text-xs text-slate-500">{employee?.position || 'No especificada'}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Fecha de Ingreso</p>
                  <p className="text-xs text-slate-500">
                    {employee?.hire_date ? formatDate(employee.hire_date) : 'No especificada'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Estado</p>
                  <p className="text-xs text-slate-500 capitalize">{employee?.status || 'Activo'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Balance de Ausencias</h2>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-blue-900">Vacaciones</p>
                <p className="text-2xl font-bold text-blue-900">{stats.vacationDays}</p>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (stats.vacationDays / (stats.vacationDays + stats.usedVacationDays)) * 100)}%`
                  }}
                ></div>
              </div>
              <p className="text-xs text-blue-700 mt-2">
                {stats.usedVacationDays} días utilizados de {stats.vacationDays + stats.usedVacationDays} totales
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-sm font-medium text-slate-600 mb-2">Resumen de Solicitudes</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-2xl font-bold text-amber-600">{stats.pendingRequests}</p>
                  <p className="text-xs text-slate-500">Pendientes</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.approvedRequests}</p>
                  <p className="text-xs text-slate-500">Aprobadas</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{stats.rejectedRequests}</p>
                  <p className="text-xs text-slate-500">Rechazadas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
