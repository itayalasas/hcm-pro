import { useEffect, useState } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Plus } from 'lucide-react';
import { supabase, LeaveRequest } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function LeaveRequests() {
  const { employee } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRequest, setShowNewRequest] = useState(false);

  useEffect(() => {
    if (employee) {
      loadLeaveRequests();
    }
  }, [employee]);

  const loadLeaveRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('employee_id', employee?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading leave requests:', error);
    } finally {
      setLoading(false);
    }
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
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'cancelled': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Solicitudes de Ausencia</h1>
          <p className="text-slate-600">Gestiona tus solicitudes de tiempo libre</p>
        </div>
        <button
          onClick={() => setShowNewRequest(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva Solicitud
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Pendientes</h3>
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {requests.filter(r => r.status === 'pending').length}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Aprobadas</h3>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {requests.filter(r => r.status === 'approved').length}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Rechazadas</h3>
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {requests.filter(r => r.status === 'rejected').length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Todas las Solicitudes</h2>
        </div>

        <div className="divide-y divide-slate-200">
          {requests.map((request) => (
            <div key={request.id} className="p-6 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(request.status)}
                    <h3 className="text-lg font-medium text-slate-900">
                      {new Date(request.start_date).toLocaleDateString('es-ES')} - {new Date(request.end_date).toLocaleDateString('es-ES')}
                    </h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                      {getStatusLabel(request.status)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Duración</p>
                      <p className="text-sm font-medium text-slate-900">{request.total_days} días</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Solicitado el</p>
                      <p className="text-sm font-medium text-slate-900">
                        {new Date(request.created_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                  {request.reason && (
                    <div className="mb-3">
                      <p className="text-sm text-slate-500 mb-1">Motivo</p>
                      <p className="text-sm text-slate-700">{request.reason}</p>
                    </div>
                  )}
                  {request.approval_comments && (
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-500 mb-1">Comentarios del Manager</p>
                      <p className="text-sm text-slate-700">{request.approval_comments}</p>
                    </div>
                  )}
                </div>
                {request.status === 'pending' && (
                  <div className="flex gap-2">
                    <button className="px-3 py-1 text-sm text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors">
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {!loading && requests.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500 mb-4">No se encontraron solicitudes de ausencia</p>
            <button
              onClick={() => setShowNewRequest(true)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Crear tu primera solicitud
            </button>
          </div>
        )}
      </div>

      {showNewRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Nueva Solicitud de Ausencia</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tipo de Ausencia
                </label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Vacaciones</option>
                  <option>Enfermedad</option>
                  <option>Personal</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Fecha de Fin
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Motivo (opcional)
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Proporciona un motivo para tu solicitud..."
                ></textarea>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewRequest(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Enviar Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
