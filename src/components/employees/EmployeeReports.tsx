import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, UserCheck, UserX, Download, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import Button from '../ui/Button';

interface EmployeeStats {
  total: number;
  active: number;
  inactive: number;
  newThisMonth: number;
  byDepartment: Array<{ department: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
}

export default function EmployeeReports() {
  const { selectedCompanyId } = useCompany();
  const [stats, setStats] = useState<EmployeeStats>({
    total: 0,
    active: 0,
    inactive: 0,
    newThisMonth: 0,
    byDepartment: [],
    byStatus: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    if (selectedCompanyId) {
      loadStats();
    }
  }, [selectedCompanyId, selectedPeriod]);

  const loadStats = async () => {
    try {
      if (!selectedCompanyId) return;

      const { data: employees, error } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', selectedCompanyId);

      if (error) throw error;

      const total = employees?.length || 0;
      const active = employees?.filter(e => e.status === 'active').length || 0;
      const inactive = employees?.filter(e => e.status !== 'active').length || 0;

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const newThisMonth = employees?.filter(e => {
        const hireDate = new Date(e.hire_date);
        return hireDate.getMonth() === currentMonth && hireDate.getFullYear() === currentYear;
      }).length || 0;

      const statusCounts = employees?.reduce((acc: any, emp) => {
        acc[emp.status] = (acc[emp.status] || 0) + 1;
        return acc;
      }, {}) || {};

      const byStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count: count as number
      }));

      setStats({
        total,
        active,
        inactive,
        newThisMonth,
        byDepartment: [],
        byStatus
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    console.log('Exportando reporte...');
  };

  if (!selectedCompanyId) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-500">Seleccione una empresa para ver los reportes</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Reportes de Empleados</h1>
          <p className="text-slate-600">Análisis y estadísticas del personal</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
            <option value="quarter">Este trimestre</option>
            <option value="year">Este año</option>
          </select>
          <Button onClick={exportReport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">Total</span>
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-1">{stats.total}</p>
          <p className="text-sm text-slate-500">Empleados totales</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">Activos</span>
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-1">{stats.active}</p>
          <p className="text-sm text-slate-500">
            {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% del total
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-slate-100 rounded-lg">
              <UserX className="w-6 h-6 text-slate-600" />
            </div>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">Inactivos</span>
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-1">{stats.inactive}</p>
          <p className="text-sm text-slate-500">
            {stats.total > 0 ? Math.round((stats.inactive / stats.total) * 100) : 0}% del total
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">Nuevos</span>
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-1">{stats.newThisMonth}</p>
          <p className="text-sm text-slate-500">Contratados este mes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Empleados por Estado
          </h3>
          <div className="space-y-3">
            {stats.byStatus.length > 0 ? (
              stats.byStatus.map((item) => {
                const percentage = stats.total > 0 ? (item.count / stats.total) * 100 : 0;
                const statusLabels: Record<string, string> = {
                  active: 'Activo',
                  inactive: 'Inactivo',
                  terminated: 'Terminado',
                  suspended: 'Suspendido'
                };
                const statusColors: Record<string, string> = {
                  active: 'bg-green-500',
                  inactive: 'bg-slate-500',
                  terminated: 'bg-red-500',
                  suspended: 'bg-amber-500'
                };

                return (
                  <div key={item.status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700">
                        {statusLabels[item.status] || item.status}
                      </span>
                      <span className="text-sm text-slate-600">{item.count} ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${statusColors[item.status] || 'bg-blue-500'}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-500 text-center py-4">No hay datos disponibles</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Tendencias de Contratación
          </h3>
          <div className="text-center py-8">
            <p className="text-slate-500">Gráfico de tendencias próximamente</p>
            <p className="text-xs text-slate-400 mt-2">
              Aquí se mostrarán las tendencias de contratación por mes
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Resumen Ejecutivo</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-slate-500 mb-1">Tasa de Retención</p>
            <p className="text-2xl font-bold text-slate-900">
              {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Crecimiento del Personal</p>
            <p className="text-2xl font-bold text-slate-900">
              +{stats.newThisMonth} este mes
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Promedio de Antigüedad</p>
            <p className="text-2xl font-bold text-slate-900">N/A</p>
          </div>
        </div>
      </div>
    </div>
  );
}
