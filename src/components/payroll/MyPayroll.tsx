import { useEffect, useState } from 'react';
import { Calendar, Download, CheckCircle, Eye, FileText, AlertCircle, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import { usePermissions } from '../../contexts/PermissionsContext';
import { useToast } from '../../hooks/useToast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface PayrollPeriod {
  id: string;
  period_name: string;
  start_date: string;
  end_date: string;
  payment_date: string;
  status: string;
  month: number;
  year: number;
}

interface PayrollDetail {
  id: string;
  period_id: string;
  employee_id: string;
  gross_salary: number;
  total_deductions: number;
  total_contributions: number;
  net_salary: number;
  employee_confirmed: boolean;
  employee_confirmed_at?: string;
  employee_viewed_at?: string;
  employee_notes?: string;
  period?: PayrollPeriod;
}

interface PayrollItem {
  concept_name: string;
  concept_type: string;
  amount: number;
  description?: string;
}

export default function MyPayroll() {
  const { user, employee } = useAuth();
  const { selectedCompanyId } = useCompany();
  const { hasPermission } = usePermissions();
  const { showToast } = useToast();
  const [payrolls, setPayrolls] = useState<PayrollDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollDetail | null>(null);
  const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([]);
  const [confirmNotes, setConfirmNotes] = useState('');
  const [loadingDetail, setLoadingDetail] = useState(false);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  useEffect(() => {
    if (employee?.id && selectedCompanyId) {
      loadPayrolls();
    } else if (user && selectedCompanyId) {
      setLoading(false);
    }
  }, [user, employee, selectedCompanyId, selectedYear, selectedMonth]);

  const loadPayrolls = async () => {
    if (!employee?.id) return;

    try {
      setLoading(true);
      let query = supabase
        .from('payroll_details')
        .select(`
          *,
          period:payroll_periods(
            id,
            period_name,
            start_date,
            end_date,
            payment_date,
            status,
            month,
            year
          )
        `)
        .eq('employee_id', employee.id)
        .order('created_at', { ascending: false });

      if (selectedYear) {
        query = query.eq('period.year', selectedYear);
      }

      if (selectedMonth) {
        query = query.eq('period.month', selectedMonth);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPayrolls(data || []);
    } catch (error) {
      console.error('Error loading payrolls:', error);
      showToast('Error al cargar nóminas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadPayrollDetail = async (payrollId: string) => {
    if (!employee?.id) return;

    try {
      setLoadingDetail(true);

      await supabase.rpc('mark_payroll_as_viewed', {
        p_payroll_detail_id: payrollId,
        p_employee_id: employee.id
      });

      const { data, error } = await supabase
        .from('payroll_items')
        .select(`
          concept:payroll_concepts(name, concept_type),
          amount,
          description
        `)
        .eq('payroll_detail_id', payrollId)
        .order('concept.concept_type', { ascending: true });

      if (error) throw error;

      const items: PayrollItem[] = (data || []).map((item: any) => ({
        concept_name: item.concept?.name || 'Sin nombre',
        concept_type: item.concept?.concept_type || 'other',
        amount: item.amount,
        description: item.description
      }));

      setPayrollItems(items);
      await loadPayrolls();
    } catch (error) {
      console.error('Error loading payroll detail:', error);
      showToast('Error al cargar detalle', 'error');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleViewDetail = async (payroll: PayrollDetail) => {
    setSelectedPayroll(payroll);
    await loadPayrollDetail(payroll.id);
    setShowDetailModal(true);
  };

  const handleConfirm = async () => {
    if (!selectedPayroll || !employee?.id) return;

    try {
      const { error } = await supabase.rpc('confirm_payroll_by_employee', {
        p_payroll_detail_id: selectedPayroll.id,
        p_employee_id: employee.id,
        p_notes: confirmNotes || null
      });

      if (error) throw error;

      showToast('Recibo confirmado exitosamente', 'success');
      setShowConfirmModal(false);
      setShowDetailModal(false);
      setConfirmNotes('');
      await loadPayrolls();
    } catch (error: any) {
      console.error('Error confirming payroll:', error);
      showToast(error.message || 'Error al confirmar recibo', 'error');
    }
  };

  const handleDownload = async (payroll: PayrollDetail) => {
    showToast('Generando PDF...', 'success');
  };

  const getStatusBadge = (payroll: PayrollDetail) => {
    if (payroll.employee_confirmed) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
          <CheckCircle className="w-3 h-3" />
          Confirmado
        </span>
      );
    }

    if (payroll.employee_viewed_at) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
          <Eye className="w-3 h-3" />
          Visto
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
        <AlertCircle className="w-3 h-3" />
        Pendiente
        </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const earnings = payrollItems.filter(item => item.concept_type === 'earning');
  const deductions = payrollItems.filter(item => item.concept_type === 'deduction');
  const contributions = payrollItems.filter(item => item.concept_type === 'contribution');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!employee?.id) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Mis Nóminas</h1>
          <p className="text-slate-600">Consulta y confirma tus recibos de nómina</p>
        </div>
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <p className="text-slate-900 font-semibold mb-2">Acceso No Disponible</p>
          <p className="text-slate-500">Este módulo está disponible solo para usuarios registrados como empleados.</p>
          <p className="text-sm text-slate-400 mt-2">Contacta a tu administrador si crees que deberías tener acceso.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Mis Nóminas</h1>
        <p className="text-slate-600">Consulta y confirma tus recibos de nómina</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Año</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Mes</label>
            <select
              value={selectedMonth || ''}
              onChange={(e) => setSelectedMonth(e.target.value ? Number(e.target.value) : null)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los meses</option>
              {months.map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>

          <div className="ml-auto">
            <div className="text-sm text-slate-600">
              <strong>{payrolls.length}</strong> recibo{payrolls.length !== 1 ? 's' : ''} encontrado{payrolls.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {payrolls.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-500">No se encontraron recibos de nómina</p>
          <p className="text-sm text-slate-400 mt-2">Intenta seleccionar otro período</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {payrolls.map((payroll) => (
            <div key={payroll.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">
                    {payroll.period?.period_name}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(payroll.period?.start_date || '').toLocaleDateString('es-ES')} - {new Date(payroll.period?.end_date || '').toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </div>
                {getStatusBadge(payroll)}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-xs text-slate-600 mb-1">Salario Bruto</p>
                  <p className="text-lg font-bold text-slate-900">{formatCurrency(payroll.gross_salary)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">Deducciones</p>
                  <p className="text-lg font-bold text-red-600">-{formatCurrency(payroll.total_deductions)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">Neto a Pagar</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(payroll.net_salary)}</p>
                </div>
              </div>

              {payroll.employee_confirmed && payroll.employee_confirmed_at && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-900">
                    <strong>Confirmado el:</strong> {new Date(payroll.employee_confirmed_at).toLocaleString('es-ES')}
                  </p>
                  {payroll.employee_notes && (
                    <p className="text-sm text-green-800 mt-1">
                      <strong>Notas:</strong> {payroll.employee_notes}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                {hasPermission('misnominas', 'view_own') && (
                  <Button
                    variant="outline"
                    onClick={() => handleViewDetail(payroll)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Detalle
                  </Button>
                )}

                {hasPermission('misnominas', 'download') && (
                  <Button
                    variant="outline"
                    onClick={() => handleDownload(payroll)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar PDF
                  </Button>
                )}

                {hasPermission('misnominas', 'confirm') && !payroll.employee_confirmed && payroll.period?.status === 'approved' && (
                  <Button
                    onClick={() => {
                      setSelectedPayroll(payroll);
                      setShowConfirmModal(true);
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirmar Recibo
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedPayroll(null);
          setPayrollItems([]);
        }}
        title={`Detalle de Nómina - ${selectedPayroll?.period?.period_name}`}
      >
        {loadingDetail ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="text-sm text-slate-600 mb-1">Período de Pago</p>
                <p className="font-semibold text-slate-900">
                  {new Date(selectedPayroll?.period?.start_date || '').toLocaleDateString('es-ES')} - {new Date(selectedPayroll?.period?.end_date || '').toLocaleDateString('es-ES')}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Fecha de Pago</p>
                <p className="font-semibold text-slate-900">
                  {new Date(selectedPayroll?.period?.payment_date || '').toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>

            {earnings.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Ingresos
                </h4>
                <div className="space-y-2">
                  {earnings.map((item, index) => (
                    <div key={index} className="flex justify-between items-start p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900">{item.concept_name}</p>
                        {item.description && (
                          <p className="text-sm text-slate-600">{item.description}</p>
                        )}
                      </div>
                      <p className="font-bold text-green-600">{formatCurrency(item.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {deductions.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  Deducciones
                </h4>
                <div className="space-y-2">
                  {deductions.map((item, index) => (
                    <div key={index} className="flex justify-between items-start p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900">{item.concept_name}</p>
                        {item.description && (
                          <p className="text-sm text-slate-600">{item.description}</p>
                        )}
                      </div>
                      <p className="font-bold text-red-600">-{formatCurrency(item.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {contributions.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Contribuciones Patronales
                </h4>
                <div className="space-y-2">
                  {contributions.map((item, index) => (
                    <div key={index} className="flex justify-between items-start p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900">{item.concept_name}</p>
                        {item.description && (
                          <p className="text-sm text-slate-600">{item.description}</p>
                        )}
                      </div>
                      <p className="font-bold text-blue-600">{formatCurrency(item.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-slate-200 pt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-slate-900">
                  <span className="font-medium">Salario Bruto:</span>
                  <span className="font-bold">{formatCurrency(selectedPayroll?.gross_salary || 0)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span className="font-medium">Total Deducciones:</span>
                  <span className="font-bold">-{formatCurrency(selectedPayroll?.total_deductions || 0)}</span>
                </div>
                <div className="flex justify-between text-lg text-green-600 border-t border-slate-200 pt-2">
                  <span className="font-bold">Neto a Pagar:</span>
                  <span className="font-bold">{formatCurrency(selectedPayroll?.net_salary || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setConfirmNotes('');
        }}
        title="Confirmar Recibo de Nómina"
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              Al confirmar este recibo, indicas que has revisado y aceptas los montos detallados en tu nómina de <strong>{selectedPayroll?.period?.period_name}</strong>.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notas o Comentarios (Opcional)
            </label>
            <textarea
              value={confirmNotes}
              onChange={(e) => setConfirmNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Agrega cualquier comentario sobre tu recibo..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmModal(false);
                setConfirmNotes('');
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirm} className="flex-1">
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmar Recibo
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
