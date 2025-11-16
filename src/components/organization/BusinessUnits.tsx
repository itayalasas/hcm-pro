import { useEffect, useState } from 'react';
import { Network, Plus, Edit, Eye, Trash2, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useToast } from '../../hooks/useToast';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

interface BusinessUnit {
  id: string;
  company_id: string;
  code: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  active: boolean;
  created_at: string;
}

export default function BusinessUnits() {
  const { selectedCompanyId } = useCompany();
  const toast = useToast();
  const [units, setUnits] = useState<BusinessUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingUnit, setViewingUnit] = useState<BusinessUnit | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    parent_id: '',
    active: true,
  });

  useEffect(() => {
    if (selectedCompanyId) {
      loadUnits();
    }
  }, [selectedCompanyId]);

  const loadUnits = async () => {
    if (!selectedCompanyId) return;

    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .order('name', { ascending: true });

      if (error) throw error;
      setUnits(data || []);
    } catch (error) {
      console.error('Error loading business units:', error);
      toast.error('Error al cargar las unidades de negocio');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.code || !formData.name) {
      toast.warning('Por favor complete todos los campos requeridos');
      return;
    }

    if (!selectedCompanyId) {
      toast.error('No hay empresa seleccionada');
      return;
    }

    try {
      const dataToSave = {
        ...formData,
        company_id: selectedCompanyId,
        parent_id: formData.parent_id || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from('departments')
          .update(dataToSave)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Unidad de negocio actualizada correctamente');
      } else {
        const { error } = await supabase
          .from('departments')
          .insert(dataToSave);

        if (error) throw error;
        toast.success('Unidad de negocio creada correctamente');
      }

      setShowModal(false);
      setEditingId(null);
      resetForm();
      loadUnits();
    } catch (error: any) {
      console.error('Error saving business unit:', error);
      toast.error(error.message || 'Error al guardar la unidad de negocio');
    }
  };

  const handleEdit = (unit: BusinessUnit) => {
    setEditingId(unit.id);
    setFormData({
      code: unit.code,
      name: unit.name,
      description: unit.description || '',
      parent_id: unit.parent_id || '',
      active: unit.active,
    });
    setShowModal(true);
  };

  const handleView = (unit: BusinessUnit) => {
    setViewingUnit(unit);
    setShowViewModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de desactivar esta unidad de negocio?')) return;

    try {
      const { error } = await supabase
        .from('departments')
        .update({ active: false })
        .eq('id', id);

      if (error) throw error;
      toast.success('Unidad de negocio desactivada correctamente');
      loadUnits();
    } catch (error) {
      console.error('Error deactivating business unit:', error);
      toast.error('Error al desactivar la unidad de negocio');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      parent_id: '',
      active: true,
    });
  };

  const getParentName = (parentId: string | null) => {
    if (!parentId) return 'Ninguna';
    const parent = units.find(u => u.id === parentId);
    return parent ? parent.name : 'Desconocida';
  };

  const filteredUnits = units.filter(unit =>
    unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (unit.description && unit.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!selectedCompanyId) {
    return (
      <div className="text-center py-12">
        <Network className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-500">Seleccione una empresa para ver las unidades de negocio</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Unidades de Negocio</h1>
          <p className="text-slate-600">{filteredUnits.length} unidad{filteredUnits.length !== 1 ? 'es' : ''} encontrada{filteredUnits.length !== 1 ? 's' : ''}</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setEditingId(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Agregar Unidad
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Buscar por nombre, código o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUnits.map((unit) => (
              <div key={unit.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-500 rounded-xl flex items-center justify-center">
                    <Network className="w-6 h-6 text-white" />
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${unit.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                    {unit.active ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{unit.name}</h3>
                <p className="text-sm text-slate-500 mb-4 line-clamp-2">{unit.description || 'Sin descripción'}</p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Código:</span>
                    <span className="font-medium text-slate-900">{unit.code}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Unidad Padre:</span>
                    <span className="font-medium text-slate-900 text-right truncate ml-2">{getParentName(unit.parent_id)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleView(unit)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    Ver
                  </button>
                  <button
                    onClick={() => handleEdit(unit)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  {unit.active && (
                    <button
                      onClick={() => handleDelete(unit.id)}
                      className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredUnits.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <Network className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-500">
                {searchTerm ? 'No se encontraron unidades con ese criterio' : 'No hay unidades de negocio registradas'}
              </p>
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingId(null);
          resetForm();
        }}
        title={editingId ? 'Editar Unidad de Negocio' : 'Nueva Unidad de Negocio'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Código <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="UNI001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Unidad Padre
              </label>
              <select
                value={formData.parent_id}
                onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Ninguna</option>
                {units.filter(u => u.id !== editingId).map(unit => (
                  <option key={unit.id} value={unit.id}>{unit.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nombre <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nombre de la unidad"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción de la unidad de negocio"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="active" className="text-sm text-slate-700">
              Activa
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowModal(false);
                setEditingId(null);
                resetForm();
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} className="flex-1">
              {editingId ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setViewingUnit(null);
        }}
        title="Detalles de la Unidad de Negocio"
      >
        {viewingUnit && (
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Network className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900 mb-1">{viewingUnit.name}</h3>
                <p className="text-slate-600">{viewingUnit.code}</p>
                <span className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full ${viewingUnit.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                  {viewingUnit.active ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            </div>

            {viewingUnit.description && (
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Descripción</h4>
                <p className="text-slate-700 text-sm">{viewingUnit.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="text-xs text-slate-500 mb-1">Código</p>
                <p className="font-medium text-slate-900">{viewingUnit.code}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Unidad Padre</p>
                <p className="font-medium text-slate-900">{getParentName(viewingUnit.parent_id)}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <toast.ToastContainer />
    </div>
  );
}
