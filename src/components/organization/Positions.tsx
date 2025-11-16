import { useEffect, useState } from 'react';
import { Briefcase, Plus, Edit, Eye, Trash2, Search, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useToast } from '../../hooks/useToast';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

interface Position {
  id: string;
  company_id: string;
  code: string;
  title: string;
  description: string | null;
  department_id: string | null;
  reports_to_position_id: string | null;
  salary_band_min: number | null;
  salary_band_max: number | null;
  level: string | null;
  job_family: string | null;
  job_level: string | null;
  requirements: string | null;
  responsibilities: string | null;
  active: boolean;
  created_at: string;
}

interface Department {
  id: string;
  name: string;
}

export default function Positions() {
  const { selectedCompanyId } = useCompany();
  const toast = useToast();
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingPosition, setViewingPosition] = useState<Position | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    department_id: '',
    reports_to_position_id: '',
    salary_band_min: '',
    salary_band_max: '',
    level: '',
    job_family: '',
    job_level: '',
    requirements: '',
    responsibilities: '',
    active: true,
  });

  useEffect(() => {
    if (selectedCompanyId) {
      loadPositions();
      loadDepartments();
    }
  }, [selectedCompanyId]);

  const loadPositions = async () => {
    if (!selectedCompanyId) return;

    try {
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .order('title', { ascending: true });

      if (error) throw error;
      setPositions(data || []);
    } catch (error) {
      console.error('Error loading positions:', error);
      toast.error('Error al cargar los puestos');
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    if (!selectedCompanyId) return;

    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .eq('company_id', selectedCompanyId)
        .eq('active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.code || !formData.title) {
      toast.warning('Por favor complete todos los campos requeridos');
      return;
    }

    if (!selectedCompanyId) {
      toast.error('No hay empresa seleccionada');
      return;
    }

    try {
      const dataToSave = {
        code: formData.code,
        title: formData.title,
        description: formData.description || null,
        department_id: formData.department_id || null,
        reports_to_position_id: formData.reports_to_position_id || null,
        salary_band_min: formData.salary_band_min ? parseFloat(formData.salary_band_min) : null,
        salary_band_max: formData.salary_band_max ? parseFloat(formData.salary_band_max) : null,
        level: formData.level || null,
        job_family: formData.job_family || null,
        job_level: formData.job_level || null,
        requirements: formData.requirements || null,
        responsibilities: formData.responsibilities || null,
        company_id: selectedCompanyId,
        active: formData.active,
      };

      if (editingId) {
        const { error } = await supabase
          .from('positions')
          .update(dataToSave)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Puesto actualizado correctamente');
      } else {
        const { error } = await supabase
          .from('positions')
          .insert(dataToSave);

        if (error) throw error;
        toast.success('Puesto creado correctamente');
      }

      setShowModal(false);
      setEditingId(null);
      resetForm();
      loadPositions();
    } catch (error: any) {
      console.error('Error saving position:', error);
      toast.error(error.message || 'Error al guardar el puesto');
    }
  };

  const handleEdit = (position: Position) => {
    setEditingId(position.id);
    setFormData({
      code: position.code,
      title: position.title,
      description: position.description || '',
      department_id: position.department_id || '',
      reports_to_position_id: position.reports_to_position_id || '',
      salary_band_min: position.salary_band_min?.toString() || '',
      salary_band_max: position.salary_band_max?.toString() || '',
      level: position.level || '',
      job_family: position.job_family || '',
      job_level: position.job_level || '',
      requirements: position.requirements || '',
      responsibilities: position.responsibilities || '',
      active: position.active,
    });
    setShowModal(true);
  };

  const handleView = (position: Position) => {
    setViewingPosition(position);
    setShowViewModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de desactivar este puesto?')) return;

    try {
      const { error } = await supabase
        .from('positions')
        .update({ active: false })
        .eq('id', id);

      if (error) throw error;
      toast.success('Puesto desactivado correctamente');
      loadPositions();
    } catch (error) {
      console.error('Error deactivating position:', error);
      toast.error('Error al desactivar el puesto');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      title: '',
      description: '',
      department_id: '',
      reports_to_position_id: '',
      salary_band_min: '',
      salary_band_max: '',
      level: '',
      job_family: '',
      job_level: '',
      requirements: '',
      responsibilities: '',
      active: true,
    });
  };

  const getDepartmentName = (deptId: string | null) => {
    if (!deptId) return 'Sin departamento';
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.name : 'Desconocido';
  };

  const getPositionTitle = (posId: string | null) => {
    if (!posId) return 'Ninguno';
    const pos = positions.find(p => p.id === posId);
    return pos ? pos.title : 'Desconocido';
  };

  const filteredPositions = positions.filter(position =>
    position.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    position.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (position.description && position.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!selectedCompanyId) {
    return (
      <div className="text-center py-12">
        <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-500">Seleccione una empresa para ver los puestos</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Puestos</h1>
          <p className="text-slate-600">{filteredPositions.length} puesto{filteredPositions.length !== 1 ? 's' : ''} encontrado{filteredPositions.length !== 1 ? 's' : ''}</p>
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
          Agregar Puesto
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Buscar por título, código o descripción..."
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
            {filteredPositions.map((position) => (
              <div key={position.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${position.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                    {position.active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{position.title}</h3>
                <p className="text-sm text-slate-500 mb-4 line-clamp-2">{position.description || 'Sin descripción'}</p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Código:</span>
                    <span className="font-medium text-slate-900">{position.code}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Departamento:</span>
                    <span className="font-medium text-slate-900 text-right truncate ml-2">{getDepartmentName(position.department_id)}</span>
                  </div>
                  {(position.salary_band_min || position.salary_band_max) && (
                    <div className="flex items-center gap-2 text-sm pt-2 border-t border-slate-100">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <span className="text-slate-700">
                        ${position.salary_band_min?.toLocaleString() || '0'} - ${position.salary_band_max?.toLocaleString() || '0'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleView(position)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    Ver
                  </button>
                  <button
                    onClick={() => handleEdit(position)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  {position.active && (
                    <button
                      onClick={() => handleDelete(position.id)}
                      className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredPositions.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-500">
                {searchTerm ? 'No se encontraron puestos con ese criterio' : 'No hay puestos registrados'}
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
        title={editingId ? 'Editar Puesto' : 'Nuevo Puesto'}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Código <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="PUE001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nivel</label>
              <Input
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                placeholder="Senior, Junior, etc."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Título del Puesto <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Gerente de Ventas"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción del puesto"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Departamento</label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar departamento</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Reporta a</label>
              <select
                value={formData.reports_to_position_id}
                onChange={(e) => setFormData({ ...formData, reports_to_position_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Ninguno</option>
                {positions.filter(p => p.id !== editingId).map(pos => (
                  <option key={pos.id} value={pos.id}>{pos.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Salario Mínimo</label>
              <Input
                type="number"
                value={formData.salary_band_min}
                onChange={(e) => setFormData({ ...formData, salary_band_min: e.target.value })}
                placeholder="50000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Salario Máximo</label>
              <Input
                type="number"
                value={formData.salary_band_max}
                onChange={(e) => setFormData({ ...formData, salary_band_max: e.target.value })}
                placeholder="80000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Familia de Puesto</label>
              <Input
                value={formData.job_family}
                onChange={(e) => setFormData({ ...formData, job_family: e.target.value })}
                placeholder="Ventas, IT, RRHH, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nivel del Puesto</label>
              <Input
                value={formData.job_level}
                onChange={(e) => setFormData({ ...formData, job_level: e.target.value })}
                placeholder="Nivel 1, Nivel 2, etc."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Requisitos</label>
            <textarea
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              placeholder="Requisitos y calificaciones necesarias"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Responsabilidades</label>
            <textarea
              value={formData.responsibilities}
              onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
              placeholder="Responsabilidades del puesto"
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
              Activo
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
          setViewingPosition(null);
        }}
        title="Detalles del Puesto"
      >
        {viewingPosition && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900 mb-1">{viewingPosition.title}</h3>
                <p className="text-slate-600">{viewingPosition.code}</p>
                <span className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full ${viewingPosition.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                  {viewingPosition.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>

            {viewingPosition.description && (
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Descripción</h4>
                <p className="text-slate-700 text-sm">{viewingPosition.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="text-xs text-slate-500 mb-1">Departamento</p>
                <p className="font-medium text-slate-900">{getDepartmentName(viewingPosition.department_id)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Reporta a</p>
                <p className="font-medium text-slate-900">{getPositionTitle(viewingPosition.reports_to_position_id)}</p>
              </div>
              {viewingPosition.level && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Nivel</p>
                  <p className="font-medium text-slate-900">{viewingPosition.level}</p>
                </div>
              )}
              {(viewingPosition.salary_band_min || viewingPosition.salary_band_max) && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Rango Salarial</p>
                  <p className="font-medium text-slate-900">
                    ${viewingPosition.salary_band_min?.toLocaleString() || '0'} - ${viewingPosition.salary_band_max?.toLocaleString() || '0'}
                  </p>
                </div>
              )}
            </div>

            {viewingPosition.job_family && (
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Familia de Puesto</h4>
                <p className="text-slate-700 text-sm">{viewingPosition.job_family}</p>
              </div>
            )}

            {viewingPosition.requirements && (
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Requisitos</h4>
                <p className="text-slate-700 text-sm whitespace-pre-line">{viewingPosition.requirements}</p>
              </div>
            )}

            {viewingPosition.responsibilities && (
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Responsabilidades</h4>
                <p className="text-slate-700 text-sm whitespace-pre-line">{viewingPosition.responsibilities}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <toast.ToastContainer />
    </div>
  );
}
