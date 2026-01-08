import { useEffect, useState } from 'react';
import { Calendar, Plus, Edit, Trash2, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useToast } from '../../hooks/useToast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import ConfirmDialog from '../ui/ConfirmDialog';

interface LeaveType {
  id: string;
  company_id: string;
  code: string;
  name: string;
  description: string;
  annual_days: number;
  requires_approval: boolean;
  is_paid: boolean;
  active: boolean;
  created_at: string;
}

export default function LeaveTypes() {
  const { selectedCompanyId } = useCompany();
  const { showToast } = useToast();
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<LeaveType | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<string | null>(null);
  const [creatingDefaults, setCreatingDefaults] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    annual_days: '',
    requires_approval: true,
    is_paid: true,
    active: true
  });

  useEffect(() => {
    if (selectedCompanyId) {
      loadLeaveTypes();
    }
  }, [selectedCompanyId]);

  const loadLeaveTypes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leave_types')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .order('name');

      if (error) throw error;
      setLeaveTypes(data || []);
    } catch (error) {
      console.error('Error loading leave types:', error);
      showToast('Error al cargar tipos de ausencia', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingType) {
        const { error } = await supabase
          .from('leave_types')
          .update({
            code: formData.code,
            name: formData.name,
            description: formData.description,
            annual_days: parseFloat(formData.annual_days),
            requires_approval: formData.requires_approval,
            is_paid: formData.is_paid,
            active: formData.active
          })
          .eq('id', editingType.id);

        if (error) throw error;
        showToast('Tipo de ausencia actualizado', 'success');
      } else {
        const { error } = await supabase
          .from('leave_types')
          .insert({
            company_id: selectedCompanyId,
            code: formData.code,
            name: formData.name,
            description: formData.description,
            annual_days: parseFloat(formData.annual_days),
            requires_approval: formData.requires_approval,
            is_paid: formData.is_paid,
            active: formData.active
          });

        if (error) throw error;
        showToast('Tipo de ausencia creado', 'success');
      }

      setShowModal(false);
      resetForm();
      loadLeaveTypes();
    } catch (error: any) {
      console.error('Error saving leave type:', error);
      showToast(error.message || 'Error al guardar tipo de ausencia', 'error');
    }
  };

  const handleEdit = (type: LeaveType) => {
    setEditingType(type);
    setFormData({
      code: type.code,
      name: type.name,
      description: type.description || '',
      annual_days: type.annual_days.toString(),
      requires_approval: type.requires_approval,
      is_paid: type.is_paid,
      active: type.active
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!typeToDelete) return;

    try {
      const { error } = await supabase
        .from('leave_types')
        .delete()
        .eq('id', typeToDelete);

      if (error) throw error;

      showToast('Tipo de ausencia eliminado', 'success');
      loadLeaveTypes();
    } catch (error: any) {
      console.error('Error deleting leave type:', error);
      showToast(error.message || 'Error al eliminar tipo de ausencia', 'error');
    } finally {
      setShowDeleteConfirm(false);
      setTypeToDelete(null);
    }
  };

  const toggleActive = async (type: LeaveType) => {
    try {
      const { error } = await supabase
        .from('leave_types')
        .update({ active: !type.active })
        .eq('id', type.id);

      if (error) throw error;

      showToast(
        type.active ? 'Tipo de ausencia desactivado' : 'Tipo de ausencia activado',
        'success'
      );
      loadLeaveTypes();
    } catch (error) {
      showToast('Error al cambiar estado', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      annual_days: '',
      requires_approval: true,
      is_paid: true,
      active: true
    });
    setEditingType(null);
  };

  const handleCreateDefaults = async () => {
    try {
      setCreatingDefaults(true);
      const { error } = await supabase.rpc('create_default_leave_types', {
        p_company_id: selectedCompanyId
      });

      if (error) throw error;

      showToast('Tipos de ausencia por defecto creados exitosamente', 'success');
      loadLeaveTypes();
    } catch (error: any) {
      console.error('Error creating default leave types:', error);
      showToast(error.message || 'Error al crear tipos por defecto', 'error');
    } finally {
      setCreatingDefaults(false);
    }
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Tipos de Ausencia</h1>
          <p className="text-slate-600">Configura los tipos de ausencia disponibles en tu empresa</p>
        </div>
        <div className="flex gap-3">
          {leaveTypes.length === 0 && (
            <Button
              onClick={handleCreateDefaults}
              disabled={creatingDefaults}
              variant="outline"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              {creatingDefaults ? 'Creando...' : 'Crear Tipos por Defecto'}
            </Button>
          )}
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Nuevo Tipo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Total</h3>
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{leaveTypes.length}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Activos</h3>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {leaveTypes.filter(t => t.active).length}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Inactivos</h3>
            <XCircle className="w-5 h-5 text-slate-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {leaveTypes.filter(t => !t.active).length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Todos los Tipos de Ausencia</h2>
        </div>

        {leaveTypes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Días Máx.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Aprobación</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Pagado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {leaveTypes.map((type) => (
                  <tr key={type.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-semibold text-slate-900">
                        {type.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900">{type.name}</p>
                        {type.description && (
                          <p className="text-sm text-slate-500">{type.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {type.annual_days} días
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {type.requires_approval ? (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                          Requerida
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                          No requerida
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {type.is_paid ? (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                          Sí
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleActive(type)}
                        className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${
                          type.active
                            ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {type.active ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Activo
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            Inactivo
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(type)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setTypeToDelete(type.id);
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
            <p className="text-slate-500 mb-4">No hay tipos de ausencia configurados</p>
            <p className="text-sm text-slate-400 mb-6">
              Puedes crear tipos manualmente o usar los tipos por defecto del sistema
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={handleCreateDefaults}
                disabled={creatingDefaults}
                variant="outline"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                {creatingDefaults ? 'Creando...' : 'Usar Tipos por Defecto'}
              </Button>
              <Button onClick={() => setShowModal(true)}>
                <Plus className="w-5 h-5 mr-2" />
                Crear Manualmente
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingType ? 'Editar Tipo de Ausencia' : 'Nuevo Tipo de Ausencia'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Código"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              required
              placeholder="VAC"
              maxLength={20}
            />
            <Input
              label="Días Anuales"
              type="number"
              value={formData.annual_days}
              onChange={(e) => setFormData({ ...formData, annual_days: e.target.value })}
              required
              min="0"
              step="0.5"
            />
          </div>

          <Input
            label="Nombre"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Vacaciones"
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Descripción (opcional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Descripción detallada del tipo de ausencia..."
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requires_approval}
                onChange={(e) => setFormData({ ...formData, requires_approval: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700">
                Requiere aprobación
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_paid}
                onChange={(e) => setFormData({ ...formData, is_paid: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700">
                Es pagado
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700">
                Activo
              </span>
            </label>
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
              {editingType ? 'Actualizar' : 'Crear'} Tipo
            </Button>
          </div>
        </form>
      </Modal>

      {showDeleteConfirm && (
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          title="Eliminar Tipo de Ausencia"
          message="¿Estás seguro de que deseas eliminar este tipo de ausencia? Esta acción puede afectar a los saldos y solicitudes existentes."
          confirmText="Eliminar"
          cancelText="Cancelar"
          onConfirm={handleDelete}
          onClose={() => {
            setShowDeleteConfirm(false);
            setTypeToDelete(null);
          }}
          type="danger"
        />
      )}
    </div>
  );
}
