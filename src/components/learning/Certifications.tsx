import { useState, useEffect } from 'react';
import { Award, Plus, Edit2, Trash2, Calendar, AlertCircle, CheckCircle, Search, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useToast } from '../../hooks/useToast';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';
import Autocomplete from '../ui/Autocomplete';

interface Certification {
  id: string;
  company_id: string;
  employee_id: string;
  code: string;
  name: string;
  issuing_organization: string;
  issue_date: string;
  expiry_date: string;
  credential_id: string;
  credential_url: string;
  category: string;
  status: string;
  cost: number;
  notes: string;
  active: boolean;
  created_at: string;
  employee?: {
    first_name: string;
    last_name: string;
    employee_number: string;
  };
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  employee_number: string;
}

const certificationCategories = [
  'Tecnología',
  'Gestión de Proyectos',
  'Finanzas',
  'Recursos Humanos',
  'Marketing',
  'Ventas',
  'Compliance',
  'Seguridad',
  'Calidad',
  'Liderazgo',
  'Idiomas',
  'Técnica',
  'Otro'
];

const certificationStatuses = [
  'Vigente',
  'Vencida',
  'En renovación',
  'Suspendida'
];

export default function Certifications() {
  const { selectedCompanyId } = useCompany();
  const { showToast } = useToast();
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCertification, setSelectedCertification] = useState<Certification | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const [formData, setFormData] = useState({
    employee_id: '',
    code: '',
    name: '',
    issuing_organization: '',
    issue_date: '',
    expiry_date: '',
    credential_id: '',
    credential_url: '',
    category: '',
    status: 'Vigente',
    cost: 0,
    notes: ''
  });

  useEffect(() => {
    if (selectedCompanyId) {
      loadCertifications();
      loadEmployees();
    }
  }, [selectedCompanyId]);

  const loadCertifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('certifications')
        .select(`
          *,
          employee:employees(first_name, last_name, employee_number)
        `)
        .eq('company_id', selectedCompanyId)
        .order('issue_date', { ascending: false });

      if (error) throw error;
      setCertifications(data || []);
    } catch (error: any) {
      console.error('Error loading certifications:', error);
      showToast(error.message || 'Error al cargar certificaciones', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, employee_number')
        .eq('company_id', selectedCompanyId)
        .eq('active', true)
        .order('first_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error: any) {
      console.error('Error loading employees:', error);
    }
  };

  const handleCreate = () => {
    setSelectedCertification(null);
    setFormData({
      employee_id: '',
      code: '',
      name: '',
      issuing_organization: '',
      issue_date: '',
      expiry_date: '',
      credential_id: '',
      credential_url: '',
      category: '',
      status: 'Vigente',
      cost: 0,
      notes: ''
    });
    setShowModal(true);
  };

  const handleEdit = (cert: Certification) => {
    setSelectedCertification(cert);
    setFormData({
      employee_id: cert.employee_id,
      code: cert.code || '',
      name: cert.name,
      issuing_organization: cert.issuing_organization,
      issue_date: cert.issue_date || '',
      expiry_date: cert.expiry_date || '',
      credential_id: cert.credential_id || '',
      credential_url: cert.credential_url || '',
      category: cert.category || '',
      status: cert.status,
      cost: cert.cost || 0,
      notes: cert.notes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employee_id || !formData.name || !formData.issuing_organization || !formData.issue_date) {
      showToast('Complete los campos requeridos', 'error');
      return;
    }

    try {
      if (selectedCertification) {
        const { error } = await supabase
          .from('certifications')
          .update(formData)
          .eq('id', selectedCertification.id);

        if (error) throw error;
        showToast('Certificación actualizada exitosamente', 'success');
      } else {
        const { error } = await supabase
          .from('certifications')
          .insert({
            ...formData,
            company_id: selectedCompanyId
          });

        if (error) throw error;
        showToast('Certificación registrada exitosamente', 'success');
      }

      setShowModal(false);
      loadCertifications();
    } catch (error: any) {
      console.error('Error saving certification:', error);
      showToast(error.message || 'Error al guardar certificación', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('certifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showToast('Certificación eliminada exitosamente', 'success');
      loadCertifications();
    } catch (error: any) {
      console.error('Error deleting certification:', error);
      showToast(error.message || 'Error al eliminar certificación', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const filteredCertifications = certifications.filter(cert => {
    const employeeName = `${cert.employee?.first_name} ${cert.employee?.last_name}`.toLowerCase();
    const matchesSearch = cert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          employeeName.includes(searchTerm.toLowerCase()) ||
                          cert.issuing_organization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || cert.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || cert.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Vigente': return 'bg-green-100 text-green-800';
      case 'Vencida': return 'bg-red-100 text-red-800';
      case 'En renovación': return 'bg-yellow-100 text-yellow-800';
      case 'Suspendida': return 'bg-slate-100 text-slate-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Vigente': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Vencida': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'En renovación': return <Calendar className="w-4 h-4 text-yellow-600" />;
      default: return <AlertCircle className="w-4 h-4 text-slate-600" />;
    }
  };

  const isExpiringSoon = (expiryDate: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const vigenteCerts = certifications.filter(c => c.status === 'Vigente').length;
  const vencidaCerts = certifications.filter(c => c.status === 'Vencida').length;
  const expiringSoonCerts = certifications.filter(c => isExpiringSoon(c.expiry_date)).length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Certificaciones</h1>
          <p className="text-slate-600">Gestión de certificaciones profesionales</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Certificación
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-600">Total Certificaciones</p>
            <Award className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{certifications.length}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-600">Vigentes</p>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{vigenteCerts}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-600">Por Vencer (90 días)</p>
            <AlertCircle className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{expiringSoonCerts}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-600">Vencidas</p>
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{vencidaCerts}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar certificaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              {certificationStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas las categorías</option>
              {certificationCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredCertifications.length === 0 ? (
            <div className="text-center py-12">
              <Award className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No hay certificaciones</h3>
              <p className="text-slate-600 mb-4">Comienza registrando la primera certificación</p>
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Registrar Certificación
              </Button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Empleado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Certificación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Organización
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Emisión
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Vencimiento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredCertifications.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {cert.employee?.first_name} {cert.employee?.last_name}
                        </p>
                        <p className="text-sm text-slate-500">{cert.employee?.employee_number}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{cert.name}</p>
                        {cert.credential_id && (
                          <p className="text-xs text-slate-500">ID: {cert.credential_id}</p>
                        )}
                        {cert.category && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 mt-1">
                            {cert.category}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {cert.issuing_organization}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {cert.issue_date && new Date(cert.issue_date).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {cert.expiry_date ? (
                        <div className="flex items-center">
                          <span className="text-sm text-slate-900">
                            {new Date(cert.expiry_date).toLocaleDateString('es-ES')}
                          </span>
                          {isExpiringSoon(cert.expiry_date) && cert.status === 'Vigente' && (
                            <AlertCircle className="w-4 h-4 text-yellow-600 ml-2" title="Próximo a vencer" />
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500">Sin vencimiento</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(cert.status)}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(cert.status)}`}>
                          {cert.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {cert.credential_url && (
                          <a
                            href={cert.credential_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-900"
                            title="Ver credencial"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => handleEdit(cert)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(cert.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedCertification ? 'Editar Certificación' : 'Nueva Certificación'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Autocomplete
            label="Empleado"
            value={formData.employee_id}
            onChange={(value) => setFormData({ ...formData, employee_id: value })}
            options={employees.map((emp) => ({
              value: emp.id,
              label: `${emp.first_name} ${emp.last_name}`,
              description: `Nro: ${emp.employee_number}`
            }))}
            placeholder="Buscar empleado"
            required
          />

          <Input
            label="Nombre de la Certificación *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Organización Emisora *"
            value={formData.issuing_organization}
            onChange={(e) => setFormData({ ...formData, issuing_organization: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Categoría
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar categoría</option>
                {certificationCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Estado *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {certificationStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fecha de Emisión *"
              type="date"
              value={formData.issue_date}
              onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
              required
            />
            <Input
              label="Fecha de Vencimiento"
              type="date"
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="ID de Credencial"
              value={formData.credential_id}
              onChange={(e) => setFormData({ ...formData, credential_id: e.target.value })}
            />
            <Input
              label="Código"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            />
          </div>

          <Input
            label="URL de Verificación"
            value={formData.credential_url}
            onChange={(e) => setFormData({ ...formData, credential_url: e.target.value })}
            placeholder="https://..."
          />

          <Input
            label="Costo"
            type="number"
            value={formData.cost}
            onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notas
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {selectedCertification ? 'Actualizar' : 'Registrar'} Certificación
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Eliminar Certificación"
        message="¿Está seguro de que desea eliminar esta certificación? Esta acción no se puede deshacer."
      />
    </div>
  );
}
