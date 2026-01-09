import { useState, useEffect } from 'react';
import { Calendar, Plus, Edit2, Trash2, Play, Pause, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useToast } from '../../hooks/useToast';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';

interface EvaluationCycle {
  id: string;
  company_id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  self_eval_deadline: string;
  manager_eval_deadline: string;
  status: 'planned' | 'active' | 'closed';
  created_at: string;
}

export default function EvaluationCycles() {
  const { selectedCompanyId } = useCompany();
  const { showToast } = useToast();
  const [cycles, setCycles] = useState<EvaluationCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<EvaluationCycle | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    self_eval_deadline: '',
    manager_eval_deadline: '',
    status: 'planned' as 'planned' | 'active' | 'closed'
  });

  useEffect(() => {
    if (selectedCompanyId) {
      loadCycles();
    }
  }, [selectedCompanyId]);

  const loadCycles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('evaluation_cycles')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setCycles(data || []);
    } catch (error: any) {
      console.error('Error loading cycles:', error);
      showToast(error.message || 'Error al cargar ciclos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedCycle(null);
    setFormData({
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      self_eval_deadline: '',
      manager_eval_deadline: '',
      status: 'planned'
    });
    setShowModal(true);
  };

  const handleEdit = (cycle: EvaluationCycle) => {
    setSelectedCycle(cycle);
    setFormData({
      name: cycle.name,
      description: cycle.description || '',
      start_date: cycle.start_date,
      end_date: cycle.end_date,
      self_eval_deadline: cycle.self_eval_deadline || '',
      manager_eval_deadline: cycle.manager_eval_deadline || '',
      status: cycle.status
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.start_date || !formData.end_date) {
      showToast('Complete los campos requeridos', 'error');
      return;
    }

    try {
      if (selectedCycle) {
        const { error } = await supabase
          .from('evaluation_cycles')
          .update(formData)
          .eq('id', selectedCycle.id);

        if (error) throw error;
        showToast('Ciclo actualizado exitosamente', 'success');
      } else {
        const { error } = await supabase
          .from('evaluation_cycles')
          .insert({
            ...formData,
            company_id: selectedCompanyId
          });

        if (error) throw error;
        showToast('Ciclo creado exitosamente', 'success');
      }

      setShowModal(false);
      loadCycles();
    } catch (error: any) {
      console.error('Error saving cycle:', error);
      showToast(error.message || 'Error al guardar ciclo', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('evaluation_cycles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showToast('Ciclo eliminado exitosamente', 'success');
      loadCycles();
    } catch (error: any) {
      console.error('Error deleting cycle:', error);
      showToast(error.message || 'Error al eliminar ciclo', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'planned' | 'active' | 'closed') => {
    try {
      const { error } = await supabase
        .from('evaluation_cycles')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      showToast('Estado actualizado exitosamente', 'success');
      loadCycles();
    } catch (error: any) {
      console.error('Error updating status:', error);
      showToast(error.message || 'Error al actualizar estado', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200';
      case 'planned': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'closed': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="w-4 h-4" />;
      case 'planned': return <Clock className="w-4 h-4" />;
      case 'closed': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Ciclos de Evaluación</h1>
          <p className="text-slate-600">Gestiona los períodos de evaluación de desempeño</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Ciclo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Total Ciclos</h3>
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{cycles.length}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Activos</h3>
            <Play className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {cycles.filter(c => c.status === 'active').length}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Planificados</h3>
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {cycles.filter(c => c.status === 'planned').length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Listado de Ciclos</h2>
        </div>

        {cycles.length > 0 ? (
          <div className="divide-y divide-slate-200">
            {cycles.map((cycle) => (
              <div key={cycle.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">{cycle.name}</h3>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(cycle.status)}`}>
                        {getStatusIcon(cycle.status)}
                        {cycle.status === 'active' ? 'Activo' : cycle.status === 'planned' ? 'Planificado' : 'Cerrado'}
                      </span>
                    </div>
                    {cycle.description && (
                      <p className="text-sm text-slate-600 mb-3">{cycle.description}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Fecha Inicio</p>
                    <p className="text-sm font-medium text-slate-900">{formatDate(cycle.start_date)}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Fecha Fin</p>
                    <p className="text-sm font-medium text-slate-900">{formatDate(cycle.end_date)}</p>
                  </div>
                  {cycle.self_eval_deadline && (
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500 mb-1">Límite Autoevaluación</p>
                      <p className="text-sm font-medium text-slate-900">{formatDate(cycle.self_eval_deadline)}</p>
                    </div>
                  )}
                  {cycle.manager_eval_deadline && (
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500 mb-1">Límite Evaluación Gerente</p>
                      <p className="text-sm font-medium text-slate-900">{formatDate(cycle.manager_eval_deadline)}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(cycle)}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Editar
                  </Button>

                  {cycle.status === 'planned' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(cycle.id, 'active')}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Activar
                    </Button>
                  )}

                  {cycle.status === 'active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(cycle.id, 'closed')}
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Cerrar
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirm(cycle.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500 mb-2">No hay ciclos de evaluación</p>
            <p className="text-sm text-slate-400">Crea un ciclo para comenzar a evaluar el desempeño</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedCycle ? 'Editar Ciclo de Evaluación' : 'Nuevo Ciclo de Evaluación'}
      >
        <div className="space-y-4">
          <Input
            label="Nombre del Ciclo *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: Evaluación Anual 2025"
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descripción del ciclo de evaluación"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha Inicio *"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
            <Input
              label="Fecha Fin *"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Límite Autoevaluación"
              type="date"
              value={formData.self_eval_deadline}
              onChange={(e) => setFormData({ ...formData, self_eval_deadline: e.target.value })}
            />
            <Input
              label="Límite Evaluación Gerente"
              type="date"
              value={formData.manager_eval_deadline}
              onChange={(e) => setFormData({ ...formData, manager_eval_deadline: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Estado
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="planned">Planificado</option>
              <option value="active">Activo</option>
              <option value="closed">Cerrado</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} className="flex-1">
              {selectedCycle ? 'Actualizar' : 'Crear'} Ciclo
            </Button>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {deleteConfirm && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => handleDelete(deleteConfirm)}
          title="Eliminar Ciclo"
          message="¿Está seguro de eliminar este ciclo de evaluación? Esta acción no se puede deshacer."
          confirmText="Eliminar"
          cancelText="Cancelar"
        />
      )}
    </div>
  );
}
