import { useState, useEffect } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  User, Briefcase, FileText, History, Mail, Phone, MapPin, Calendar,
  Building2, DollarSign, ArrowLeft, Edit2, Save, X, Plus, Upload, Download,
  Trash2, AlertCircle, MoreVertical, UserX, FileCheck, GraduationCap, Heart, CreditCard
} from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import { useToast } from '../../hooks/useToast';
import { replaceContractVariables, EmployeeContractData } from '../../lib/contractTemplates';
import AddEmployeeWizard from './AddEmployeeWizard';

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
  address_country_iso3: string | null;
  address_state: string | null;
  address_postal_code: string | null;
  national_id: string | null;
  gender_id: string | null;
  document_type_id: string | null;
  salary: number | null;
  employment_type_id: string | null;
  academic_level_id: string | null;
  educational_institution_id: string | null;
  field_of_study_id: string | null;
  graduation_year: string | null;
  certifications: string | null;
  health_card_number: string | null;
  health_card_expiry: string | null;
  bank_id: string | null;
  bank_account_number: string | null;
  bank_account_type_id: string | null;
  bank_routing_number: string | null;
  emergency_contact_name: string | null;
  emergency_contact_relationship: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_phone_alt: string | null;
  work_location_id: string | null;
  position: { id: string; title: string; code: string } | null;
  department: { id: string; name: string; code: string } | null;
  direct_manager: { id: string; first_name: string; last_name: string } | null;
  gender: { id: string; name: string } | null;
  document_type: { id: string; name: string; code: string } | null;
  employment_type: { id: string; name: string } | null;
  academic_level: { id: string; name: string } | null;
  educational_institution: { id: string; name: string } | null;
  field_of_study: { id: string; name: string } | null;
  work_location_obj: { id: string; name: string } | null;
  bank: { id: string; name: string; country: string } | null;
  bank_account_type: { id: string; name: string } | null;
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
  const [showEditModal, setShowEditModal] = useState(false);
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
          department:departments(id, name, code),
          gender:genders(id, name),
          document_type:document_types(id, name, code),
          employment_type:employment_types(id, name),
          academic_level:academic_levels(id, name),
          educational_institution:educational_institutions(id, name),
          field_of_study:fields_of_study(id, name),
          work_location_obj:work_locations(id, name),
          bank:banks(id, name, country),
          bank_account_type:bank_account_types(id, name)
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
        department: employee.department?.name,
        employmentType: employee.employment_type?.name || 'Tiempo Completo',
        hireDate: new Date(employee.hire_date).toLocaleDateString('es-ES'),
      };

      const contractContent = replaceContractVariables(template.content, contractData);

      const { data: existingContracts } = await supabase
        .from('contract_versions')
        .select('version')
        .eq('employee_id', employee.id)
        .order('version', { ascending: false })
        .limit(1);

      const nextVersion = existingContracts && existingContracts.length > 0
        ? existingContracts[0].version + 1
        : 1;

      const { data: authData } = await supabase.auth.getUser();

      const { error: saveError } = await supabase
        .from('contract_versions')
        .insert({
          company_id: selectedCompanyId,
          employee_id: employee.id,
          contract_template_id: selectedTemplate,
          version: nextVersion,
          content: contractContent,
          generated_by: authData.user?.id,
          status: 'draft',
          effective_date: employee.hire_date
        });

      if (saveError) {
        console.error('Error saving contract:', saveError);
        toast.error('Error al guardar el contrato');
      } else {
        toast.success(`Contrato versión ${nextVersion} generado y guardado`);
      }

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
                    setShowEditModal(true);
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
                  {employee.work_location_obj?.name || employee.work_location || 'No especificada'}
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

      <AddEmployeeWizard
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => {
          setShowEditModal(false);
          loadEmployee();
        }}
        editMode={true}
        employeeToEdit={employee}
      />
    </div>
  );
}

function GeneralTab({ employee, onRefresh }: { employee: Employee; onRefresh: () => void }) {
  const toast = useToast();
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingEducation, setEditingEducation] = useState(false);
  const [editingHealth, setEditingHealth] = useState(false);
  const [editingBanking, setEditingBanking] = useState(false);
  const [editingEmergency, setEditingEmergency] = useState(false);

  const [personalData, setPersonalData] = useState({
    phone: employee.phone || '',
    mobile: employee.mobile || '',
    address: employee.address_street || '',
    city: employee.address_city || '',
    country: employee.address_country || '',
    nationalId: employee.national_id || '',
    gender: employee.gender?.name || '',
    birthDate: employee.date_of_birth || ''
  });

  const [educationData, setEducationData] = useState({
    educationLevel: employee.academic_level?.name || '',
    institution: employee.educational_institution?.name || '',
    fieldOfStudy: employee.field_of_study?.name || '',
    graduationYear: employee.graduation_year || '',
    certifications: employee.certifications || ''
  });

  const [healthData, setHealthData] = useState({
    cardNumber: employee.health_card_number || '',
    cardExpiry: employee.health_card_expiry || ''
  });

  const [bankingData, setBankingData] = useState({
    bankId: employee.bank_id || '',
    accountNumber: employee.bank_account_number || '',
    bankAccountTypeId: employee.bank_account_type_id || '',
    routingNumber: employee.bank_routing_number || ''
  });

  const [emergencyData, setEmergencyData] = useState({
    contactName: employee.emergency_contact_name || '',
    relationship: employee.emergency_contact_relationship || '',
    phone: employee.emergency_contact_phone || '',
    alternatePhone: employee.emergency_contact_phone_alt || ''
  });

  const handleSavePersonal = async () => {
    try {
      const { error } = await supabase
        .from('employees')
        .update({
          phone: personalData.phone,
          mobile: personalData.mobile,
          address_street: personalData.address,
          address_city: personalData.city,
          address_country: personalData.country,
          national_id: personalData.nationalId,
          gender: personalData.gender,
          date_of_birth: personalData.birthDate || null
        })
        .eq('id', employee.id);

      if (error) throw error;
      toast.success('Información personal actualizada');
      setEditingPersonal(false);
      onRefresh();
    } catch (error) {
      console.error('Error updating personal info:', error);
      toast.error('Error al actualizar la información personal');
    }
  };

  const handleSaveEducation = async () => {
    try {
      const { error } = await supabase
        .from('employees')
        .update({
          education_level: educationData.educationLevel,
          institution: educationData.institution,
          field_of_study: educationData.fieldOfStudy,
          graduation_year: educationData.graduationYear,
          certifications: educationData.certifications
        })
        .eq('id', employee.id);

      if (error) throw error;
      toast.success('Información académica actualizada');
      setEditingEducation(false);
      onRefresh();
    } catch (error) {
      console.error('Error updating education:', error);
      toast.error('Error al actualizar la información académica');
    }
  };

  const handleSaveHealth = async () => {
    try {
      const { error } = await supabase
        .from('employees')
        .update({
          health_card_number: healthData.cardNumber,
          health_card_expiry: healthData.cardExpiry || null
        })
        .eq('id', employee.id);

      if (error) throw error;
      toast.success('Información de salud actualizada');
      setEditingHealth(false);
      onRefresh();
    } catch (error) {
      console.error('Error updating health:', error);
      toast.error('Error al actualizar la información de salud');
    }
  };

  const handleSaveBanking = async () => {
    try {
      const { error } = await supabase
        .from('employees')
        .update({
          bank_id: bankingData.bankId || null,
          bank_account_number: bankingData.accountNumber,
          bank_account_type_id: bankingData.bankAccountTypeId || null,
          bank_routing_number: bankingData.routingNumber
        })
        .eq('id', employee.id);

      if (error) throw error;
      toast.success('Información bancaria actualizada');
      setEditingBanking(false);
      onRefresh();
    } catch (error) {
      console.error('Error updating banking:', error);
      toast.error('Error al actualizar la información bancaria');
    }
  };

  const handleSaveEmergency = async () => {
    try {
      const { error } = await supabase
        .from('employees')
        .update({
          emergency_contact_name: emergencyData.contactName,
          emergency_contact_relationship: emergencyData.relationship,
          emergency_contact_phone: emergencyData.phone,
          emergency_contact_phone_alt: emergencyData.alternatePhone
        })
        .eq('id', employee.id);

      if (error) throw error;
      toast.success('Contacto de emergencia actualizado');
      setEditingEmergency(false);
      onRefresh();
    } catch (error) {
      console.error('Error updating emergency contact:', error);
      toast.error('Error al actualizar el contacto de emergencia');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Información Personal</h3>
        {!editingPersonal ? (
          <Button variant="outline" onClick={() => setEditingPersonal(true)}>
            <Edit2 className="w-4 h-4 mr-2" />
            Editar
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditingPersonal(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSavePersonal}>
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
          {editingPersonal ? (
            <Input
              value={personalData.phone}
              onChange={(e) => setPersonalData({ ...personalData, phone: e.target.value })}
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
          {editingPersonal ? (
            <Input
              value={personalData.mobile}
              onChange={(e) => setPersonalData({ ...personalData, mobile: e.target.value })}
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
          {editingPersonal ? (
            <Input
              value={personalData.address}
              onChange={(e) => setPersonalData({ ...personalData, address: e.target.value })}
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
          {editingPersonal ? (
            <Input
              value={personalData.city}
              onChange={(e) => setPersonalData({ ...personalData, city: e.target.value })}
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
          {editingPersonal ? (
            <Input
              type="date"
              value={personalData.birthDate}
              onChange={(e) => setPersonalData({ ...personalData, birthDate: e.target.value })}
            />
          ) : (
            <div className="flex items-center gap-2 text-slate-900">
              <Calendar className="w-4 h-4 text-slate-400" />
              {employee.date_of_birth
                ? new Date(employee.date_of_birth).toLocaleDateString('es-ES')
                : 'No especificada'}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Género
          </label>
          {editingPersonal ? (
            <Input
              value={personalData.gender}
              onChange={(e) => setPersonalData({ ...personalData, gender: e.target.value })}
            />
          ) : (
            <div className="text-slate-900">
              {employee.gender?.name || 'No especificado'}
            </div>
          )}
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
              Departamento
            </label>
            <div className="flex items-center gap-2 text-slate-900">
              <Building2 className="w-4 h-4 text-slate-400" />
              {employee.department?.name || 'No asignado'}
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

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tipo de Empleo
            </label>
            <div className="flex items-center gap-2 text-slate-900">
              <Briefcase className="w-4 h-4 text-slate-400" />
              {employee.employment_type?.name || 'No especificado'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Salario Mensual
            </label>
            <div className="flex items-center gap-2 text-slate-900">
              <DollarSign className="w-4 h-4 text-slate-400" />
              {employee.salary ? `$${employee.salary.toLocaleString()}` : 'No especificado'}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Información Adicional</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Cédula/ID Nacional
            </label>
            <div className="text-slate-900">
              {employee.national_id || 'No especificado'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Género
            </label>
            <div className="text-slate-900">
              {employee.gender?.name || 'No especificado'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              País
            </label>
            <div className="text-slate-900">
              {employee.address_country || 'No especificado'}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Información Académica</h3>
          {!editingEducation ? (
            <Button variant="outline" size="sm" onClick={() => setEditingEducation(true)}>
              <Edit2 className="w-4 h-4 mr-2" />
              Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditingEducation(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSaveEducation}>
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </Button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nivel Académico
            </label>
            <div className="flex items-center gap-2 text-slate-900">
              <GraduationCap className="w-4 h-4 text-slate-400" />
              {employee.academic_level?.name || 'No especificado'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Institución
            </label>
            <div className="text-slate-900">
              {employee.educational_institution?.name || 'No especificada'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Campo de Estudio
            </label>
            <div className="text-slate-900">
              {employee.field_of_study?.name || 'No especificado'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Año de Graduación
            </label>
            <div className="text-slate-900">
              {employee.graduation_year || 'No especificado'}
            </div>
          </div>

          {employee.certifications && (
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Certificaciones
              </label>
              <div className="text-slate-900">
                {employee.certifications}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Información de Salud</h3>
          {!editingHealth ? (
            <Button variant="outline" size="sm" onClick={() => setEditingHealth(true)}>
              <Edit2 className="w-4 h-4 mr-2" />
              Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditingHealth(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSaveHealth}>
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </Button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Número de Tarjeta de Salud
            </label>
            <div className="flex items-center gap-2 text-slate-900">
              <Heart className="w-4 h-4 text-slate-400" />
              {employee.health_card_number || 'No especificado'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Fecha de Vencimiento
            </label>
            <div className="flex items-center gap-2 text-slate-900">
              <Calendar className="w-4 h-4 text-slate-400" />
              {employee.health_card_expiry
                ? new Date(employee.health_card_expiry).toLocaleDateString('es-ES')
                : 'No especificada'}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Información Bancaria</h3>
          {!editingBanking ? (
            <Button variant="outline" size="sm" onClick={() => setEditingBanking(true)}>
              <Edit2 className="w-4 h-4 mr-2" />
              Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditingBanking(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSaveBanking}>
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </Button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Banco
            </label>
            <div className="flex items-center gap-2 text-slate-900">
              <CreditCard className="w-4 h-4 text-slate-400" />
              {employee.bank ? `${employee.bank.name} (${employee.bank.country})` : 'No especificado'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Número de Cuenta
            </label>
            <div className="text-slate-900">
              {employee.bank_account_number || 'No especificado'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tipo de Cuenta
            </label>
            <div className="text-slate-900">
              {employee.bank_account_type?.name || 'No especificado'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Código de Ruta
            </label>
            <div className="text-slate-900">
              {employee.bank_routing_number || 'No especificado'}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Contacto de Emergencia</h3>
          {!editingEmergency ? (
            <Button variant="outline" size="sm" onClick={() => setEditingEmergency(true)}>
              <Edit2 className="w-4 h-4 mr-2" />
              Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditingEmergency(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSaveEmergency}>
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </Button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nombre
            </label>
            <div className="flex items-center gap-2 text-slate-900">
              <User className="w-4 h-4 text-slate-400" />
              {employee.emergency_contact_name || 'No especificado'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Relación
            </label>
            <div className="text-slate-900">
              {employee.emergency_contact_relationship || 'No especificada'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Teléfono Principal
            </label>
            <div className="flex items-center gap-2 text-slate-900">
              <Phone className="w-4 h-4 text-slate-400" />
              {employee.emergency_contact_phone || 'No especificado'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Teléfono Alternativo
            </label>
            <div className="flex items-center gap-2 text-slate-900">
              <Phone className="w-4 h-4 text-slate-400" />
              {employee.emergency_contact_phone_alt || 'No especificado'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContractsTab({ employeeId }: { employeeId: string }) {
  const { selectedCompanyId } = useCompany();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<any>(null);

  useEffect(() => {
    loadContracts();
  }, [employeeId]);

  const loadContracts = async () => {
    if (!selectedCompanyId) return;

    try {
      const { data, error } = await supabase
        .from('contract_versions')
        .select(`
          *,
          contract_template:contract_templates(name)
        `)
        .eq('employee_id', employeeId)
        .eq('company_id', selectedCompanyId)
        .order('version', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error('Error loading contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      draft: { label: 'Borrador', className: 'bg-slate-100 text-slate-700' },
      active: { label: 'Activo', className: 'bg-green-100 text-green-700' },
      superseded: { label: 'Superado', className: 'bg-amber-100 text-amber-700' },
      terminated: { label: 'Terminado', className: 'bg-red-100 text-red-700' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-slate-600">Cargando contratos...</p>
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="p-6 text-center">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600">No hay contratos generados para este empleado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {contracts.map((contract) => (
        <div
          key={contract.id}
          className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="font-semibold text-slate-900">
                  {contract.contract_template?.name || 'Contrato'} - Versión {contract.version}
                </h4>
                {getStatusBadge(contract.status)}
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-slate-600">
                <div>
                  <span className="font-medium">Generado:</span>{' '}
                  {new Date(contract.generated_at).toLocaleString('es-ES')}
                </div>
                {contract.effective_date && (
                  <div>
                    <span className="font-medium">Fecha efectiva:</span>{' '}
                    {new Date(contract.effective_date).toLocaleDateString('es-ES')}
                  </div>
                )}
                {contract.signed_at && (
                  <div>
                    <span className="font-medium">Firmado:</span>{' '}
                    {new Date(contract.signed_at).toLocaleString('es-ES')}
                  </div>
                )}
                {contract.expiry_date && (
                  <div>
                    <span className="font-medium">Vencimiento:</span>{' '}
                    {new Date(contract.expiry_date).toLocaleDateString('es-ES')}
                  </div>
                )}
              </div>
              {contract.notes && (
                <div className="mt-2 text-sm text-slate-600">
                  <span className="font-medium">Notas:</span> {contract.notes}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedContract(contract)}
              >
                <FileText className="w-4 h-4 mr-1" />
                Ver
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    printWindow.document.write(`
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <title>Contrato v${contract.version}</title>
                          <meta charset="utf-8">
                          <style>
                            body {
                              font-family: Arial, sans-serif;
                              line-height: 1.6;
                              padding: 40px;
                              max-width: 800px;
                              margin: 0 auto;
                            }
                            h1 { font-size: 20px; margin-bottom: 20px; }
                            p { margin-bottom: 10px; white-space: pre-line; }
                            @media print {
                              body { padding: 20px; }
                            }
                          </style>
                        </head>
                        <body>
                          <h1>${contract.contract_template?.name || 'Contrato'} - Versión ${contract.version}</h1>
                          <div>${contract.content.split('\n').map((line: string) => `<p>${line}</p>`).join('')}</div>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                    printWindow.focus();
                    setTimeout(() => {
                      printWindow.print();
                    }, 250);
                  }
                }}
              >
                <Download className="w-4 h-4 mr-1" />
                Descargar PDF
              </Button>
            </div>
          </div>
        </div>
      ))}

      {selectedContract && (
        <Modal
          isOpen={!!selectedContract}
          onClose={() => setSelectedContract(null)}
          title={`${selectedContract.contract_template?.name || 'Contrato'} - Versión ${selectedContract.version}`}
        >
          <div className="space-y-4">
            <div className="bg-white border-2 border-slate-200 rounded-xl p-6 max-h-96 overflow-y-auto">
              <div className="text-sm whitespace-pre-line font-sans leading-relaxed">
                {selectedContract.content}
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setSelectedContract(null)}
                className="flex-1"
              >
                Cerrar
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    printWindow.document.write(`
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <title>Contrato v${selectedContract.version}</title>
                          <meta charset="utf-8">
                          <style>
                            body {
                              font-family: Arial, sans-serif;
                              line-height: 1.6;
                              padding: 40px;
                              max-width: 800px;
                              margin: 0 auto;
                            }
                            h1 { font-size: 20px; margin-bottom: 20px; }
                            p { margin-bottom: 10px; white-space: pre-line; }
                            @media print {
                              body { padding: 20px; }
                            }
                          </style>
                        </head>
                        <body>
                          <h1>${selectedContract.contract_template?.name || 'Contrato'} - Versión ${selectedContract.version}</h1>
                          <div>${selectedContract.content.split('\n').map((line: string) => `<p>${line}</p>`).join('')}</div>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                    printWindow.focus();
                    setTimeout(() => {
                      printWindow.print();
                    }, 250);
                  }
                }}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar PDF
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function DocumentsTab({ employeeId }: { employeeId: string }) {
  const { selectedCompanyId } = useCompany();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadDocuments();
  }, [employeeId]);

  const loadDocuments = async () => {
    if (!selectedCompanyId) return;

    try {
      const { data, error } = await supabase.storage
        .from('employee-documents')
        .list(`${selectedCompanyId}/${employeeId}`, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Error al cargar documentos');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = `${selectedCompanyId}/${employeeId}/${Date.now()}_${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from('employee-documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;
      }

      toast.success('Documentos subidos exitosamente');
      loadDocuments();
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast.error('Error al subir documentos');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDownload = async (fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('employee-documents')
        .download(`${selectedCompanyId}/${employeeId}/${fileName}`);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName.split('_').slice(1).join('_');
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Error al descargar documento');
    }
  };

  const handleDelete = async (fileName: string) => {
    if (!confirm('¿Está seguro que desea eliminar este documento?')) return;

    try {
      const { error } = await supabase.storage
        .from('employee-documents')
        .remove([`${selectedCompanyId}/${employeeId}/${fileName}`]);

      if (error) throw error;

      toast.success('Documento eliminado exitosamente');
      loadDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Error al eliminar documento');
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-slate-600">Cargando documentos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Documentos del Empleado</h3>
        <div>
          <input
            type="file"
            id="doc-upload"
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
          <label
            htmlFor="doc-upload"
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer ${
              uploading
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Subiendo...' : 'Subir Documentos'}
          </label>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="p-6 text-center border-2 border-dashed border-slate-300 rounded-lg">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">No hay documentos cargados para este empleado.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.name}
              className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileText className="w-8 h-8 text-blue-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {doc.name.split('_').slice(1).join('_')}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{(doc.metadata.size / 1024).toFixed(2)} KB</span>
                    <span>•</span>
                    <span>{new Date(doc.created_at).toLocaleDateString('es-ES')}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(doc.name)}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Descargar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(doc.name)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Eliminar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryTab({ employeeId }: { employeeId: string }) {
  const { selectedCompanyId } = useCompany();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [employeeId]);

  const loadHistory = async () => {
    if (!selectedCompanyId) return;

    try {
      const { data, error } = await supabase
        .from('employee_history')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('company_id', selectedCompanyId)
        .order('change_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'position_change':
      case 'promotion':
      case 'demotion':
        return <Briefcase className="w-5 h-5 text-blue-600" />;
      case 'department_change':
      case 'transfer':
        return <Building2 className="w-5 h-5 text-purple-600" />;
      case 'salary_change':
        return <DollarSign className="w-5 h-5 text-green-600" />;
      case 'status_change':
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      case 'manager_change':
        return <User className="w-5 h-5 text-indigo-600" />;
      case 'location_change':
        return <MapPin className="w-5 h-5 text-red-600" />;
      default:
        return <History className="w-5 h-5 text-slate-600" />;
    }
  };

  const getChangeTypeLabel = (changeType: string) => {
    const labels: Record<string, string> = {
      position_change: 'Cambio de Puesto',
      department_change: 'Cambio de Departamento',
      salary_change: 'Cambio de Salario',
      status_change: 'Cambio de Estado',
      manager_change: 'Cambio de Supervisor',
      location_change: 'Cambio de Ubicación',
      promotion: 'Promoción',
      demotion: 'Descenso',
      transfer: 'Transferencia',
      other: 'Otro'
    };
    return labels[changeType] || changeType;
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-slate-600">Cargando historial...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="p-6 text-center">
        <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600">No hay registros de historial para este empleado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Historial Laboral</h3>

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200"></div>

        <div className="space-y-6">
          {history.map((record) => (
            <div key={record.id} className="relative pl-12">
              <div className="absolute left-0 top-0 w-8 h-8 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center">
                {getChangeTypeIcon(record.change_type)}
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-slate-900">
                      {getChangeTypeLabel(record.change_type)}
                    </h4>
                    <p className="text-sm text-slate-500">
                      {new Date(record.change_date).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {record.old_value_display && record.new_value_display && (
                  <div className="flex items-center gap-3 text-sm">
                    <span className="px-3 py-1 bg-red-50 text-red-700 rounded-lg">
                      {record.old_value_display}
                    </span>
                    <span className="text-slate-400">→</span>
                    <span className="px-3 py-1 bg-green-50 text-green-700 rounded-lg">
                      {record.new_value_display}
                    </span>
                  </div>
                )}

                {record.notes && (
                  <p className="mt-2 text-sm text-slate-600 bg-slate-50 p-2 rounded">
                    {record.notes}
                  </p>
                )}

                <p className="mt-2 text-xs text-slate-400">
                  Registrado el {new Date(record.created_at).toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
