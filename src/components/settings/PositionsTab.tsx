import { useState, useEffect } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Briefcase, Plus, Edit2, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

interface Position {
  id: string;
  code: string;
  title: string;
  description: string | null;
  department_id: string | null;
  department?: { id: string; name: string };
  job_family: string | null;
  job_level: string | null;
  salary_band_min: number | null;
  salary_band_max: number | null;
  requirements: string | null;
  responsibilities: string | null;
  active: boolean;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

export default function PositionsTab({ searchTerm }: { searchTerm: string }) {
  const { selectedCompanyId } = useCompany();
  const { user } = useAuth();
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    department_id: '',
    job_family: '',
    job_level: '',
    salary_band_min: '',
    salary_band_max: '',
    requirements: '',
    responsibilities: '',
    active: true,
  });

  useEffect(() => {
    loadPositions();
    loadDepartments();
  }, [selectedCompanyId]);

  const loadPositions = async () => {
    if (!selectedCompanyId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('positions')
        .select(`
          *,
          department:departments(id, name)
        `)
        .eq('company_id', selectedCompanyId)
        .order('title');

      if (error) throw error;
      setPositions(data || []);
    } catch (error) {
      console.error('Error loading positions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    if (!selectedCompanyId) return;

    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name, code')
        .eq('company_id', selectedCompanyId)
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const handleSave = async () => {
    if (!selectedCompanyId || !formData.code || !formData.title) {
      alert('Por favor complete los campos requeridos');
      return;
    }

    try {
      const dataToSave = {
        ...formData,
        department_id: formData.department_id || null,
        salary_band_min: formData.salary_band_min ? parseFloat(formData.salary_band_min) : null,
        salary_band_max: formData.salary_band_max ? parseFloat(formData.salary_band_max) : null,
      };

      if (editingId) {
        const { error } = await supabase
          .from('positions')
          .update({
            ...dataToSave,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('positions')
          .insert({
            company_id: selectedCompanyId,
            created_by: user?.id,
            ...dataToSave,
          });

        if (error) throw error;
      }

      setShowModal(false);
      setEditingId(null);
      setFormData({
        code: '',
        title: '',
        description: '',
        department_id: '',
        job_family: '',
        job_level: '',
        salary_band_min: '',
        salary_band_max: '',
        requirements: '',
        responsibilities: '',
        active: true,
      });
      loadPositions();
    } catch (error) {
      console.error('Error saving position:', error);
      alert('Error al guardar el puesto');
    }
  };

  const handleEdit = (pos: Position) => {
    setEditingId(pos.id);
    setFormData({
      code: pos.code,
      title: pos.title,
      description: pos.description || '',
      department_id: pos.department_id || '',
      job_family: pos.job_family || '',
      job_level: pos.job_level || '',
      salary_band_min: pos.salary_band_min?.toString() || '',
      salary_band_max: pos.salary_band_max?.toString() || '',
      requirements: pos.requirements || '',
      responsibilities: pos.responsibilities || '',
      active: pos.active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este puesto?')) return;

    try {
      const { error } = await supabase
        .from('positions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadPositions();
    } catch (error) {
      console.error('Error deleting position:', error);
      alert('Error al eliminar el puesto');
    }
  };

  const filteredPositions = positions.filter(pos =>
    pos.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pos.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">{filteredPositions.length} puestos</p>
        <Button onClick={() => { setEditingId(null); setFormData({ code: '', title: '', description: '', department_id: '', job_family: '', job_level: '', salary_band_min: '', salary_band_max: '', requirements: '', responsibilities: '', active: true }); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Puesto
        </Button>
      </div>

      {filteredPositions.length === 0 ? (
        <div className="text-center py-12">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">No hay puestos registrados</p>
          <Button variant="outline" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Crear Primer Puesto
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-y border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Título</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Departamento</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nivel</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Rango Salarial</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPositions.map((pos) => (
                <tr key={pos.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{pos.code}</td>
                  <td className="px-4 py-3 text-sm text-slate-900">{pos.title}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{pos.department?.name || '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{pos.job_level || '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {pos.salary_band_min && pos.salary_band_max
                      ? `$${pos.salary_band_min.toLocaleString()} - $${pos.salary_band_max.toLocaleString()}`
                      : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      pos.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {pos.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleEdit(pos)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(pos.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingId(null); }}
        title={editingId ? 'Editar Puesto' : 'Nuevo Puesto'}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Código *
              </label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="POS001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Título *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Gerente de Ventas"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descripción breve del puesto..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Departamento
              </label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar...</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Familia de Puestos
              </label>
              <Input
                value={formData.job_family}
                onChange={(e) => setFormData({ ...formData, job_family: e.target.value })}
                placeholder="Ventas, IT, Finanzas..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nivel
            </label>
            <select
              value={formData.job_level}
              onChange={(e) => setFormData({ ...formData, job_level: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar...</option>
              <option value="Ejecutivo C-Level">Ejecutivo C-Level</option>
              <option value="Director">Director</option>
              <option value="Gerente">Gerente</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Coordinador">Coordinador</option>
              <option value="Especialista Senior">Especialista Senior</option>
              <option value="Especialista">Especialista</option>
              <option value="Analista">Analista</option>
              <option value="Asistente">Asistente</option>
              <option value="Operativo">Operativo</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Salario Mínimo
              </label>
              <Input
                type="number"
                value={formData.salary_band_min}
                onChange={(e) => setFormData({ ...formData, salary_band_min: e.target.value })}
                placeholder="30000"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Salario Máximo
              </label>
              <Input
                type="number"
                value={formData.salary_band_max}
                onChange={(e) => setFormData({ ...formData, salary_band_max: e.target.value })}
                placeholder="50000"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Requisitos
            </label>
            <textarea
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Educación, experiencia, habilidades requeridas..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Responsabilidades
            </label>
            <textarea
              value={formData.responsibilities}
              onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Principales responsabilidades del puesto..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="pos_active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="pos_active" className="text-sm text-slate-700">
              Activo
            </label>
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
