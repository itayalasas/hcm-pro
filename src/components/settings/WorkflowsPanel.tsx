import { useState, useEffect } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { GitBranch, Plus, Edit2, Trash2, Play, Pause } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

interface Workflow {
  id: string;
  name: string;
  code: string;
  entity_type: string;
  description: string | null;
  is_active: boolean;
  steps: any[];
  created_at: string;
}

export default function WorkflowsPanel() {
  const { selectedCompanyId } = useCompany();
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    entity_type: 'leave_request',
    description: '',
    is_active: true,
    steps: [] as any[],
  });

  useEffect(() => {
    loadWorkflows();
  }, [selectedCompanyId]);

  const loadWorkflows = async () => {
    if (!selectedCompanyId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .order('name');

      if (error) throw error;
      setWorkflows(data || []);
    } catch (error) {
      console.error('Error loading workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedCompanyId || !formData.name || !formData.code) {
      alert('Por favor complete los campos requeridos');
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('workflows')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('workflows')
          .insert({
            company_id: selectedCompanyId,
            created_by: user?.id,
            ...formData,
          });

        if (error) throw error;
      }

      setShowModal(false);
      setEditingId(null);
      setFormData({
        name: '',
        code: '',
        entity_type: 'leave_request',
        description: '',
        is_active: true,
        steps: [],
      });
      loadWorkflows();
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert('Error al guardar el flujo de trabajo');
    }
  };

  const handleEdit = (workflow: Workflow) => {
    setEditingId(workflow.id);
    setFormData({
      name: workflow.name,
      code: workflow.code,
      entity_type: workflow.entity_type,
      description: workflow.description || '',
      is_active: workflow.is_active,
      steps: workflow.steps || [],
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este flujo de trabajo?')) return;

    try {
      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadWorkflows();
    } catch (error) {
      console.error('Error deleting workflow:', error);
      alert('Error al eliminar el flujo de trabajo');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('workflows')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      loadWorkflows();
    } catch (error) {
      console.error('Error toggling workflow:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Flujos de Trabajo</h2>
          <p className="text-slate-600 mt-1">Define procesos de aprobación y flujos automáticos</p>
        </div>
        <Button onClick={() => { setEditingId(null); setFormData({ name: '', code: '', entity_type: 'leave_request', description: '', is_active: true, steps: [] }); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Flujo
        </Button>
      </div>

      {workflows.length === 0 ? (
        <div className="text-center py-12">
          <GitBranch className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">No hay flujos de trabajo configurados</p>
          <Button variant="outline" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Crear Primer Flujo
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {workflows.map((workflow) => (
            <div
              key={workflow.id}
              className="border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-slate-900">{workflow.name}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      workflow.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {workflow.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                      {workflow.entity_type}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{workflow.description || 'Sin descripción'}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono">{workflow.code}</span>
                    <span>•</span>
                    <span>{workflow.steps?.length || 0} pasos</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(workflow.id, workflow.is_active)}
                    className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title={workflow.is_active ? 'Desactivar' : 'Activar'}
                  >
                    {workflow.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleEdit(workflow)}
                    className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(workflow.id)}
                    className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingId(null); }}
        title={editingId ? 'Editar Flujo de Trabajo' : 'Nuevo Flujo de Trabajo'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nombre *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Aprobación de Vacaciones"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Código *
              </label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="WF001"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tipo de Entidad
            </label>
            <select
              value={formData.entity_type}
              onChange={(e) => setFormData({ ...formData, entity_type: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="leave_request">Solicitud de Ausencia</option>
              <option value="employee">Empleado</option>
              <option value="expense">Gasto</option>
              <option value="requisition">Requisición</option>
              <option value="document">Documento</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe el propósito de este flujo..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="workflow_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="workflow_active" className="text-sm text-slate-700">
              Activo
            </label>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Nota:</strong> La configuración avanzada de pasos y reglas estará disponible próximamente.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => { setShowModal(false); setEditingId(null); }} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="flex-1">
              {editingId ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
