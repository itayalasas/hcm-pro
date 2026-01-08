import { useEffect, useState } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Plus, Trash2, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useToast } from '../../hooks/useToast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import ConfirmDialog from '../ui/ConfirmDialog';
import Autocomplete from '../ui/Autocomplete';

interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: string;
  approved_by?: string;
  approval_comments?: string;
  approved_at?: string;
  created_at: string;
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

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  employee_number: string;
}

interface VacationBalance {
  total_days: number;
  used_days: number;
  pending_days: number;
  available_days: number;
  carryover_days: number;
}

export default function LeaveRequests() {
  const { selectedCompanyId } = useCompany();
  const { showToast } = useToast();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [vacationBalance, setVacationBalance] = useState<VacationBalance | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  const [formData, setFormData] = useState({
    employee_id: '',
    leave_type_id: '',
    start_date: '',
    end_date: '',
    reason: ''
  });

  useEffect(() => {
    if (selectedCompanyId) {
      loadLeaveRequests();
      loadLeaveTypes();
      loadEmployees();
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    if (formData.employee_id && formData.leave_type_id) {
      const selectedType = leaveTypes.find(t => t.id === formData.leave_type_id);
      if (selectedType && selectedType.code.toLowerCase() === 'vac') {
        loadVacationBalance(formData.employee_id);
      } else {
        setVacationBalance(null);
      }
    } else {
      setVacationBalance(null);
    }
  }, [formData.employee_id, formData.leave_type_id, leaveTypes]);

  const loadLeaveRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          employee:employees(first_name, last_name, employee_number),
          leave_type:leave_types(name, code)
        `)
        .eq('employees.company_id', selectedCompanyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading leave requests:', error);
      showToast('Error al cargar solicitudes', 'error');
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

  const loadVacationBalance = async (employeeId: string) => {
    try {
      setLoadingBalance(true);
      const currentYear = new Date().getFullYear();

      const vacationType = leaveTypes.find(t => t.code.toLowerCase() === 'vac');
      if (!vacationType) return;

      const { data, error } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('leave_type_id', vacationType.id)
        .eq('year', currentYear)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setVacationBalance({
          total_days: data.total_days,
          used_days: data.used_days,
          pending_days: data.pending_days,
          available_days: data.available_days,
          carryover_days: data.carryover_days || 0
        });
      } else {
        setVacationBalance(null);
      }
    } catch (error) {
      console.error('Error loading vacation balance:', error);
    } finally {
      setLoadingBalance(false);
    }
  };

  const calculateDays = () => {
    if (!formData.start_date || !formData.end_date) return 0;
    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const totalDays = calculateDays();

      const selectedType = leaveTypes.find(t => t.id === formData.leave_type_id);
      if (selectedType && selectedType.code.toLowerCase() === 'vac' && vacationBalance) {
        if (totalDays > vacationBalance.available_days) {
          showToast(
            `No hay suficientes días de vacaciones disponibles. Disponibles: ${vacationBalance.available_days}, Solicitados: ${totalDays}`,
            'error'
          );
          return;
        }
      }

      const { error } = await supabase
        .from('leave_requests')
        .insert({
          employee_id: formData.employee_id,
          leave_type_id: formData.leave_type_id,
          start_date: formData.start_date,
          end_date: formData.end_date,
          total_days: totalDays,
          reason: formData.reason,
          status: 'pending'
        });

      if (error) throw error;

      showToast('Solicitud creada exitosamente', 'success');
      setShowModal(false);
      resetForm();
      loadLeaveRequests();
    } catch (error: any) {
      console.error('Error creating request:', error);
      showToast(error.message || 'Error al crear solicitud', 'error');
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      showToast('Solicitud aprobada', 'success');
      loadLeaveRequests();
    } catch (error) {
      showToast('Error al aprobar solicitud', 'error');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({
          status: 'rejected',
          approved_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      showToast('Solicitud rechazada', 'success');
      loadLeaveRequests();
    } catch (error) {
      showToast('Error al rechazar solicitud', 'error');
    }
  };

  const handleDelete = async () => {
    if (!requestToDelete) return;

    try {
      const { error } = await supabase
        .from('leave_requests')
        .delete()
        .eq('id', requestToDelete);

      if (error) throw error;

      showToast('Solicitud eliminada', 'success');
      loadLeaveRequests();
    } catch (error) {
      showToast('Error al eliminar solicitud', 'error');
    } finally {
      setShowDeleteConfirm(false);
      setRequestToDelete(null);
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      leave_type_id: '',
      start_date: '',
      end_date: '',
      reason: ''
    });
    setVacationBalance(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending': return <Clock className="w-5 h-5 text-amber-600" />;
      case 'cancelled': return <AlertCircle className="w-5 h-5 text-slate-600" />;
      default: return <Clock className="w-5 h-5 text-slate-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'cancelled': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Aprobada';
      case 'rejected': return 'Rechazada';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const employeeOptions = employees.map(emp => ({
    value: emp.id,
    label: `${emp.first_name} ${emp.last_name} - #${emp.employee_number}`
  }));

  const leaveTypeOptions = leaveTypes.map(type => ({
    value: type.id,
    label: `${type.name} (${type.code})`
  }));

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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Solicitudes de Ausencia</h1>
          <p className="text-slate-600">Gestiona las solicitudes de tiempo libre del equipo</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Nueva Solicitud
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Total</h3>
            <FileText className="w-5 h-5 text-slate-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{requests.length}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Pendientes</h3>
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {requests.filter(r => r.status === 'pending').length}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Aprobadas</h3>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {requests.filter(r => r.status === 'approved').length}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Rechazadas</h3>
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {requests.filter(r => r.status === 'rejected').length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Todas las Solicitudes</h2>
          <div className="flex gap-2">
            {['all', 'pending', 'approved', 'rejected'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status as any)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {status === 'all' ? 'Todas' : getStatusLabel(status)}
              </button>
            ))}
          </div>
        </div>

        {filteredRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Empleado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Fechas</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Días</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {request.employee?.first_name} {request.employee?.last_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          #{request.employee?.employee_number}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-900">{request.leave_type?.name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        {new Date(request.start_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} -
                        {new Date(request.end_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {request.total_days} {request.total_days === 1 ? 'día' : 'días'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(request.status)}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(request.status)}`}>
                          {getStatusLabel(request.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(request.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Aprobar"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReject(request.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Rechazar"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setRequestToDelete(request.id);
                            setShowDeleteConfirm(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500 mb-4">No se encontraron solicitudes</p>
            <Button onClick={() => setShowModal(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Crear Primera Solicitud
            </Button>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title="Nueva Solicitud de Ausencia"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Autocomplete
            label="Empleado"
            options={employeeOptions}
            value={formData.employee_id}
            onChange={(value) => setFormData({ ...formData, employee_id: value })}
            placeholder="Buscar por nombre o número de empleado..."
            required
          />

          <Autocomplete
            label="Tipo de Ausencia"
            options={leaveTypeOptions}
            value={formData.leave_type_id}
            onChange={(value) => setFormData({ ...formData, leave_type_id: value })}
            placeholder="Buscar tipo de ausencia..."
            required
          />

          {vacationBalance && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Saldo de Vacaciones</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-blue-700">Total:</p>
                  <p className="font-bold text-blue-900">{vacationBalance.total_days} días</p>
                </div>
                <div>
                  <p className="text-blue-700">Usados:</p>
                  <p className="font-bold text-blue-900">{vacationBalance.used_days} días</p>
                </div>
                <div>
                  <p className="text-blue-700">Pendientes:</p>
                  <p className="font-bold text-blue-900">{vacationBalance.pending_days} días</p>
                </div>
                <div>
                  <p className="text-green-700">Disponibles:</p>
                  <p className="font-bold text-green-900">{vacationBalance.available_days} días</p>
                </div>
                {vacationBalance.carryover_days > 0 && (
                  <div className="col-span-2">
                    <p className="text-amber-700">Días arrastrados del año anterior:</p>
                    <p className="font-bold text-amber-900">{vacationBalance.carryover_days} días</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {loadingBalance && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <p className="text-sm text-slate-600">Cargando saldo de vacaciones...</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha de Inicio"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
            />
            <Input
              label="Fecha de Fin"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              required
              min={formData.start_date}
            />
          </div>

          {formData.start_date && formData.end_date && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-sm font-medium text-slate-900">
                Total de días solicitados: <span className="text-blue-600 font-bold">{calculateDays()}</span>
              </p>
              {vacationBalance && calculateDays() > vacationBalance.available_days && (
                <p className="text-sm text-red-600 mt-2 font-medium">
                  No hay suficientes días disponibles
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Motivo (opcional)
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Proporciona un motivo para la solicitud..."
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
              Crear Solicitud
            </Button>
          </div>
        </form>
      </Modal>

      {showDeleteConfirm && (
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          title="Eliminar Solicitud"
          message="¿Estás seguro de que deseas eliminar esta solicitud de ausencia? Esta acción no se puede deshacer."
          confirmText="Eliminar"
          cancelText="Cancelar"
          onConfirm={handleDelete}
          onClose={() => {
            setShowDeleteConfirm(false);
            setRequestToDelete(null);
          }}
          type="danger"
        />
      )}
    </div>
  );
}
