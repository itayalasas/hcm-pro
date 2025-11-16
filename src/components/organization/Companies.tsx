import { useEffect, useState } from 'react';
import { Building2, Plus, Edit, Eye, Trash2, X, Save, Search, MapPin, Mail, Phone } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useToast } from '../../hooks/useToast';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

interface Company {
  id: string;
  code: string;
  legal_name: string;
  trade_name: string;
  tax_id: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  primary_color: string | null;
  country_id: string | null;
  active: boolean;
  created_at: string;
}

export default function Companies() {
  const { selectedCompanyId } = useCompany();
  const toast = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingCompany, setViewingCompany] = useState<Company | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    legal_name: '',
    trade_name: '',
    tax_id: '',
    email: '',
    phone: '',
    address: '',
    active: true,
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('legal_name', { ascending: true });

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
      toast.error('Error al cargar las empresas');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.code || !formData.legal_name || !formData.trade_name || !formData.tax_id) {
      toast.warning('Por favor complete todos los campos requeridos');
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('companies')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Empresa actualizada correctamente');
      } else {
        const { error } = await supabase
          .from('companies')
          .insert(formData);

        if (error) throw error;
        toast.success('Empresa creada correctamente');
      }

      setShowModal(false);
      setEditingId(null);
      resetForm();
      loadCompanies();
    } catch (error: any) {
      console.error('Error saving company:', error);
      toast.error(error.message || 'Error al guardar la empresa');
    }
  };

  const handleEdit = (company: Company) => {
    setEditingId(company.id);
    setFormData({
      code: company.code,
      legal_name: company.legal_name,
      trade_name: company.trade_name,
      tax_id: company.tax_id,
      email: company.email || '',
      phone: company.phone || '',
      address: company.address || '',
      active: company.active,
    });
    setShowModal(true);
  };

  const handleView = (company: Company) => {
    setViewingCompany(company);
    setShowViewModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de desactivar esta empresa?')) return;

    try {
      const { error } = await supabase
        .from('companies')
        .update({ active: false })
        .eq('id', id);

      if (error) throw error;
      toast.success('Empresa desactivada correctamente');
      loadCompanies();
    } catch (error) {
      console.error('Error deactivating company:', error);
      toast.error('Error al desactivar la empresa');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      legal_name: '',
      trade_name: '',
      tax_id: '',
      email: '',
      phone: '',
      address: '',
      active: true,
    });
  };

  const filteredCompanies = companies.filter(company =>
    company.legal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.trade_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.tax_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Empresas</h1>
          <p className="text-slate-600">{filteredCompanies.length} empresa{filteredCompanies.length !== 1 ? 's' : ''} encontrada{filteredCompanies.length !== 1 ? 's' : ''}</p>
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
          Agregar Empresa
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Buscar por nombre, código o RFC..."
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
            {filteredCompanies.map((company) => (
              <div key={company.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${company.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                    {company.active ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{company.legal_name}</h3>
                <p className="text-sm text-slate-500 mb-4">{company.trade_name}</p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Código:</span>
                    <span className="font-medium text-slate-900">{company.code}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">RFC:</span>
                    <span className="font-medium text-slate-900">{company.tax_id}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleView(company)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    Ver
                  </button>
                  <button
                    onClick={() => handleEdit(company)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  {company.active && (
                    <button
                      onClick={() => handleDelete(company.id)}
                      className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredCompanies.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-500">
                {searchTerm ? 'No se encontraron empresas con ese criterio' : 'No hay empresas registradas'}
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
        title={editingId ? 'Editar Empresa' : 'Nueva Empresa'}
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
                placeholder="EMP001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                RFC <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.tax_id}
                onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                placeholder="ABC123456XYZ"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Razón Social <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.legal_name}
              onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
              placeholder="Nombre legal de la empresa"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nombre Comercial <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.trade_name}
              onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
              placeholder="Nombre comercial"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contacto@empresa.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Teléfono</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+52 55 1234 5678"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Dirección</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Dirección completa de la empresa"
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
          setViewingCompany(null);
        }}
        title="Detalles de la Empresa"
      >
        {viewingCompany && (
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900 mb-1">{viewingCompany.legal_name}</h3>
                <p className="text-slate-600">{viewingCompany.trade_name}</p>
                <span className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full ${viewingCompany.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                  {viewingCompany.active ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="text-xs text-slate-500 mb-1">Código</p>
                <p className="font-medium text-slate-900">{viewingCompany.code}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">RFC</p>
                <p className="font-medium text-slate-900">{viewingCompany.tax_id}</p>
              </div>
            </div>

            {(viewingCompany.email || viewingCompany.phone) && (
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900">Contacto</h4>
                {viewingCompany.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-700">{viewingCompany.email}</span>
                  </div>
                )}
                {viewingCompany.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-700">{viewingCompany.phone}</span>
                  </div>
                )}
              </div>
            )}

            {viewingCompany.address && (
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900">Dirección</h4>
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div className="text-slate-700">
                    <p>{viewingCompany.address}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <toast.ToastContainer />
    </div>
  );
}
