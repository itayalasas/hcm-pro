import { useState, useEffect } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  User, Briefcase, FileText, History, Mail, Phone, MapPin, Calendar,
  Building2, DollarSign, ArrowLeft, Edit2, Save, X, Plus, Upload, Download,
  Trash2, AlertCircle
} from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

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
  position: { id: string; title: string; code: string } | null;
  business_unit: { id: string; name: string; code: string } | null;
  direct_manager: { id: string; first_name: string; last_name: string } | null;
  personal_data: {
    date_of_birth: string | null;
    phone: string | null;
    mobile: string | null;
    address: string | null;
    city: string | null;
  } | null;
}

interface EmployeeProfileProps {
  employeeId: string;
  onBack: () => void;
}

type TabType = 'general' | 'contracts' | 'documents' | 'history';

export default function EmployeeProfile({ employeeId, onBack }: EmployeeProfileProps) {
  const { selectedCompanyId } = useCompany();
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    loadEmployee();
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
          business_unit:business_units(id, name, code),
          direct_manager:employees!employees_direct_manager_id_fkey(id, first_name, last_name),
          personal_data:employee_personal_data(*)
        `)
        .eq('id', employeeId)
        .eq('company_id', selectedCompanyId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setEmployee(data as unknown as Employee);
      }
    } catch (error) {
      console.error('Error loading employee:', error);
    } finally {
      setLoading(false);
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
    </div>
  );
}

function GeneralTab({ employee, onRefresh }: { employee: Employee; onRefresh: () => void }) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    phone: employee.personal_data?.phone || '',
    mobile: employee.personal_data?.mobile || '',
    address: employee.personal_data?.address || '',
    city: employee.personal_data?.city || '',
  });

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('employee_personal_data')
        .upsert({
          employee_id: employee.id,
          ...formData,
        });

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
              {employee.personal_data?.phone || 'No especificado'}
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
              {employee.personal_data?.mobile || 'No especificado'}
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
              {employee.personal_data?.address || 'No especificada'}
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
              {employee.personal_data?.city || 'No especificada'}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Fecha de Nacimiento
          </label>
          <div className="flex items-center gap-2 text-slate-900">
            <Calendar className="w-4 h-4 text-slate-400" />
            {employee.personal_data?.date_of_birth
              ? new Date(employee.personal_data.date_of_birth).toLocaleDateString('es-ES')
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
  const { selectedCompanyId } = useCompany();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContract, setNewContract] = useState({
    contract_type: 'indefinido',
    contract_number: '',
    start_date: '',
    end_date: '',
    work_schedule: 'full_time',
    weekly_hours: '40',
    salary_amount: '',
    notes: '',
  });

  useEffect(() => {
    loadContracts();
  }, [employeeId]);

  const loadContracts = async () => {
    if (!selectedCompanyId || !employeeId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employee_contracts')
        .select(`
          *,
          position:positions(title, code),
          currency:currencies(symbol, code)
        `)
        .eq('employee_id', employeeId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error('Error loading contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContract = async () => {
    if (!selectedCompanyId || !employeeId || !newContract.start_date) {
      alert('Por favor complete los campos requeridos');
      return;
    }

    try {
      await supabase
        .from('employee_contracts')
        .update({ is_current: false })
        .eq('employee_id', employeeId);

      const { error } = await supabase.from('employee_contracts').insert({
        employee_id: employeeId,
        company_id: selectedCompanyId,
        ...newContract,
        end_date: newContract.end_date || null,
        salary_amount: newContract.salary_amount ? parseFloat(newContract.salary_amount) : null,
        weekly_hours: newContract.weekly_hours ? parseFloat(newContract.weekly_hours) : null,
        is_current: true,
      });

      if (error) throw error;

      setShowAddModal(false);
      setNewContract({
        contract_type: 'indefinido',
        contract_number: '',
        start_date: '',
        end_date: '',
        work_schedule: 'full_time',
        weekly_hours: '40',
        salary_amount: '',
        notes: '',
      });
      loadContracts();
    } catch (error) {
      console.error('Error adding contract:', error);
      alert('Error al agregar el contrato');
    }
  };

  const getContractTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'indefinido':
        return 'bg-green-100 text-green-700';
      case 'temporal':
        return 'bg-blue-100 text-blue-700';
      case 'practicas':
        return 'bg-amber-100 text-amber-700';
      case 'freelance':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getContractTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      indefinido: 'Indefinido',
      temporal: 'Temporal',
      practicas: 'Prácticas',
      freelance: 'Freelance',
      otros: 'Otros',
    };
    return labels[type.toLowerCase()] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Contratos</h3>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Contrato
        </Button>
      </div>

      {contracts.length === 0 ? (
        <div className="text-center py-12">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">No hay contratos registrados</p>
          <Button variant="outline" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Crear Primer Contrato
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map((contract) => (
            <div
              key={contract.id}
              className={`bg-white border-2 rounded-xl p-6 transition-all ${
                contract.is_current
                  ? 'border-blue-500 shadow-lg'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-slate-900">
                        {contract.contract_number || 'Sin número'}
                      </h4>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getContractTypeColor(contract.contract_type)}`}>
                        {getContractTypeLabel(contract.contract_type)}
                      </span>
                      {contract.is_current && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                          VIGENTE
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">
                      {contract.work_schedule === 'full_time' ? 'Tiempo Completo' : 'Tiempo Parcial'}
                      {contract.weekly_hours && ` • ${contract.weekly_hours}h/semana`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Fecha de Inicio</div>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {new Date(contract.start_date).toLocaleDateString('es-ES')}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-500 mb-1">Fecha de Fin</div>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {contract.end_date
                      ? new Date(contract.end_date).toLocaleDateString('es-ES')
                      : 'Indefinido'}
                  </div>
                </div>

                {contract.position && (
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Puesto</div>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      <Briefcase className="w-4 h-4 text-slate-400" />
                      {contract.position.title}
                    </div>
                  </div>
                )}

                {contract.salary_amount && (
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Salario</div>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      <DollarSign className="w-4 h-4 text-slate-400" />
                      {contract.currency?.symbol || '$'}
                      {contract.salary_amount.toLocaleString('es-ES', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                )}
              </div>

              {contract.notes && (
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-600">{contract.notes}</p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 mt-4">
                <p className="text-xs text-slate-400">
                  Creado: {new Date(contract.created_at).toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Nuevo Contrato">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tipo de Contrato *
              </label>
              <select
                value={newContract.contract_type}
                onChange={(e) => setNewContract({ ...newContract, contract_type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="indefinido">Indefinido</option>
                <option value="temporal">Temporal</option>
                <option value="practicas">Prácticas</option>
                <option value="freelance">Freelance</option>
                <option value="otros">Otros</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Número de Contrato
              </label>
              <Input
                value={newContract.contract_number}
                onChange={(e) => setNewContract({ ...newContract, contract_number: e.target.value })}
                placeholder="CTR-2024-001"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Fecha de Inicio *
              </label>
              <Input
                type="date"
                value={newContract.start_date}
                onChange={(e) => setNewContract({ ...newContract, start_date: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Fecha de Fin
              </label>
              <Input
                type="date"
                value={newContract.end_date}
                onChange={(e) => setNewContract({ ...newContract, end_date: e.target.value })}
              />
              <p className="text-xs text-slate-500 mt-1">Dejar vacío para indefinido</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Jornada Laboral
              </label>
              <select
                value={newContract.work_schedule}
                onChange={(e) => setNewContract({ ...newContract, work_schedule: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="full_time">Tiempo Completo</option>
                <option value="part_time">Tiempo Parcial</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Horas Semanales
              </label>
              <Input
                type="number"
                value={newContract.weekly_hours}
                onChange={(e) => setNewContract({ ...newContract, weekly_hours: e.target.value })}
                placeholder="40"
                min="1"
                max="168"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Salario
            </label>
            <Input
              type="number"
              value={newContract.salary_amount}
              onChange={(e) => setNewContract({ ...newContract, salary_amount: e.target.value })}
              placeholder="50000.00"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notas
            </label>
            <textarea
              value={newContract.notes}
              onChange={(e) => setNewContract({ ...newContract, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Notas adicionales sobre el contrato..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleAddContract} className="flex-1">
              Crear Contrato
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function DocumentsTab({ employeeId }: { employeeId: string }) {
  const { selectedCompanyId } = useCompany();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDocument, setNewDocument] = useState({
    document_type: 'contract',
    document_name: '',
    file_url: '',
    expiry_date: '',
    notes: '',
  });

  useEffect(() => {
    loadDocuments();
  }, [employeeId]);

  const loadDocuments = async () => {
    if (!selectedCompanyId || !employeeId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('company_id', selectedCompanyId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDocument = async () => {
    if (!selectedCompanyId || !employeeId || !newDocument.document_name) {
      alert('Por favor complete los campos requeridos');
      return;
    }

    try {
      const { error } = await supabase.from('employee_documents').insert({
        employee_id: employeeId,
        company_id: selectedCompanyId,
        uploaded_by: user?.id,
        ...newDocument,
        expiry_date: newDocument.expiry_date || null,
      });

      if (error) throw error;

      setShowAddModal(false);
      setNewDocument({
        document_type: 'contract',
        document_name: '',
        file_url: '',
        expiry_date: '',
        notes: '',
      });
      loadDocuments();
    } catch (error) {
      console.error('Error adding document:', error);
      alert('Error al agregar el documento');
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('¿Está seguro de eliminar este documento?')) return;

    try {
      const { error } = await supabase
        .from('employee_documents')
        .update({ is_active: false })
        .eq('id', documentId);

      if (error) throw error;
      loadDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error al eliminar el documento');
    }
  };

  const getDocumentTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'contract':
        return 'bg-blue-100 text-blue-700';
      case 'id':
        return 'bg-green-100 text-green-700';
      case 'certificate':
        return 'bg-purple-100 text-purple-700';
      case 'training':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      contract: 'Contrato',
      id: 'Identificación',
      certificate: 'Certificado',
      training: 'Capacitación',
      other: 'Otro',
    };
    return labels[type.toLowerCase()] || type;
  };

  const isExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
  };

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return expiry < today;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Documentos</h3>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar Documento
        </Button>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">No hay documentos registrados</p>
          <Button variant="outline" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Primer Documento
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-slate-900">{doc.document_name}</h4>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getDocumentTypeColor(doc.document_type)}`}>
                        {getDocumentTypeLabel(doc.document_type)}
                      </span>
                      {isExpired(doc.expiry_date) && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                          <AlertCircle className="w-3 h-3" />
                          Vencido
                        </span>
                      )}
                      {isExpiringSoon(doc.expiry_date) && !isExpired(doc.expiry_date) && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                          <AlertCircle className="w-3 h-3" />
                          Por vencer
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-slate-600">
                      {doc.expiry_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Vence: {new Date(doc.expiry_date).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>Agregado: {new Date(doc.created_at).toLocaleDateString('es-ES')}</span>
                      </div>
                      {doc.notes && (
                        <p className="mt-2 text-sm text-slate-600">{doc.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {doc.file_url && (
                    <button
                      onClick={() => window.open(doc.file_url, '_blank')}
                      className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Descargar"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Agregar Documento">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tipo de Documento *
            </label>
            <select
              value={newDocument.document_type}
              onChange={(e) => setNewDocument({ ...newDocument, document_type: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="contract">Contrato</option>
              <option value="id">Identificación</option>
              <option value="certificate">Certificado</option>
              <option value="training">Capacitación</option>
              <option value="other">Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nombre del Documento *
            </label>
            <Input
              value={newDocument.document_name}
              onChange={(e) => setNewDocument({ ...newDocument, document_name: e.target.value })}
              placeholder="Ej: Contrato Indefinido 2024"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              URL del Archivo
            </label>
            <Input
              value={newDocument.file_url}
              onChange={(e) => setNewDocument({ ...newDocument, file_url: e.target.value })}
              placeholder="https://..."
            />
            <p className="text-xs text-slate-500 mt-1">
              URL del documento almacenado (opcional)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Fecha de Vencimiento
            </label>
            <Input
              type="date"
              value={newDocument.expiry_date}
              onChange={(e) => setNewDocument({ ...newDocument, expiry_date: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notas
            </label>
            <textarea
              value={newDocument.notes}
              onChange={(e) => setNewDocument({ ...newDocument, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Notas adicionales..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleAddDocument} className="flex-1">
              Agregar
            </Button>
          </div>
        </div>
      </Modal>
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
    if (!selectedCompanyId || !employeeId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employee_work_history')
        .select(`
          *,
          position:positions(title),
          business_unit:business_units(name),
          manager:employees!employee_work_history_manager_id_fkey(first_name, last_name),
          currency:currencies(symbol, code)
        `)
        .eq('employee_id', employeeId)
        .eq('company_id', selectedCompanyId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error loading work history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChangeTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'hire':
        return 'bg-green-100 text-green-700';
      case 'promotion':
        return 'bg-blue-100 text-blue-700';
      case 'transfer':
        return 'bg-amber-100 text-amber-700';
      case 'demotion':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getChangeTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case 'hire':
        return 'Contratación';
      case 'promotion':
        return 'Promoción';
      case 'transfer':
        return 'Transferencia';
      case 'demotion':
        return 'Ajuste';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-600">No hay historial laboral registrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Historial de Cambios</h3>
        <span className="text-sm text-slate-500">{history.length} registros</span>
      </div>

      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-px bg-slate-200"></div>

        <div className="space-y-6">
          {history.map((entry, index) => (
            <div key={entry.id} className="relative pl-16">
              <div className="absolute left-5 w-6 h-6 bg-white border-4 border-blue-600 rounded-full"></div>

              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getChangeTypeColor(entry.change_type)}`}>
                      {getChangeTypeLabel(entry.change_type)}
                    </span>
                    <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                      <Calendar className="w-4 h-4" />
                      {new Date(entry.start_date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                      {entry.end_date && (
                        <>
                          <span>→</span>
                          {new Date(entry.end_date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </>
                      )}
                      {!entry.end_date && (
                        <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                          Actual
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-slate-900">
                      <Briefcase className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">{entry.position_title}</span>
                    </div>
                  </div>

                  {entry.business_unit_name && (
                    <div>
                      <div className="flex items-center gap-2 text-sm text-slate-900">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span>{entry.business_unit_name}</span>
                      </div>
                    </div>
                  )}

                  {entry.manager_name && (
                    <div>
                      <div className="flex items-center gap-2 text-sm text-slate-900">
                        <User className="w-4 h-4 text-slate-400" />
                        <span>{entry.manager_name}</span>
                      </div>
                    </div>
                  )}

                  {entry.salary_amount && (
                    <div>
                      <div className="flex items-center gap-2 text-sm text-slate-900">
                        <DollarSign className="w-4 h-4 text-slate-400" />
                        <span className="font-medium">
                          {entry.currency?.symbol || '$'}
                          {entry.salary_amount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {entry.notes && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <p className="text-sm text-slate-600">{entry.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
