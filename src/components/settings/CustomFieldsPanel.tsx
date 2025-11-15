import { useState, useEffect } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ListTree, Plus, Edit2, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

interface CustomField {
  id: string;
  entity_type: string;
  field_name: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  is_active: boolean;
  display_order: number;
}

export default function CustomFieldsPanel() {
  const { selectedCompanyId } = useCompany();
  const { user } = useAuth();
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    entity_type: 'employee',
    field_name: '',
    field_label: '',
    field_type: 'text',
    is_required: false,
    is_active: true,
    display_order: 0,
  });

  useEffect(() => {
    loadCustomFields();
  }, [selectedCompanyId]);

  const loadCustomFields = async () => {
    if (!selectedCompanyId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('custom_fields')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .order('entity_type')
        .order('display_order');

      if (error) throw error;
      setCustomFields(data || []);
    } catch (error) {
      console.error('Error loading custom fields:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedCompanyId || !formData.field_name || !formData.field_label) {
      alert('Por favor complete los campos requeridos');
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('custom_fields')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('custom_fields')
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
        entity_type: 'employee',
        field_name: '',
        field_label: '',
        field_type: 'text',
        is_required: false,
        is_active: true,
        display_order: 0,
      });
      loadCustomFields();
    } catch (error) {
      console.error('Error saving custom field:', error);
      alert('Error al guardar el campo personalizado');
    }
  };

  const handleEdit = (field: CustomField) => {
    setEditingId(field.id);
    setFormData({
      entity_type: field.entity_type,
      field_name: field.field_name,
      field_label: field.field_label,
      field_type: field.field_type,
      is_required: field.is_required,
      is_active: field.is_active,
      display_order: field.display_order,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este campo personalizado?')) return;

    try {
      const { error } = await supabase
        .from('custom_fields')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadCustomFields();
    } catch (error) {
      console.error('Error deleting custom field:', error);
      alert('Error al eliminar el campo personalizado');
    }
  };

  const groupedFields = customFields.reduce((acc, field) => {
    if (!acc[field.entity_type]) {
      acc[field.entity_type] = [];
    }
    acc[field.entity_type].push(field);
    return acc;
  }, {} as Record<string, CustomField[]>);

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
          <h2 className="text-2xl font-bold text-slate-900">Campos Personalizados</h2>
          <p className="text-slate-600 mt-1">Agrega campos adicionales a las entidades del sistema</p>
        </div>
        <Button onClick={() => { setEditingId(null); setFormData({ entity_type: 'employee', field_name: '', field_label: '', field_type: 'text', is_required: false, is_active: true, display_order: 0 }); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Campo
        </Button>
      </div>

      {customFields.length === 0 ? (
        <div className="text-center py-12">
          <ListTree className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">No hay campos personalizados configurados</p>
          <Button variant="outline" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Crear Primer Campo
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedFields).map(([entityType, fields]) => (
            <div key={entityType} className="border border-slate-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 capitalize">{entityType}</h3>
              <div className="space-y-2">
                {fields.map((field) => (
                  <div key={field.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{field.field_label}</span>
                        <span className="text-xs font-mono text-slate-500">({field.field_name})</span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                          field.is_required ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {field.is_required ? 'Requerido' : 'Opcional'}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                          {field.field_type}
                        </span>
                        {!field.is_active && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded">
                            Inactivo
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(field)}
                        className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(field.id)}
                        className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingId(null); }}
        title={editingId ? 'Editar Campo Personalizado' : 'Nuevo Campo Personalizado'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Entidad *
            </label>
            <select
              value={formData.entity_type}
              onChange={(e) => setFormData({ ...formData, entity_type: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="employee">Empleado</option>
              <option value="leave_request">Solicitud de Ausencia</option>
              <option value="position">Puesto</option>
              <option value="department">Departamento</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nombre del Campo *
              </label>
              <Input
                value={formData.field_name}
                onChange={(e) => setFormData({ ...formData, field_name: e.target.value })}
                placeholder="codigo_empleado_alterno"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Etiqueta *
              </label>
              <Input
                value={formData.field_label}
                onChange={(e) => setFormData({ ...formData, field_label: e.target.value })}
                placeholder="Código Alterno"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tipo de Campo
              </label>
              <select
                value={formData.field_type}
                onChange={(e) => setFormData({ ...formData, field_type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="text">Texto</option>
                <option value="number">Número</option>
                <option value="date">Fecha</option>
                <option value="select">Lista Desplegable</option>
                <option value="checkbox">Casilla de Verificación</option>
                <option value="textarea">Área de Texto</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Orden de Visualización
              </label>
              <Input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="cf_required"
                checked={formData.is_required}
                onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="cf_required" className="text-sm text-slate-700">
                Requerido
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="cf_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="cf_active" className="text-sm text-slate-700">
                Activo
              </label>
            </div>
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
