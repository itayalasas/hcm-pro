import { useState, useEffect } from 'react';
import { Database, Plus, Edit2, Trash2, Save, X, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';

interface Nomenclator {
  id: string;
  code: string;
  name: string;
  description: string | null;
  country_code?: string;
  classification_system?: string;
  is_active: boolean;
  display_order: number;
}

interface NomenclatorConfig {
  table: string;
  title: string;
  description: string;
  fields: {
    code: { label: string; required: boolean; placeholder: string };
    name: { label: string; required: boolean; placeholder: string };
    description: { label: string; required: boolean; placeholder: string };
    country_code?: { label: string; required: boolean; placeholder: string };
    classification_system?: { label: string; required: boolean; placeholder: string };
  };
}

const nomenclatorConfigs: NomenclatorConfig[] = [
  {
    table: 'contributor_types',
    title: 'Tipos de Contribuyente (NC01)',
    description: 'Clasificación de contribuyentes según BPS',
    fields: {
      code: { label: 'Código', required: true, placeholder: '85' },
      name: { label: 'Nombre', required: true, placeholder: 'Industria y Comercio' },
      description: { label: 'Descripción', required: false, placeholder: 'Empresas del sector industrial y comercial' },
      country_code: { label: 'País', required: false, placeholder: 'URY' }
    }
  },
  {
    table: 'contribution_regimes',
    title: 'Regímenes de Aporte (NC02)',
    description: 'Tipos de régimen de aportes',
    fields: {
      code: { label: 'Código', required: true, placeholder: 'IND_COM' },
      name: { label: 'Nombre', required: true, placeholder: 'Industria y Comercio' },
      description: { label: 'Descripción', required: false, placeholder: 'Régimen para industria y comercio' },
      country_code: { label: 'País', required: false, placeholder: 'URY' }
    }
  },
  {
    table: 'company_types',
    title: 'Tipos de Empresa (NC03)',
    description: 'Clasificación de tipos de empresa',
    fields: {
      code: { label: 'Código', required: true, placeholder: 'SRL' },
      name: { label: 'Nombre', required: true, placeholder: 'Sociedad de Responsabilidad Limitada' },
      description: { label: 'Descripción', required: false, placeholder: 'S.R.L.' }
    }
  },
  {
    table: 'company_document_types',
    title: 'Tipos de Documento Empresa (NC04)',
    description: 'Tipos de identificación fiscal',
    fields: {
      code: { label: 'Código', required: true, placeholder: 'RUT' },
      name: { label: 'Nombre', required: true, placeholder: 'RUT' },
      description: { label: 'Descripción', required: false, placeholder: 'Registro Único Tributario (Uruguay)' },
      country_code: { label: 'País', required: false, placeholder: 'URY' }
    }
  },
  {
    table: 'economic_activities',
    title: 'Actividades Económicas (NC05)',
    description: 'Códigos CIUU de actividades económicas',
    fields: {
      code: { label: 'Código CIUU', required: true, placeholder: '6201' },
      name: { label: 'Nombre', required: true, placeholder: 'Programación informática' },
      description: { label: 'Descripción', required: false, placeholder: 'Actividades de programación informática' },
      classification_system: { label: 'Sistema', required: false, placeholder: 'CIUU' }
    }
  },
  {
    table: 'submission_types',
    title: 'Tipos de Envío (NC07)',
    description: 'Tipos de envío de nómina',
    fields: {
      code: { label: 'Código', required: true, placeholder: 'ORIG' },
      name: { label: 'Nombre', required: true, placeholder: 'Original' },
      description: { label: 'Descripción', required: false, placeholder: 'Envío original de nómina' }
    }
  }
];

export default function PayrollNomenclatorsPanel() {
  const toast = useToast();
  const [selectedTable, setSelectedTable] = useState<string>(nomenclatorConfigs[0].table);
  const [nomenclators, setNomenclators] = useState<Nomenclator[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Nomenclator | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({
    code: '',
    name: '',
    description: '',
    country_code: '',
    classification_system: '',
    is_active: true,
    display_order: 0
  });

  const currentConfig = nomenclatorConfigs.find(c => c.table === selectedTable)!;

  useEffect(() => {
    loadNomenclators();
  }, [selectedTable]);

  const loadNomenclators = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(selectedTable)
        .select('*')
        .order('display_order')
        .order('code');

      if (error) throw error;
      setNomenclators(data || []);
    } catch (error) {
      console.error('Error loading nomenclators:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      country_code: '',
      classification_system: '',
      is_active: true,
      display_order: nomenclators.length
    });
    setShowModal(true);
  };

  const handleEdit = (item: Nomenclator) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      description: item.description || '',
      country_code: item.country_code || '',
      classification_system: item.classification_system || '',
      is_active: item.is_active,
      display_order: item.display_order
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.code.trim() || !formData.name.trim()) {
      toast.error('Código y Nombre son requeridos');
      return;
    }

    try {
      const payload: any = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        is_active: formData.is_active,
        display_order: parseInt(formData.display_order) || 0
      };

      if (currentConfig.fields.country_code) {
        payload.country_code = formData.country_code.trim() || null;
      }

      if (currentConfig.fields.classification_system) {
        payload.classification_system = formData.classification_system.trim() || null;
      }

      if (editingItem) {
        const { error } = await supabase
          .from(selectedTable)
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Registro actualizado correctamente');
      } else {
        const { error } = await supabase
          .from(selectedTable)
          .insert(payload);

        if (error) throw error;
        toast.success('Registro creado correctamente');
      }

      setShowModal(false);
      loadNomenclators();
    } catch (error: any) {
      console.error('Error saving nomenclator:', error);
      if (error.code === '23505') {
        toast.error('El código ya existe');
      } else {
        toast.error('Error al guardar el registro');
      }
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from(selectedTable)
        .update({ is_active: false })
        .eq('id', confirmDelete);

      if (error) throw error;
      toast.success('Registro desactivado correctamente');
      loadNomenclators();
    } catch (error) {
      console.error('Error deactivating nomenclator:', error);
      toast.error('Error al desactivar el registro');
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleToggleActive = async (item: Nomenclator) => {
    try {
      const { error } = await supabase
        .from(selectedTable)
        .update({
          is_active: !item.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);

      if (error) throw error;
      toast.success(item.is_active ? 'Registro desactivado' : 'Registro activado');
      loadNomenclators();
    } catch (error) {
      console.error('Error toggling active:', error);
      toast.error('Error al cambiar el estado');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Nomencladores de Nómina</h2>
          <p className="text-slate-600 mt-1">Gestiona los catálogos de datos maestros para el procesamiento de nómina</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {nomenclatorConfigs.map((config) => (
          <button
            key={config.table}
            onClick={() => setSelectedTable(config.table)}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              selectedTable === config.table
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-start gap-3">
              <Database className={`w-5 h-5 flex-shrink-0 ${
                selectedTable === config.table ? 'text-blue-600' : 'text-slate-400'
              }`} />
              <div>
                <h3 className={`font-semibold mb-1 ${
                  selectedTable === config.table ? 'text-blue-900' : 'text-slate-900'
                }`}>
                  {config.title}
                </h3>
                <p className="text-xs text-slate-600">{config.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Descripción
                  </th>
                  {currentConfig.fields.country_code && (
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      País
                    </th>
                  )}
                  <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Orden
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {nomenclators.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                      No hay registros. Haz clic en "Agregar" para crear uno.
                    </td>
                  </tr>
                ) : (
                  nomenclators.map((item) => (
                    <tr key={item.id} className={`hover:bg-slate-50 ${!item.is_active ? 'opacity-50' : ''}`}>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-semibold text-slate-900">{item.code}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-900">{item.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">{item.description || '-'}</span>
                      </td>
                      {currentConfig.fields.country_code && (
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-600">{item.country_code || '-'}</span>
                        </td>
                      )}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleActive(item)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-colors ${
                            item.is_active
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {item.is_active ? (
                            <>
                              <Check className="w-3 h-3" />
                              Activo
                            </>
                          ) : (
                            <>
                              <X className="w-3 h-3" />
                              Inactivo
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-slate-600">{item.display_order}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(item.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Desactivar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? 'Editar Registro' : 'Nuevo Registro'}
      >
        <div className="space-y-4">
          <Input
            label={currentConfig.fields.code.label}
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder={currentConfig.fields.code.placeholder}
            required={currentConfig.fields.code.required}
            disabled={!!editingItem}
          />

          <Input
            label={currentConfig.fields.name.label}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={currentConfig.fields.name.placeholder}
            required={currentConfig.fields.name.required}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {currentConfig.fields.description.label}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={currentConfig.fields.description.placeholder}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {currentConfig.fields.country_code && (
            <Input
              label={currentConfig.fields.country_code.label}
              value={formData.country_code}
              onChange={(e) => setFormData({ ...formData, country_code: e.target.value })}
              placeholder={currentConfig.fields.country_code.placeholder}
              maxLength={3}
            />
          )}

          {currentConfig.fields.classification_system && (
            <Input
              label={currentConfig.fields.classification_system.label}
              value={formData.classification_system}
              onChange={(e) => setFormData({ ...formData, classification_system: e.target.value })}
              placeholder={currentConfig.fields.classification_system.placeholder}
            />
          )}

          <Input
            label="Orden de visualización"
            type="number"
            value={formData.display_order}
            onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
            tooltip="Orden en que aparecerá en las listas"
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm text-slate-700">
              Activo
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} className="flex-1">
              {editingItem ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Desactivar Registro"
        message="¿Está seguro que desea desactivar este registro? Esta acción se puede revertir."
        type="warning"
        confirmText="Desactivar"
        cancelText="Cancelar"
      />
    </div>
  );
}
