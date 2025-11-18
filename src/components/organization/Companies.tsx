import { useEffect, useState } from 'react';
import { Building2, Plus, Edit, Eye, Trash2, Search, MapPin, Mail, Phone } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import { useToast } from '../../hooks/useToast';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';
import AddCompanyWizard from './AddCompanyWizard';

interface Company {
  id: string;
  code: string;
  legal_name: string;
  trade_name: string;
  tax_id: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  location_id: string | null;
  logo_url: string | null;
  primary_color: string | null;
  country_id: string | null;
  active: boolean;
  created_at: string;
}

interface Location {
  id: string;
  name: string;
  code: string;
  city: string;
  country: string;
}

export default function Companies() {
  const { user } = useAuth();
  const { selectedCompanyId } = useCompany();
  const toast = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [viewingCompany, setViewingCompany] = useState<Company | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    loadCompanies();
    loadLocations();
  }, []);

  const loadCompanies = async () => {
    try {
      if (!user) return;

      const { data: userCompanies, error: ucError } = await supabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('active', true);

      if (ucError) throw ucError;

      const companyIds = userCompanies?.map(uc => uc.company_id) || [];

      if (companyIds.length === 0) {
        setCompanies([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .in('id', companyIds)
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

  const loadLocations = async () => {
    try {
      if (!selectedCompanyId) return;

      const { data, error } = await supabase
        .from('work_locations')
        .select('id, name, code, city, country')
        .eq('company_id', selectedCompanyId)
        .eq('active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setShowWizard(true);
  };

  const handleView = (company: Company) => {
    setViewingCompany(company);
    setShowViewModal(true);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('companies')
        .update({ active: false })
        .eq('id', confirmDelete);

      if (error) throw error;
      toast.success('Empresa desactivada correctamente');
      loadCompanies();
    } catch (error) {
      console.error('Error deactivating company:', error);
      toast.error('Error al desactivar la empresa');
    } finally {
      setConfirmDelete(null);
    }
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
            setEditingCompany(null);
            setShowWizard(true);
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
                      onClick={() => setConfirmDelete(company.id)}
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

      <AddCompanyWizard
        isOpen={showWizard}
        onClose={() => {
          setShowWizard(false);
          setEditingCompany(null);
        }}
        onSuccess={loadCompanies}
        editMode={!!editingCompany}
        companyToEdit={editingCompany}
      />

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

            {viewingCompany.location_id && (
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900">Ubicación Principal</h4>
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div className="text-slate-700">
                    <p>{locations.find(l => l.id === viewingCompany.location_id)?.name || 'Ubicación no disponible'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Desactivar Empresa"
        message="¿Está seguro que desea desactivar esta empresa? Esta acción se puede revertir."
        type="warning"
        confirmText="Desactivar"
        cancelText="Cancelar"
      />

      <toast.ToastContainer />
    </div>
  );
}
