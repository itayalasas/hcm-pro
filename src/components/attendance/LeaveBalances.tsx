import { useEffect, useState } from 'react';
import { Calendar, TrendingUp, TrendingDown, Clock, Plus, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useToast } from '../../hooks/useToast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface LeaveBalance {
  id: string;
  employee_id: string;
  leave_type_id: string;
  year: number;
  total_days: number;
  used_days: number;
  pending_days: number;
  available_days: number;
  employee?: {
    first_name: string;
    last_name: string;
    employee_number: string;
  };
  leave_type?: {
    name: string;
    code: string;
  };
}

interface LeaveType {
  id: string;
  code: string;
  name: string;
  max_days: number;
}

export default function LeaveBalances() {
  const { selectedCompanyId } = useCompany();
  const { showToast } = useToast();
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [formData, setFormData] = useState({
    employee_id: '',
    leave_type_id: '',
    year: selectedYear,
    total_days: ''
  });

  useEffect(() => {
    if (selectedCompanyId) {
      loadBalances();
      loadLeaveTypes();
      loadEmployees();
    }
  }, [selectedCompanyId, selectedYear]);

  const loadBalances = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leave_balances')
        .select(`
          *,
          employee:employees(first_name, last_name, employee_number),
          leave_type:leave_types(name, code)
        `)
        .eq('year', selectedYear)
        .order('employee(last_name)');

      if (error) throw error;
      setBalances(data || []);
    } catch (error) {
      console.error('Error loading balances:', error);
      showToast('Error al cargar saldos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadLeaveTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('leave_types')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setLeaveTypes(data || []);
    } catch (error) {
      console.error('Error loading leave types:', error);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, employee_number')
        .eq('company_id', selectedCompanyId)
        .eq('status', 'active')
        .order('first_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('leave_balances')
        .insert({
          employee_id: formData.employee_id,
          leave_type_id: formData.leave_type_id,
          year: formData.year,
          total_days: parseFloat(formData.total_days),
          used_days: 0,
          pending_days: 0
        });

      if (error) throw error;

      showToast('Saldo creado exitosamente', 'success');
      setShowModal(false);
      resetForm();
      loadBalances();
    } catch (error: any) {
      console.error('Error creating balance:', error);
      showToast(error.message || 'Error al crear saldo', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      leave_type_id: '',
      year: selectedYear,
      total_days: ''
    });
  };

  const getUtilizationPercentage = (used: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((used / total) * 100);
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-red-500';
    if (percentage >= 50) return 'bg-amber-500';
    return 'bg-green-500';
  };

  const employeeBalances = balances.reduce((acc, balance) => {
    const key = balance.employee_id;
    if (!acc[key]) {
      acc[key] = {
        employee: balance.employee,
        balances: []
      };
    }
    acc[key].balances.push(balance);
    return acc;
  }, {} as Record<string, { employee: any; balances: LeaveBalance[] }>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Saldos de Ausencia</h1>
          <p className="text-slate-600">Administra los días disponibles de cada empleado</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {[2023, 2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Asignar Saldo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Empleados</h3>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {Object.keys(employeeBalances).length}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Total Asignado</h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {balances.reduce((sum, b) => sum + b.total_days, 0)} días
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Total Usado</h3>
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {balances.reduce((sum, b) => sum + b.used_days, 0)} días
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Disponible</h3>
            <Calendar className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {balances.reduce((sum, b) => sum + b.available_days, 0)} días
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Saldos por Empleado</h2>
        </div>

        {Object.keys(employeeBalances).length > 0 ? (
          <div className="divide-y divide-slate-200">
            {Object.values(employeeBalances).map((item) => (
              <div key={item.employee.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {item.employee.first_name} {item.employee.last_name}
                    </h3>
                    <p className="text-sm text-slate-500">#{item.employee.employee_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      {item.balances.reduce((sum, b) => sum + b.available_days, 0)}
                    </p>
                    <p className="text-sm text-slate-500">días disponibles</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {item.balances.map((balance) => {
                    const utilizationPct = getUtilizationPercentage(balance.used_days, balance.total_days);
                    return (
                      <div
                        key={balance.id}
                        className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-slate-900">{balance.leave_type?.name}</p>
                            <p className="text-xs text-slate-500">{balance.leave_type?.code}</p>
                          </div>
                          <Clock className="w-5 h-5 text-slate-400" />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Total:</span>
                            <span className="font-semibold text-slate-900">{balance.total_days} días</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Usados:</span>
                            <span className="font-semibold text-red-600">{balance.used_days} días</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Pendientes:</span>
                            <span className="font-semibold text-amber-600">{balance.pending_days} días</span>
                          </div>
                          <div className="flex justify-between text-sm pt-2 border-t border-slate-300">
                            <span className="text-slate-600">Disponibles:</span>
                            <span className="font-bold text-green-600">{balance.available_days} días</span>
                          </div>

                          <div className="pt-2">
                            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                              <span>Utilización</span>
                              <span>{utilizationPct}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full transition-all ${getUtilizationColor(utilizationPct)}`}
                                style={{ width: `${Math.min(utilizationPct, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500 mb-4">No hay saldos asignados para {selectedYear}</p>
            <Button onClick={() => setShowModal(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Asignar Primer Saldo
            </Button>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title="Asignar Saldo de Ausencia"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Empleado
            </label>
            <select
              value={formData.employee_id}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">Seleccionar empleado</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} - #{emp.employee_number}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tipo de Ausencia
            </label>
            <select
              value={formData.leave_type_id}
              onChange={(e) => setFormData({ ...formData, leave_type_id: e.target.value })}
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">Seleccionar tipo</option>
              {leaveTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name} (Máx: {type.max_days} días)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Año"
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              required
              min="2020"
              max="2030"
            />
            <Input
              label="Total de Días"
              type="number"
              value={formData.total_days}
              onChange={(e) => setFormData({ ...formData, total_days: e.target.value })}
              required
              min="0"
              step="0.5"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setShowModal(false); resetForm(); }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Asignar Saldo
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
