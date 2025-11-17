import { useState, useEffect } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  User, Briefcase, FileText, History, Mail, Phone, MapPin, Calendar,
  Building2, DollarSign, ArrowLeft, Edit2, Save, X, Plus, Upload, Download,
  Trash2, AlertCircle, MoreVertical, UserX, FileCheck
} from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import { useToast } from '../../hooks/useToast';
import { replaceContractVariables, EmployeeContractData } from '../../lib/contractTemplates';

interface Employee {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string;
  photo_url: string | null;
  status: string;
  hire_date: string;
  termination_date: string | null;
  work_location: string | null;
  date_of_birth: string | null;
  phone: string | null;
  mobile: string | null;
  address_street: string | null;
  address_city: string | null;
  address_country: string | null;
  national_id: string | null;
  position: { id: string; title: string; code: string } | null;
  business_unit: { id: string; name: string; code: string } | null;
  direct_manager: { id: string; first_name: string; last_name: string } | null;
}

interface EmployeeProfileProps {
  employeeId: string;
  onBack: () => void;
}

type TabType = 'general' | 'contracts' | 'documents' | 'history';

export default function EmployeeProfile({ employeeId, onBack }: EmployeeProfileProps) {
  const { selectedCompanyId } = useCompany();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showGenerateContractModal, setShowGenerateContractModal] = useState(false);
  const [generatingContract, setGeneratingContract] = useState(false);
  const [contractTemplates, setContractTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [generatedContract, setGeneratedContract] = useState('');
  const [companyData, setCompanyData] = useState<{
    name: string;
    address: string;
    country: string;
  }>({ name: '', address: '', country: '' });

  useEffect(() => {
    loadEmployee();
    loadCompanyData();
    loadContractTemplates();
  }, [employeeId, selectedCompanyId]);

  const loadEmployee = async () => {
    if (!selectedCompanyId || !employeeId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          position:positions(id, title, code),
          business_unit:business_units(id, name, code)
        `)
        .eq('id', employeeId)
        .eq('company_id', selectedCompanyId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        let managerData = null;
        if (data.direct_manager_id) {
          const { data: manager } = await supabase
            .from('employees')
            .select('id, first_name, last_name')
            .eq('id', data.direct_manager_id)
            .maybeSingle();

          managerData = manager;
        }

        setEmployee({
          ...data,
          direct_manager: managerData
        } as unknown as Employee);
      }
    } catch (error) {
      console.error('Error loading employee:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanyData = async () => {
    if (!selectedCompanyId) return;

    try {
      const { data, error } = await supabase
        .from('companies')
        .select(`
          legal_name,
          trade_name,
          address,
          country:countries(name)
        `)
        .eq('id', selectedCompanyId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCompanyData({
          name: data.trade_name || data.legal_name || '',
          address: data.address || 'Dirección no especificada',
          country: data.country?.name || ''
        });
      }
    } catch (error) {
      console.error('Error loading company data:', error);
    }
  };

  const loadContractTemplates = async () => {
    if (!selectedCompanyId) return;

    try {
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setContractTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleGenerateContract = async () => {
    if (!selectedTemplate || !employee) {
      toast.error('Seleccione una plantilla');
      return;
    }

    setGeneratingContract(true);
    try {
      const template = contractTemplates.find(t => t.id === selectedTemplate);
      if (!template) return;

      const contractData: EmployeeContractData = {
        companyName: companyData.name,
        companyAddress: companyData.address,
        companyRepresentative: 'Representante Legal',
        representativeTitle: 'Director General',
        employeeName: `${employee.first_name} ${employee.last_name}`,
        employeeId: employee.national_id,
        employeeAddress: employee.address_street,
        employeeCity: employee.address_city,
        employeeCountry: employee.address_country,
        position: employee.position?.title,
        department: employee.business_unit?.name,
        employmentType: 'Tiempo Completo',
        hireDate: new Date(employee.hire_date).toLocaleDateString('es-ES'),
      };

      const contractContent = replaceContractVariables(template.content, contractData);

      setGeneratedContract(contractContent);
      toast.success('Contrato generado exitosamente');
    } catch (error) {
      console.error('Error generating contract:', error);
      toast.error('Error al generar el contrato');
    } finally {
      setGeneratingContract(false);
    }
  };

  const handleDeactivateEmployee = async () => {
    if (!employee) return;

    if (!confirm(`¿Está seguro de desactivar a ${employee.first_name} ${employee.last_name}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('employees')
        .update({
          status: 'inactive',
          termination_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', employeeId);

      if (error) throw error;

      toast.success('Empleado desactivado exitosamente');
      loadEmployee();
      setShowActionsMenu(false);
    } catch (error) {
      console.error('Error deactivating employee:', error);
      toast.error('Error al desactivar el empleado');
    }
  };

  const handleActivateEmployee = async () => {
    if (!employee) return;

    try {
      const { error } = await supabase
        .from('employees')
        .update({
          status: 'active',
          termination_date: null
        })
        .eq('id', employeeId);

      if (error) throw error;

      toast.success('Empleado activado exitosamente');
      loadEmployee();
      setShowActionsMenu(false);
    } catch (error) {
      console.error('Error activating employee:', error);
      toast.error('Error al activar el empleado');
    }
  };

  const handlePrintContract = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Contrato de Trabajo - ${employee?.first_name} ${employee?.last_name}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                padding: 40px;
                max-width: 800px;
                margin: 0 auto;
              }
              @media print {
                body {
                  padding: 20px;
                }
              }
            </style>
          </head>
          <body>
            ${generatedContract.split('\n').map(line => `<p>${line}</p>`).join('')}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const tabs = [
    { id: 'general' as TabType, label: 'Información General', icon: User },
    { id: 'contracts' as TabType, label: 'Contratos', icon: Briefcase },
    { id: 'documents' as TabType, label: 'Documentos', icon: FileText },
    { id: 'history' as TabType, label: 'Historial', icon: History },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 mb-4">Empleado no encontrado</p>
        <Button onClick={onBack}>Volver</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Volver a la lista</span>
        </button>

        <div className="relative">
          <Button
            variant="outline"
            onClick={() => setShowActionsMenu(!showActionsMenu)}
          >
            <MoreVertical className="w-4 h-4 mr-2" />
            Acciones
          </Button>

          {showActionsMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowActionsMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-20">
                <button
                  onClick={() => {
                    setEditing(true);
                    setShowActionsMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar Empleado
                </button>

                <button
                  onClick={() => {
                    setShowGenerateContractModal(true);
                    setShowActionsMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <FileCheck className="w-4 h-4" />
                  Generar Contrato
                </button>

                <div className="border-t border-slate-200 my-2" />

                {employee.status === 'active' ? (
                  <button
                    onClick={handleDeactivateEmployee}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <UserX className="w-4 h-4" />
                    Desactivar Empleado
                  </button>
                ) : (
                  <button
                    onClick={handleActivateEmployee}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Activar Empleado
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-8 text-white">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold">
            {employee.photo_url ? (
              <img src={employee.photo_url} alt={`${employee.first_name} ${employee.last_name}`} className="w-full h-full rounded-full object-cover" />
            ) : (
              `${employee.first_name[0]}${employee.last_name[0]}`
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">
              {employee.first_name} {employee.last_name}
            </h1>
            <div className="flex items-center gap-4 text-blue-100 mb-4">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {employee.employee_number}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                {employee.position?.title || 'Sin puesto'}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                employee.status === 'active' ? 'bg-green-500' : 'bg-red-500'
              }`}>
                {employee.status === 'active' ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-blue-200 mb-1">Email</div>
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {employee.email}
                </div>
              </div>
              <div>
                <div className="text-xs text-blue-200 mb-1">Fecha de Ingreso</div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(employee.hire_date).toLocaleDateString('es-ES')}
                </div>
              </div>
              <div>
                <div className="text-xs text-blue-200 mb-1">Ubicación</div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {employee.work_location || 'No especificada'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="border-b border-slate-200">
          <nav className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative ${
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
          {activeTab === 'general' && <GeneralTab employee={employee} onRefresh={loadEmployee} />}
          {activeTab === 'contracts' && <ContractsTab employeeId={employeeId} />}
          {activeTab === 'documents' && <DocumentsTab employeeId={employeeId} />}
          {activeTab === 'history' && <HistoryTab employeeId={employeeId} />}
        </div>
      </div>

      <Modal
        isOpen={showGenerateContractModal}
        onClose={() => {
          setShowGenerateContractModal(false);
          setGeneratedContract('');
          setSelectedTemplate('');
        }}
        title="Generar Contrato de Trabajo"
      >
        {!generatedContract ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Seleccionar Plantilla
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccione una plantilla...</option>
                {contractTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            {contractTemplates.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  No hay plantillas de contrato disponibles. Cree una plantilla en Organización → Plantillas de Contrato.
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowGenerateContractModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleGenerateContract}
                className="flex-1"
                disabled={!selectedTemplate || generatingContract}
              >
                {generatingContract ? 'Generando...' : 'Generar Contrato'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white border-2 border-slate-200 rounded-xl p-6 max-h-96 overflow-y-auto">
              <div className="text-sm whitespace-pre-line font-sans leading-relaxed">
                {generatedContract}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={handlePrintContract}
              >
                <FileText className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => {
                  const blob = new Blob([generatedContract], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `contrato_${employee.first_name}_${employee.last_name}.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  toast.success('Contrato descargado');
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function GeneralTab({ employee, onRefresh }: { employee: Employee; onRefresh: () => void }) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    phone: employee.phone || '',
    mobile: employee.mobile || '',
    address: employee.address_street || '',
    city: employee.address_city || '',
  });

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('employees')
        .update({
          phone: formData.phone,
          mobile: formData.mobile,
          address_street: formData.address,
          address_city: formData.city,
        })
        .eq('id', employee.id);

      if (error) throw error;

      setEditing(false);
      onRefresh();
    } catch (error) {
      console.error('Error updating employee:', error);
      alert('Error al actualizar la información');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Información Personal</h3>
        {!editing ? (
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Edit2 className="w-4 h-4 mr-2" />
            Editar
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Guardar
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Teléfono
          </label>
          {editing ? (
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          ) : (
            <div className="flex items-center gap-2 text-slate-900">
              <Phone className="w-4 h-4 text-slate-400" />
              {employee.phone || 'No especificado'}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Móvil
          </label>
          {editing ? (
            <Input
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
            />
          ) : (
            <div className="flex items-center gap-2 text-slate-900">
              <Phone className="w-4 h-4 text-slate-400" />
              {employee.mobile || 'No especificado'}
            </div>
          )}
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Dirección
          </label>
          {editing ? (
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          ) : (
            <div className="flex items-center gap-2 text-slate-900">
              <MapPin className="w-4 h-4 text-slate-400" />
              {employee.address_street || 'No especificada'}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Ciudad
          </label>
          {editing ? (
            <Input
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          ) : (
            <div className="flex items-center gap-2 text-slate-900">
              <Building2 className="w-4 h-4 text-slate-400" />
              {employee.address_city || 'No especificada'}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Fecha de Nacimiento
          </label>
          <div className="flex items-center gap-2 text-slate-900">
            <Calendar className="w-4 h-4 text-slate-400" />
            {employee.date_of_birth
              ? new Date(employee.date_of_birth).toLocaleDateString('es-ES')
              : 'No especificada'}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Información Organizacional</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Puesto
            </label>
            <div className="flex items-center gap-2 text-slate-900">
              <Briefcase className="w-4 h-4 text-slate-400" />
              {employee.position?.title || 'No asignado'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Unidad de Negocio
            </label>
            <div className="flex items-center gap-2 text-slate-900">
              <Building2 className="w-4 h-4 text-slate-400" />
              {employee.business_unit?.name || 'No asignada'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Jefe Directo
            </label>
            <div className="flex items-center gap-2 text-slate-900">
              <User className="w-4 h-4 text-slate-400" />
              {employee.direct_manager
                ? `${employee.direct_manager.first_name} ${employee.direct_manager.last_name}`
                : 'No asignado'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Estado
            </label>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              employee.status === 'active'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {employee.status === 'active' ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContractsTab({ employeeId }: { employeeId: string }) {
  return <div className="p-6 text-slate-600">Los contratos del empleado se mostrarán aquí.</div>;
}

function DocumentsTab({ employeeId }: { employeeId: string }) {
  return <div className="p-6 text-slate-600">Los documentos del empleado se mostrarán aquí.</div>;
}

function HistoryTab({ employeeId }: { employeeId: string }) {
  return <div className="p-6 text-slate-600">El historial laboral del empleado se mostrará aquí.</div>;
}
