import { useState, useEffect } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  Building2, MapPin, Briefcase, Plus, Edit2, Trash2, Save, X, Search, GraduationCap, BookOpen, UserCheck, FileText
} from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import PositionsTab from './PositionsTab';
import { useToast } from '../../hooks/useToast';

type MasterDataType = 'departments' | 'locations' | 'positions' | 'academic_levels' | 'institutions' | 'fields_of_study' | 'employment_types';

interface Department {
  id: string;
  code: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  active: boolean;
  created_at: string;
}

interface Location {
  id: string;
  code: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  postal_code: string | null;
  timezone: string;
  is_remote: boolean;
  active: boolean;
}

interface Position {
  id: string;
  code: string;
  title: string;
  description: string | null;
  department_id: string | null;
  job_family: string | null;
  job_level: string | null;
  salary_band_min: number | null;
  salary_band_max: number | null;
  requirements: string | null;
  responsibilities: string | null;
  active: boolean;
}

export default function MasterDataPanel() {
  const { selectedCompanyId } = useCompany();
  const { user } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<MasterDataType>('departments');
  const [searchTerm, setSearchTerm] = useState('');

  const tabs = [
    { id: 'departments' as MasterDataType, label: 'Departamentos', icon: Building2 },
    { id: 'locations' as MasterDataType, label: 'Ubicaciones', icon: MapPin },
    { id: 'positions' as MasterDataType, label: 'Puestos', icon: Briefcase },
    { id: 'academic_levels' as MasterDataType, label: 'Niveles Académicos', icon: GraduationCap },
    { id: 'institutions' as MasterDataType, label: 'Instituciones', icon: BookOpen },
    { id: 'fields_of_study' as MasterDataType, label: 'Campos de Estudio', icon: FileText },
    { id: 'employment_types' as MasterDataType, label: 'Tipos de Empleo', icon: UserCheck },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Datos Maestros</h1>
        <p className="text-slate-600">Gestiona los datos maestros de tu organización</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="border-b border-slate-200 overflow-x-auto">
          <nav className="flex min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder={`Buscar ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {activeTab === 'departments' && <DepartmentsTab searchTerm={searchTerm} />}
          {activeTab === 'locations' && <LocationsTab searchTerm={searchTerm} />}
          {activeTab === 'positions' && <PositionsTab searchTerm={searchTerm} />}
          {activeTab === 'academic_levels' && <AcademicLevelsTab searchTerm={searchTerm} />}
          {activeTab === 'institutions' && <InstitutionsTab searchTerm={searchTerm} />}
          {activeTab === 'fields_of_study' && <FieldsOfStudyTab searchTerm={searchTerm} />}
          {activeTab === 'employment_types' && <EmploymentTypesTab searchTerm={searchTerm} />}
        </div>
      </div>
    </div>
  );
}

function DepartmentsTab({ searchTerm }: { searchTerm: string }) {
  const { selectedCompanyId } = useCompany();
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    active: true,
  });

  useEffect(() => {
    loadDepartments();
  }, [selectedCompanyId]);

  const loadDepartments = async () => {
    if (!selectedCompanyId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error loading departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedCompanyId || !formData.code || !formData.name) {
      toast.warning('Por favor complete los campos requeridos');
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('departments')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('departments')
          .insert({
            company_id: selectedCompanyId,
            created_by: user?.id,
            ...formData,
          });

        if (error) throw error;
      }

      setShowModal(false);
      setEditingId(null);
      setFormData({ code: '', name: '', description: '', active: true });
      loadDepartments();
      toast.success(editingId ? 'Departamento actualizado correctamente' : 'Departamento creado correctamente');
    } catch (error) {
      console.error('Error saving department:', error);
      const errorMsg = (error as any).message || 'Error al guardar el departamento';
      toast.error(errorMsg);
    }
  };

  const handleEdit = (dept: Department) => {
    setEditingId(dept.id);
    setFormData({
      code: dept.code,
      name: dept.name,
      description: dept.description || '',
      active: dept.active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este departamento?')) return;

    try {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadDepartments();
      toast.success('Departamento eliminado correctamente');
    } catch (error) {
      console.error('Error deleting department:', error);
      toast.error('Error al eliminar el departamento');
    }
  };

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.code.toLowerCase().includes(searchTerm.toLowerCase())
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
        <p className="text-sm text-slate-600">{filteredDepartments.length} departamentos</p>
        <Button onClick={() => { setEditingId(null); setFormData({ code: '', name: '', description: '', active: true }); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Departamento
        </Button>
      </div>

      {filteredDepartments.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">No hay departamentos registrados</p>
          <Button variant="outline" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Crear Primer Departamento
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-y border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Descripción</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredDepartments.map((dept) => (
                <tr key={dept.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{dept.code}</td>
                  <td className="px-4 py-3 text-sm text-slate-900">{dept.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{dept.description || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      dept.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {dept.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleEdit(dept)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(dept.id)}
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
        title={editingId ? 'Editar Departamento' : 'Nuevo Departamento'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Código *
            </label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="DEPT001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nombre *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Recursos Humanos"
            />
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
              placeholder="Descripción del departamento..."
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

function LocationsTab({ searchTerm }: { searchTerm: string }) {
  const { selectedCompanyId } = useCompany();
  const { user } = useAuth();
  const toast = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    address: '',
    city: '',
    state: '',
    country: 'México',
    postal_code: '',
    timezone: 'America/Mexico_City',
    is_remote: false,
    active: true,
  });

  useEffect(() => {
    loadLocations();
  }, [selectedCompanyId]);

  const loadLocations = async () => {
    if (!selectedCompanyId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('work_locations')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .order('name');

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error loading locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedCompanyId || !formData.code || !formData.name) {
      toast.warning('Por favor complete los campos requeridos');
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('work_locations')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('work_locations')
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
        code: '',
        name: '',
        address: '',
        city: '',
        state: '',
        country: 'México',
        postal_code: '',
        timezone: 'America/Mexico_City',
        is_remote: false,
        active: true,
      });
      loadLocations();
      toast.success(editingId ? 'Ubicación actualizada correctamente' : 'Ubicación creada correctamente');
    } catch (error) {
      console.error('Error saving location:', error);
      const errorMsg = (error as any).message || 'Error al guardar la ubicación';
      toast.error(errorMsg);
    }
  };

  const handleEdit = (loc: Location) => {
    setEditingId(loc.id);
    setFormData({
      code: loc.code,
      name: loc.name,
      address: loc.address || '',
      city: loc.city || '',
      state: loc.state || '',
      country: loc.country,
      postal_code: loc.postal_code || '',
      timezone: loc.timezone,
      is_remote: loc.is_remote,
      active: loc.active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta ubicación?')) return;

    try {
      const { error } = await supabase
        .from('work_locations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadLocations();
      toast.success('Ubicación eliminada correctamente');
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error('Error al eliminar la ubicación');
    }
  };

  const filteredLocations = locations.filter(loc =>
    loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.city?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <p className="text-sm text-slate-600">{filteredLocations.length} ubicaciones</p>
        <Button onClick={() => { setEditingId(null); setFormData({ code: '', name: '', address: '', city: '', state: '', country: 'México', postal_code: '', timezone: 'America/Mexico_City', is_remote: false, active: true }); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Ubicación
        </Button>
      </div>

      {filteredLocations.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">No hay ubicaciones registradas</p>
          <Button variant="outline" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Crear Primera Ubicación
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-y border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ciudad</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">País</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLocations.map((loc) => (
                <tr key={loc.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{loc.code}</td>
                  <td className="px-4 py-3 text-sm text-slate-900">{loc.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{loc.city || '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{loc.country}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      loc.is_remote ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {loc.is_remote ? 'Remoto' : 'Presencial'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      loc.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {loc.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleEdit(loc)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(loc.id)}
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
        title={editingId ? 'Editar Ubicación' : 'Nueva Ubicación'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Código *
              </label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="LOC001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nombre *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Oficina Principal"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Dirección
            </label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Calle, número, colonia"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Ciudad
              </label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Ciudad"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Estado/Provincia
              </label>
              <Input
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="Estado"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                País
              </label>
              <Input
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="País"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Código Postal
              </label>
              <Input
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                placeholder="12345"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Zona Horaria
            </label>
            <select
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
              <option value="America/Tijuana">Tijuana (GMT-8)</option>
              <option value="America/Cancun">Cancún (GMT-5)</option>
              <option value="America/New_York">Nueva York (GMT-5)</option>
              <option value="America/Los_Angeles">Los Ángeles (GMT-8)</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_remote"
                checked={formData.is_remote}
                onChange={(e) => setFormData({ ...formData, is_remote: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="is_remote" className="text-sm text-slate-700">
                Ubicación Remota
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="loc_active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="loc_active" className="text-sm text-slate-700">
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



// Generic Simple Master Data Tab Component (with code generation)
interface SimpleItem {
  id: string;
  code?: string;
  name: string;
  description?: string | null;
  active: boolean;
}

interface SimpleTabProps {
  searchTerm: string;
  tableName: string;
  entityType: string;
  singularLabel: string;
  pluralLabel: string;
  hasDescription?: boolean;
}

function SimpleMasterDataTab({ searchTerm, tableName, entityType, singularLabel, pluralLabel, hasDescription = true }: SimpleTabProps) {
  const { selectedCompanyId } = useCompany();
  const toast = useToast();
  const [items, setItems] = useState<SimpleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    active: true,
  });

  useEffect(() => {
    loadItems();
  }, [selectedCompanyId]);

  const loadItems = async () => {
    if (!selectedCompanyId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('company_id', selectedCompanyId)
        .order('name');

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error(`Error loading ${pluralLabel}:`, error);
      toast.error(`Error al cargar ${pluralLabel}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedCompanyId) return;
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    try {
      let code = formData.code.trim();

      // Generate code if not provided and not editing
      if (!code && !editingId) {
        const { data: generatedCode, error: codeError } = await supabase
          .rpc('generate_entity_code', {
            p_entity_type: entityType,
            p_company_id: selectedCompanyId
          });

        if (codeError) throw codeError;
        code = generatedCode;
      }

      const dataToSave = {
        company_id: selectedCompanyId,
        ...(code && { code }),
        name: formData.name.trim(),
        ...(hasDescription && { description: formData.description.trim() || null }),
        active: formData.active,
      };

      if (editingId) {
        const { error } = await supabase
          .from(tableName)
          .update(dataToSave)
          .eq('id', editingId);
        if (error) throw error;
        toast.success(`${singularLabel} actualizado correctamente`);
      } else {
        const { error } = await supabase
          .from(tableName)
          .insert(dataToSave);
        if (error) throw error;
        toast.success(`${singularLabel} creado correctamente`);
      }

      setShowModal(false);
      resetForm();
      loadItems();
    } catch (error) {
      console.error(`Error saving ${singularLabel}:`, error);
      toast.error(`Error al guardar ${singularLabel}`);
    }
  };

  const handleEdit = (item: SimpleItem) => {
    setEditingId(item.id);
    setFormData({
      code: item.code || '',
      name: item.name,
      description: item.description || '',
      active: item.active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`¿Estás seguro de eliminar este ${singularLabel}?`)) return;

    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success(`${singularLabel} eliminado correctamente`);
      loadItems();
    } catch (error) {
      console.error(`Error deleting ${singularLabel}:`, error);
      toast.error(`Error al eliminar ${singularLabel}`);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      active: true,
    });
    setEditingId(null);
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-8 text-slate-600">Cargando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-600">{filteredItems.length} {pluralLabel}</p>
        <Button onClick={() => {
          resetForm();
          setShowModal(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo {singularLabel}
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">CÓDIGO</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">NOMBRE</th>
              {hasDescription && <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">DESCRIPCIÓN</th>}
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">ESTADO</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-4 text-sm font-medium text-blue-600">{item.code || '-'}</td>
                <td className="py-3 px-4 text-sm text-slate-900">{item.name}</td>
                {hasDescription && <td className="py-3 px-4 text-sm text-slate-600">{item.description || '-'}</td>}
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    item.active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-slate-100 text-slate-800'
                  }`}>
                    {item.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-slate-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-slate-600">
            No se encontraron {pluralLabel}
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingId ? `Editar ${singularLabel}` : `Nuevo ${singularLabel}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Código {!editingId && <span className="text-xs text-slate-500">(se generará automáticamente si se deja vacío)</span>}
            </label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder={editingId ? "Código" : "Se generará automáticamente"}
              disabled={!!editingId}
            />
          </div>

          <Input
            label="Nombre"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder={`Nombre del ${singularLabel}`}
          />

          {hasDescription && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Descripción opcional"
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="active-simple"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="active-simple" className="text-sm font-medium text-slate-700 cursor-pointer">
              Activo
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => {
              setShowModal(false);
              resetForm();
            }} className="flex-1">
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

// Tab components using the generic component
function AcademicLevelsTab({ searchTerm }: { searchTerm: string }) {
  return (
    <SimpleMasterDataTab
      searchTerm={searchTerm}
      tableName="academic_levels"
      entityType="academic_level"
      singularLabel="Nivel Académico"
      pluralLabel="niveles académicos"
      hasDescription={true}
    />
  );
}

function InstitutionsTab({ searchTerm }: { searchTerm: string }) {
  return (
    <SimpleMasterDataTab
      searchTerm={searchTerm}
      tableName="educational_institutions"
      entityType="educational_institution"
      singularLabel="Institución"
      pluralLabel="instituciones"
      hasDescription={false}
    />
  );
}

function FieldsOfStudyTab({ searchTerm }: { searchTerm: string }) {
  return (
    <SimpleMasterDataTab
      searchTerm={searchTerm}
      tableName="fields_of_study"
      entityType="field_of_study"
      singularLabel="Campo de Estudio"
      pluralLabel="campos de estudio"
      hasDescription={true}
    />
  );
}

function EmploymentTypesTab({ searchTerm }: { searchTerm: string }) {
  return (
    <SimpleMasterDataTab
      searchTerm={searchTerm}
      tableName="employment_types"
      entityType="employment_type"
      singularLabel="Tipo de Empleo"
      pluralLabel="tipos de empleo"
      hasDescription={true}
    />
  );
}
