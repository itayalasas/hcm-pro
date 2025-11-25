import { useEffect, useState } from 'react';
import { DollarSign, Calendar, CheckCircle, Clock, Download, Eye, Plus, Play, Check, X, AlertCircle, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useToast } from '../../hooks/useToast';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import StepWizard from '../ui/StepWizard';

interface PayrollPeriod {
  id: string;
  company_id: string;
  period_name: string;
  period_type: string;
  start_date: string;
  end_date: string;
  payment_date: string;
  status: string;
  total_gross: number;
  total_deductions: number;
  total_contributions: number;
  total_net: number;
  notes: string;
  created_at: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  position_title?: string;
  salary: number;
  national_id?: string;
}

export default function PayrollPeriods() {
  const { selectedCompanyId } = useCompany();
  const { showToast } = useToast();
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [processingPayroll, setProcessingPayroll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  const [formData, setFormData] = useState({
    period_name: '',
    period_type: 'monthly',
    start_date: '',
    end_date: '',
    payment_date: '',
    notes: ''
  });

  useEffect(() => {
    if (selectedCompanyId) {
      loadPayrollPeriods();
      loadEmployees();
    }
  }, [selectedCompanyId]);

  const loadPayrollPeriods = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payroll_periods')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setPeriods(data || []);
    } catch (error) {
      showToast('Error al cargar períodos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    if (!selectedCompanyId) return;

    try {
      setLoadingEmployees(true);
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id,
          first_name,
          last_name,
          salary,
          national_id,
          positions!employees_position_id_fkey(title)
        `)
        .eq('company_id', selectedCompanyId)
        .eq('status', 'active')
        .order('first_name', { ascending: true });

      const transformedData = data?.map(emp => ({
        ...emp,
        position_title: emp.positions?.title
      })) || [];

      setEmployees(transformedData as Employee[]);

      if (error) throw error;
    } catch (error) {
      console.error('Error loading employees:', error);
      showToast('Error al cargar empleados', 'error');
    } finally {
      setLoadingEmployees(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
    const docNumber = emp.national_id?.toLowerCase() || '';
    return fullName.includes(search) || docNumber.includes(search);
  });

  const generatePeriodName = () => {
    const start = new Date(formData.start_date);
    const monthName = start.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    return `Nómina ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`;
  };

  const calculateMonthDates = (month: number, year: number) => {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    const paymentDate = new Date(year, month + 1, 5);

    return {
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      payment_date: paymentDate.toISOString().split('T')[0]
    };
  };

  const handleQuickCreatePeriod = () => {
    const today = new Date();
    const dates = calculateMonthDates(today.getMonth(), today.getFullYear());

    setFormData({
      period_name: generatePeriodName(),
      period_type: 'monthly',
      ...dates,
      notes: ''
    });

    if (employees.length === 0) {
      loadEmployees();
    }

    setShowWizard(true);
  };

  const handleCreatePeriod = async () => {
    try {
      setProcessingPayroll(true);

      const periodName = formData.period_name || generatePeriodName();

      const { data: newPeriod, error: periodError } = await supabase
        .from('payroll_periods')
        .insert([{
          company_id: selectedCompanyId,
          period_name: periodName,
          period_type: formData.period_type,
          start_date: formData.start_date,
          end_date: formData.end_date,
          payment_date: formData.payment_date,
          status: 'draft',
          notes: formData.notes,
          total_gross: 0,
          total_deductions: 0,
          total_contributions: 0,
          total_net: 0
        }])
        .select()
        .single();

      if (periodError) throw periodError;

      const employeesToProcess = selectedEmployees.length > 0
        ? employees.filter(e => selectedEmployees.includes(e.id))
        : employees;

      if (employeesToProcess.length > 0) {
        const periodDetails = employeesToProcess.map(emp => ({
          payroll_period_id: newPeriod.id,
          employee_id: emp.id,
          base_salary: emp.salary || 0,
          total_perceptions: emp.salary || 0,
          total_deductions: 0,
          total_contributions: 0,
          net_salary: emp.salary || 0,
          worked_days: 30,
          worked_hours: 0
        }));

        const { error: detailsError } = await supabase
          .from('payroll_period_details')
          .insert(periodDetails);

        if (detailsError) throw detailsError;

        const totalGross = employeesToProcess.reduce((sum, e) => sum + (e.salary || 0), 0);

        await supabase
          .from('payroll_periods')
          .update({
            total_gross: totalGross,
            total_net: totalGross
          })
          .eq('id', newPeriod.id);
      }

      showToast('Período de nómina creado exitosamente', 'success');
      setShowWizard(false);
      resetForm();
      loadPayrollPeriods();
    } catch (error) {
      showToast('Error al crear período', 'error');
    } finally {
      setProcessingPayroll(false);
    }
  };

  const handleProcessPeriod = async (periodId: string) => {
    try {
      await supabase
        .from('payroll_periods')
        .update({ status: 'calculated' })
        .eq('id', periodId);

      showToast('Nómina procesada correctamente', 'success');
      loadPayrollPeriods();
    } catch (error) {
      showToast('Error al procesar nómina', 'error');
    }
  };

  const handleApprovePeriod = async (periodId: string) => {
    try {
      await supabase
        .from('payroll_periods')
        .update({ status: 'approved' })
        .eq('id', periodId);

      showToast('Nómina aprobada correctamente', 'success');
      loadPayrollPeriods();
    } catch (error) {
      showToast('Error al aprobar nómina', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      period_name: '',
      period_type: 'monthly',
      start_date: '',
      end_date: '',
      payment_date: '',
      notes: ''
    });
    setCurrentStep(0);
    setSelectedEmployees([]);
    setSearchTerm('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700 border-green-200';
      case 'approved': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'validated': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'calculated': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'draft': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'approved': return <Check className="w-5 h-5 text-blue-600" />;
      case 'calculated': return <Clock className="w-5 h-5 text-amber-600" />;
      case 'draft': return <AlertCircle className="w-5 h-5 text-slate-600" />;
      default: return <Clock className="w-5 h-5 text-slate-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const wizardSteps = [
    {
      title: 'Información del Período',
      description: 'Configura las fechas y tipo de período'
    },
    {
      title: 'Selección de Empleados',
      description: 'Elige los empleados a incluir'
    },
    {
      title: 'Revisión y Confirmación',
      description: 'Verifica los datos antes de crear'
    }
  ];

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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Períodos de Nómina</h1>
          <p className="text-slate-600">Administra y procesa la nómina de tu empresa</p>
        </div>
        <Button onClick={handleQuickCreatePeriod}>
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Período
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Total Períodos</h3>
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{periods.length}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Pendientes</h3>
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {periods.filter(p => p.status === 'draft' || p.status === 'calculated').length}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Último Total Bruto</h3>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {periods[0] ? formatCurrency(periods[0].total_gross) : '$0'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Último Total Neto</h3>
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {periods[0] ? formatCurrency(periods[0].total_net) : '$0'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Todos los Períodos de Nómina</h2>
        </div>

        {periods.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Período</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Fechas</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Pago</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Bruto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Deducciones</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Neto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {periods.map((period) => (
                  <tr key={period.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(period.status)}
                        <div>
                          <p className="text-sm font-medium text-slate-900">{period.period_name}</p>
                          <p className="text-xs text-slate-500 capitalize">{period.period_type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {new Date(period.start_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} - {new Date(period.end_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {new Date(period.payment_date).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(period.total_gross)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      {formatCurrency(period.total_deductions)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                      {formatCurrency(period.total_net)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(period.status)}`}>
                        {period.status === 'draft' && 'Borrador'}
                        {period.status === 'calculated' && 'Calculada'}
                        {period.status === 'approved' && 'Aprobada'}
                        {period.status === 'paid' && 'Pagada'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        {period.status === 'draft' && (
                          <button
                            onClick={() => handleProcessPeriod(period.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Procesar"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        {period.status === 'calculated' && (
                          <button
                            onClick={() => handleApprovePeriod(period.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Aprobar"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors" title="Ver detalle">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors" title="Descargar">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
              <DollarSign className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-lg font-medium text-slate-900 mb-2">No hay períodos de nómina</p>
            <p className="text-sm text-slate-500 mb-6">Crea tu primer período para comenzar a procesar nóminas</p>
            <Button onClick={handleQuickCreatePeriod}>
              <Plus className="w-5 h-5 mr-2" />
              Crear Primer Período
            </Button>
          </div>
        )}
      </div>

      <Modal
        isOpen={showWizard}
        onClose={() => { setShowWizard(false); resetForm(); }}
        title="Crear Nuevo Período de Nómina"
        maxWidth="4xl"
      >
        <StepWizard steps={wizardSteps} currentStep={currentStep} />

        <div className="mt-6">
          {currentStep === 0 && (
            <div className="space-y-5">
              <div className="grid grid-cols-4 gap-5">
                <div className="col-span-2">
                  <Input
                    label="Nombre del Período"
                    value={formData.period_name}
                    onChange={(e) => setFormData({ ...formData, period_name: e.target.value })}
                    placeholder="Ej: Nómina Noviembre 2025"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tipo de Período
                  </label>
                  <select
                    value={formData.period_type}
                    onChange={(e) => setFormData({ ...formData, period_type: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="weekly">Semanal</option>
                    <option value="biweekly">Quincenal</option>
                    <option value="monthly">Mensual</option>
                    <option value="bimonthly">Bimestral</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <Input
                    label="Fecha de Inicio"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Input
                    label="Fecha de Fin"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Input
                    label="Fecha de Pago"
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    required
                  />
                </div>

                <div className="col-span-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Agrega notas o comentarios sobre este período"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-600">
                  Selecciona los empleados a incluir en esta nómina
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (selectedEmployees.length === filteredEmployees.length) {
                      setSelectedEmployees([]);
                    } else {
                      setSelectedEmployees(filteredEmployees.map(e => e.id));
                    }
                  }}
                >
                  {selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0 ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </Button>
              </div>

              <div className="mb-4">
                <Input
                  label="Buscar empleado"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre o número de documento"
                />
              </div>

              {loadingEmployees ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="text-center py-12 border border-slate-200 rounded-lg">
                  <p className="text-slate-500">
                    {searchTerm ? 'No se encontraron empleados con ese criterio' : 'No hay empleados activos disponibles'}
                  </p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-lg">
                  {filteredEmployees.map((employee) => (
                  <label
                    key={employee.id}
                    className="flex items-center gap-4 p-4 hover:bg-slate-50 border-b border-slate-100 last:border-0 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(employee.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEmployees([...selectedEmployees, employee.id]);
                        } else {
                          setSelectedEmployees(selectedEmployees.filter(id => id !== employee.id));
                        }
                      }}
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">
                        {employee.first_name} {employee.last_name}
                      </p>
                      <div className="flex gap-3 text-sm text-slate-500">
                        <span>{employee.position_title || 'Sin puesto'}</span>
                        {employee.national_id && (
                          <>
                            <span>•</span>
                            <span>Doc: {employee.national_id}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{formatCurrency(employee.salary || 0)}</p>
                      <p className="text-xs text-slate-500">Salario base</p>
                    </div>
                  </label>
                ))}
                </div>
              )}

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-slate-900">
                  {selectedEmployees.length > 0
                    ? `${selectedEmployees.length} empleado${selectedEmployees.length > 1 ? 's' : ''} seleccionado${selectedEmployees.length > 1 ? 's' : ''}`
                    : 'Se incluirán todos los empleados activos'
                  }
                </p>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-slate-900 text-lg mb-4">Resumen del Período</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Nombre</p>
                    <p className="font-medium text-slate-900">{formData.period_name || generatePeriodName()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Tipo</p>
                    <p className="font-medium text-slate-900 capitalize">{formData.period_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Período</p>
                    <p className="font-medium text-slate-900">
                      {new Date(formData.start_date).toLocaleDateString('es-ES')} - {new Date(formData.end_date).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Fecha de Pago</p>
                    <p className="font-medium text-slate-900">{new Date(formData.payment_date).toLocaleDateString('es-ES')}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="font-semibold text-slate-900 mb-3">Empleados a Procesar</h4>
                <div className="flex items-center justify-between">
                  <p className="text-slate-700">
                    {selectedEmployees.length > 0
                      ? `${selectedEmployees.length} empleado${selectedEmployees.length > 1 ? 's' : ''} seleccionado${selectedEmployees.length > 1 ? 's' : ''}`
                      : `Todos los empleados activos (${employees.length})`
                    }
                  </p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatCurrency(
                      (selectedEmployees.length > 0
                        ? employees.filter(e => selectedEmployees.includes(e.id))
                        : employees
                      ).reduce((sum, e) => sum + (e.salary || 0), 0)
                    )}
                  </p>
                </div>
                <p className="text-sm text-slate-600 mt-2">Total estimado a pagar</p>
              </div>

              {formData.notes && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">Notas</p>
                  <p className="text-slate-700">{formData.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-between mt-8 pt-6 border-t border-slate-200">
          <Button
            variant="outline"
            onClick={() => {
              if (currentStep > 0) {
                setCurrentStep(currentStep - 1);
              } else {
                setShowWizard(false);
                resetForm();
              }
            }}
          >
            {currentStep > 0 ? 'Anterior' : 'Cancelar'}
          </Button>

          <Button
            onClick={() => {
              if (currentStep < 2) {
                setCurrentStep(currentStep + 1);
              } else {
                handleCreatePeriod();
              }
            }}
            disabled={processingPayroll || !formData.start_date || !formData.end_date || !formData.payment_date}
          >
            {processingPayroll ? 'Creando...' : currentStep < 2 ? 'Siguiente' : 'Crear Período'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
