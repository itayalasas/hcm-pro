import { useEffect, useState } from 'react';
import { Users, TrendingUp, Calendar, DollarSign, UserPlus, UserMinus, Clock, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: any;
  iconBg: string;
  iconColor: string;
}

function StatCard({ title, value, change, changeType, icon: Icon, iconBg, iconColor }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mb-2">{value}</p>
          {change && (
            <p className={`text-sm font-medium ${changeType === 'positive' ? 'text-green-600' : changeType === 'negative' ? 'text-red-600' : 'text-slate-500'}`}>
              {change}
            </p>
          )}
        </div>
        <div className={`${iconBg} p-3 rounded-xl`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    pendingLeaves: 0,
    avgSalary: 0,
    newHires: 0,
    terminations: 0,
    pendingEvaluations: 0,
    completedTraining: 0,
  });

  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: employees } = await supabase
        .from('employees')
        .select('*');

      const { data: leaveRequests } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('status', 'pending');

      const activeEmployees = employees?.filter(e => e.status === 'active') || [];
      const thisMonth = new Date();
      thisMonth.setDate(1);

      const newHires = employees?.filter(e =>
        new Date(e.hire_date) >= thisMonth
      ) || [];

      setStats({
        totalEmployees: employees?.length || 0,
        activeEmployees: activeEmployees.length,
        pendingLeaves: leaveRequests?.length || 0,
        avgSalary: 0,
        newHires: newHires.length,
        terminations: 0,
        pendingEvaluations: 0,
        completedTraining: 0,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Tablero</h1>
        <p className="text-slate-600">¡Bienvenido! Esto es lo que está sucediendo con tu organización.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Empleados"
          value={stats.totalEmployees}
          change={`${stats.activeEmployees} activos`}
          changeType="neutral"
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Solicitudes de Ausencia Pendientes"
          value={stats.pendingLeaves}
          change="Requiere atención"
          changeType="neutral"
          icon={Calendar}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Nuevas Contrataciones (Este Mes)"
          value={stats.newHires}
          change="+12% vs mes anterior"
          changeType="positive"
          icon={UserPlus}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <StatCard
          title="Evaluaciones Pendientes"
          value={stats.pendingEvaluations}
          change="2 ciclos activos"
          changeType="neutral"
          icon={Award}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group">
              <UserPlus className="w-8 h-8 text-slate-400 group-hover:text-blue-600 mb-2" />
              <h3 className="font-medium text-slate-900 mb-1">Agregar Empleado</h3>
              <p className="text-sm text-slate-500">Incorporar un nuevo miembro al equipo</p>
            </button>
            <button className="p-4 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group">
              <Calendar className="w-8 h-8 text-slate-400 group-hover:text-blue-600 mb-2" />
              <h3 className="font-medium text-slate-900 mb-1">Aprobar Ausencias</h3>
              <p className="text-sm text-slate-500">{stats.pendingLeaves} solicitudes pendientes</p>
            </button>
            <button className="p-4 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group">
              <DollarSign className="w-8 h-8 text-slate-400 group-hover:text-blue-600 mb-2" />
              <h3 className="font-medium text-slate-900 mb-1">Procesar Nómina</h3>
              <p className="text-sm text-slate-500">Ejecutar nómina mensual</p>
            </button>
            <button className="p-4 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group">
              <TrendingUp className="w-8 h-8 text-slate-400 group-hover:text-blue-600 mb-2" />
              <h3 className="font-medium text-slate-900 mb-1">Evaluaciones</h3>
              <p className="text-sm text-slate-500">Gestionar revisiones de desempeño</p>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Resumen de la Empresa</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Plantilla</p>
                  <p className="text-xs text-slate-500">Empleados activos</p>
                </div>
              </div>
              <p className="text-lg font-bold text-slate-900">{stats.activeEmployees}</p>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Retención</p>
                  <p className="text-xs text-slate-500">Últimos 12 meses</p>
                </div>
              </div>
              <p className="text-lg font-bold text-slate-900">94%</p>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Permanencia Promedio</p>
                  <p className="text-xs text-slate-500">Promedio de la empresa</p>
                </div>
              </div>
              <p className="text-lg font-bold text-slate-900">3.2 años</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Actividad Reciente</h2>
          <div className="space-y-3">
            {[
              { type: 'leave', text: 'Juan Pérez solicitó 5 días de vacaciones', time: 'Hace 2 horas', color: 'blue' },
              { type: 'hire', text: 'Nuevo empleado María García agregada', time: 'Hace 5 horas', color: 'green' },
              { type: 'eval', text: 'Revisiones de desempeño Q4 iniciadas', time: 'Hace 1 día', color: 'purple' },
              { type: 'doc', text: 'Manual del empleado actualizado publicado', time: 'Hace 2 días', color: 'amber' },
            ].map((activity, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                <div className={`w-2 h-2 rounded-full mt-2 bg-${activity.color}-500`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{activity.text}</p>
                  <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Próximos Eventos</h2>
          <div className="space-y-3">
            {[
              { date: 'Nov 20', title: 'Fecha límite de procesamiento de nómina', type: 'fecha límite' },
              { date: 'Nov 22', title: 'Reunión general de la empresa', type: 'reunión' },
              { date: 'Nov 25', title: 'Fin del ciclo de revisión de desempeño', type: 'fecha límite' },
              { date: 'Nov 30', title: 'Vencimiento de informes mensuales de RH', type: 'informe' },
            ].map((event, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200">
                <div className="text-center">
                  <div className="text-xs font-medium text-slate-500 uppercase">{event.date.split(' ')[0]}</div>
                  <div className="text-xl font-bold text-slate-900">{event.date.split(' ')[1]}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{event.title}</p>
                  <p className="text-xs text-slate-500 capitalize">{event.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
