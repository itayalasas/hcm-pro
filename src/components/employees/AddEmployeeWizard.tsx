import { useState, useEffect } from 'react';
import { User, GraduationCap, Briefcase, FileText, CheckCircle, Heart, CreditCard, Phone, FileDown } from 'lucide-react';
import Modal from '../ui/Modal';
import StepWizard from '../ui/StepWizard';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Autocomplete from '../ui/Autocomplete';
import CountryCitySelector from '../ui/CountryCitySelector';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useToast } from '../../hooks/useToast';
import { replaceContractVariables, EmployeeContractData } from '../../lib/contractTemplates';

interface AddEmployeeWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface EmployeeData {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    birthDate: string;
    gender: string;
    nationalId: string;
    address: string;
    city: string;
    country: string;
    countryISO3: string;
  };
  education: {
    highestDegree: string;
    institution: string;
    fieldOfStudy: string;
    graduationYear: string;
    certifications: string;
  };
  employment: {
    employeeNumber: string;
    hireDate: string;
    department: string;
    position: string;
    employmentType: string;
    workLocation: string;
    salary: string;
    manager: string;
  };
  health: {
    cardNumber: string;
    cardExpiry: string;
    cardFile: File | null;
  };
  banking: {
    bankName: string;
    accountNumber: string;
    accountType: string;
    routingNumber: string;
  };
  emergency: {
    contactName: string;
    relationship: string;
    phone: string;
    phoneAlt: string;
  };
  documents: {
    hasContract: boolean;
    hasIDCopy: boolean;
    hasBackground: boolean;
    notes: string;
  };
}

const steps = [
  { id: 'personal', title: 'Información Personal', description: 'Datos básicos del empleado' },
  { id: 'education', title: 'Educación', description: 'Formación académica' },
  { id: 'employment', title: 'Información Laboral', description: 'Detalles del puesto' },
  { id: 'health', title: 'Información de Salud', description: 'Carnet de salud' },
  { id: 'banking', title: 'Datos Bancarios', description: 'Información para pagos' },
  { id: 'emergency', title: 'Contacto de Emergencia', description: 'Persona a contactar' },
  { id: 'documents', title: 'Documentos', description: 'Documentación requerida' },
  { id: 'review', title: 'Contrato', description: 'Generar y descargar contrato' }
];

export default function AddEmployeeWizard({ isOpen, onClose, onSuccess }: AddEmployeeWizardProps) {
  const { selectedCompanyId } = useCompany();
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [contractTemplate, setContractTemplate] = useState<string>('');

  const [companyData, setCompanyData] = useState<{
    name: string;
    address: string;
    country: string;
  }>({ name: '', address: '', country: '' });

  const [academicLevels, setAcademicLevels] = useState<Array<{id: string, name: string}>>([]);
  const [institutions, setInstitutions] = useState<Array<{id: string, name: string}>>([]);
  const [fieldsOfStudy, setFieldsOfStudy] = useState<Array<{id: string, name: string}>>([]);
  const [departments, setDepartments] = useState<Array<{id: string, name: string}>>([]);
  const [positions, setPositions] = useState<Array<{id: string, name: string}>>([]);
  const [employmentTypes, setEmploymentTypes] = useState<Array<{id: string, name: string}>>([]);
  const [workLocations, setWorkLocations] = useState<Array<{id: string, name: string}>>([]);
  const [managers, setManagers] = useState<Array<{id: string, name: string}>>([]);
  const [employeeData, setEmployeeData] = useState<EmployeeData>({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      birthDate: '',
      gender: '',
      nationalId: '',
      address: '',
      city: '',
      country: '',
      countryISO3: ''
    },
    education: {
      highestDegree: '',
      institution: '',
      fieldOfStudy: '',
      graduationYear: '',
      certifications: ''
    },
    employment: {
      employeeNumber: '',
      hireDate: '',
      department: '',
      position: '',
      employmentType: 'full-time',
      workLocation: '',
      salary: '',
      manager: ''
    },
    health: {
      cardNumber: '',
      cardExpiry: '',
      cardFile: null
    },
    banking: {
      bankName: '',
      accountNumber: '',
      accountType: '',
      routingNumber: ''
    },
    emergency: {
      contactName: '',
      relationship: '',
      phone: '',
      phoneAlt: ''
    },
    documents: {
      hasContract: false,
      hasIDCopy: false,
      hasBackground: false,
      notes: ''
    }
  });

  const validateCurrentStep = (): boolean => {
    const errors: string[] = [];

    switch (currentStep) {
      case 0: // Personal Info
        if (!employeeData.personalInfo.firstName.trim()) errors.push('Nombre es requerido');
        if (!employeeData.personalInfo.lastName.trim()) errors.push('Apellido es requerido');
        if (!employeeData.personalInfo.email.trim()) errors.push('Correo Electrónico es requerido');
        if (!employeeData.personalInfo.country.trim()) errors.push('País es requerido');
        break;
      case 1: // Education - No required fields
        break;
      case 2: // Employment
        if (!employeeData.employment.hireDate.trim()) errors.push('Fecha de Contratación es requerida');
        break;
      case 3: // Health - No required fields
        break;
      case 4: // Banking - No required fields
        break;
      case 5: // Emergency - No required fields
        break;
      case 6: // Documents - No required fields
        break;
    }

    setValidationErrors(errors);
    if (errors.length > 0) {
      toast.error(errors.join(', '));
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    if (validateCurrentStep() && currentStep < steps.length - 1) {
      setValidationErrors([]);
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);

      if (nextStep === 7) {
        await loadContractTemplate();
      }
    }
  };

  const loadContractTemplate = async () => {
    if (!selectedCompanyId) return;

    try {
      let positionId: string | null = null;

      if (employeeData.employment.position) {
        const { data: posData } = await supabase
          .from('positions')
          .select('id')
          .eq('company_id', selectedCompanyId)
          .eq('title', employeeData.employment.position)
          .maybeSingle();

        positionId = posData?.id || null;
      }

      const { data, error } = await supabase
        .from('contract_templates')
        .select('content')
        .eq('company_id', selectedCompanyId)
        .eq('is_active', true)
        .or(positionId ? `position_id.is.null,position_id.eq.${positionId}` : 'position_id.is.null')
        .order('position_id', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      const template = data?.content || 'No se encontró plantilla de contrato';
      const processedContract = replaceTemplateVariables(template);
      setContractTemplate(processedContract);
    } catch (error) {
      console.error('Error loading template:', error);
      setContractTemplate('Error al cargar la plantilla de contrato');
    }
  };

  const replaceTemplateVariables = (template: string): string => {
    const contractData: EmployeeContractData = {
      companyName: companyData.name,
      companyAddress: companyData.address,
      companyRepresentative: 'Representante Legal',
      representativeTitle: 'Director General',
      employeeName: `${employeeData.personalInfo.firstName} ${employeeData.personalInfo.lastName}`,
      employeeId: employeeData.personalInfo.nationalId,
      employeeAddress: employeeData.personalInfo.address,
      employeeCity: employeeData.personalInfo.city,
      employeeCountry: employeeData.personalInfo.country,
      position: employeeData.employment.position,
      department: employeeData.employment.department,
      employmentType: employeeData.employment.employmentType,
      hireDate: employeeData.employment.hireDate,
      salary: employeeData.employment.salary,
      bankName: employeeData.banking.bankName,
      accountNumber: employeeData.banking.accountNumber,
      accountType: employeeData.banking.accountType === 'checking' ? 'Cuenta Corriente' :
                   employeeData.banking.accountType === 'savings' ? 'Cuenta de Ahorros' : 'N/A',
      healthCardNumber: employeeData.health.cardNumber,
      healthCardExpiry: employeeData.health.cardExpiry,
      emergencyContact: employeeData.emergency.contactName,
      emergencyRelationship: employeeData.emergency.relationship,
      emergencyPhone: employeeData.emergency.phone,
    };

    return replaceContractVariables(template, contractData);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (!selectedCompanyId) {
        throw new Error('No hay empresa seleccionada');
      }

      let employeeNumber = employeeData.employment.employeeNumber;

      if (!employeeNumber) {
        const { data: generatedCode, error: codeError } = await supabase
          .rpc('generate_entity_code', {
            p_entity_type: 'employee',
            p_company_id: selectedCompanyId
          });

        if (codeError) throw codeError;
        employeeNumber = generatedCode;
      }

      const convertDateToISO = (dateStr: string) => {
        if (!dateStr) return null;
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const [day, month, year] = parts;
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        return dateStr;
      };

      const { error: employeeError, data: employeeRecord } = await supabase.from('employees').insert({
        company_id: selectedCompanyId,
        employee_number: employeeNumber,
        first_name: employeeData.personalInfo.firstName,
        last_name: employeeData.personalInfo.lastName,
        email: employeeData.personalInfo.email,
        address_street: employeeData.personalInfo.address,
        address_city: employeeData.personalInfo.city,
        address_country: employeeData.personalInfo.country,
        address_country_iso3: employeeData.personalInfo.countryISO3,
        hire_date: convertDateToISO(employeeData.employment.hireDate),
        work_location: employeeData.employment.workLocation,
        salary: employeeData.employment.salary ? parseFloat(employeeData.employment.salary) : null,
        employment_type: employeeData.employment.employmentType,
        health_card_number: employeeData.health.cardNumber,
        health_card_expiry: employeeData.health.cardExpiry ? convertDateToISO(employeeData.health.cardExpiry) : null,
        bank_name: employeeData.banking.bankName,
        bank_account_number: employeeData.banking.accountNumber,
        bank_account_type: employeeData.banking.accountType,
        bank_routing_number: employeeData.banking.routingNumber,
        emergency_contact_name: employeeData.emergency.contactName,
        emergency_contact_relationship: employeeData.emergency.relationship,
        emergency_contact_phone: employeeData.emergency.phone,
        emergency_contact_phone_alt: employeeData.emergency.alternatePhone,
        status: 'active'
      }).select().single();

      if (employeeError) throw employeeError;

      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating employee:', error);
      alert('Error al crear empleado. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(0);
    setEmployeeData({
      personalInfo: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        birthDate: '',
        gender: '',
        nationalId: '',
        address: '',
        city: '',
        country: 'México'
      },
      education: {
        highestDegree: '',
        institution: '',
        fieldOfStudy: '',
        graduationYear: '',
        certifications: ''
      },
      employment: {
        employeeNumber: '',
        hireDate: '',
        department: '',
        position: '',
        employmentType: 'full-time',
        workLocation: '',
        salary: '',
        manager: ''
      },
      health: {
        cardNumber: '',
        cardExpiry: '',
        cardFile: null
      },
      banking: {
        bankName: '',
        accountNumber: '',
        accountType: '',
        routingNumber: ''
      },
      emergency: {
        contactName: '',
        relationship: '',
        phone: '',
        phoneAlt: ''
      },
      documents: {
        hasContract: false,
        hasIDCopy: false,
        hasBackground: false,
        notes: ''
      }
    });
  };

  useEffect(() => {
    if (selectedCompanyId && isOpen) {
      loadCompanyData();
      loadMasterData();
    }
  }, [selectedCompanyId, isOpen]);

  useEffect(() => {
    if (employeeData.employment.department && selectedCompanyId) {
      loadManagersByDepartment(employeeData.employment.department);
    } else {
      setManagers([]);
    }
  }, [employeeData.employment.department, selectedCompanyId]);

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

  const loadMasterData = async () => {
    if (!selectedCompanyId) return;

    try {
      const { data: posData, error: posError } = await supabase
        .from('positions')
        .select('id, title')
        .eq('company_id', selectedCompanyId)
        .eq('active', true)
        .order('title');

      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('id, name')
        .eq('company_id', selectedCompanyId)
        .eq('active', true)
        .order('name');

      const { data: academicData } = await supabase
        .from('academic_levels')
        .select('id, name')
        .eq('company_id', selectedCompanyId)
        .eq('active', true);

      const { data: institutionData } = await supabase
        .from('educational_institutions')
        .select('id, name')
        .eq('company_id', selectedCompanyId)
        .eq('active', true);

      const { data: fieldData } = await supabase
        .from('fields_of_study')
        .select('id, name')
        .eq('company_id', selectedCompanyId)
        .eq('active', true);

      const { data: empTypeData } = await supabase
        .from('employment_types')
        .select('id, name')
        .eq('company_id', selectedCompanyId)
        .eq('active', true);

      const { data: locData } = await supabase
        .from('work_locations')
        .select('id, name')
        .eq('company_id', selectedCompanyId)
        .eq('active', true);

      if (posError) {
        console.error('Error loading positions:', posError);
      }
      if (deptError) {
        console.error('Error loading departments:', deptError);
      }

      console.log('Positions loaded:', posData);

      const mappedPositions = (posData || []).map(p => ({ id: p.id, name: p.title }));
      console.log('Mapped positions:', mappedPositions);

      setAcademicLevels(academicData || []);
      setInstitutions(institutionData || []);
      setFieldsOfStudy(fieldData || []);
      setDepartments(deptData || []);
      setPositions(mappedPositions);
      setEmploymentTypes(empTypeData || []);
      setWorkLocations(locData || []);
    } catch (error) {
      console.error('Error loading master data:', error);
    }
  };

  const loadManagersByDepartment = async (departmentName: string) => {
    if (!selectedCompanyId || !departmentName) return;

    try {
      const { data: dept } = await supabase
        .from('departments')
        .select('id')
        .eq('company_id', selectedCompanyId)
        .eq('name', departmentName)
        .maybeSingle();

      if (!dept) {
        setManagers([]);
        return;
      }

      const { data: positionsInDept } = await supabase
        .from('positions')
        .select('id')
        .eq('company_id', selectedCompanyId)
        .eq('department_id', dept.id)
        .eq('active', true);

      if (!positionsInDept || positionsInDept.length === 0) {
        setManagers([]);
        return;
      }

      const positionIds = positionsInDept.map(p => p.id);

      const { data: employees } = await supabase
        .from('employees')
        .select('id, first_name, last_name, position_id')
        .eq('company_id', selectedCompanyId)
        .eq('status', 'active')
        .in('position_id', positionIds);

      const managersData = (employees || []).map(emp => ({
        id: emp.id,
        name: `${emp.first_name} ${emp.last_name}`
      }));

      setManagers(managersData);
    } catch (error) {
      console.error('Error loading managers:', error);
      setManagers([]);
    }
  };

  const updatePersonalInfo = (field: string, value: string) => {
    setEmployeeData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));
  };

  const updateEducation = (field: string, value: string) => {
    setEmployeeData(prev => ({
      ...prev,
      education: { ...prev.education, [field]: value }
    }));
  };

  const updateEmployment = (field: string, value: string) => {
    setEmployeeData(prev => ({
      ...prev,
      employment: { ...prev.employment, [field]: value }
    }));
  };

  const updateHealth = (field: string, value: any) => {
    setEmployeeData(prev => ({
      ...prev,
      health: { ...prev.health, [field]: value }
    }));
  };

  const updateBanking = (field: string, value: string) => {
    setEmployeeData(prev => ({
      ...prev,
      banking: { ...prev.banking, [field]: value }
    }));
  };

  const updateEmergency = (field: string, value: string) => {
    setEmployeeData(prev => ({
      ...prev,
      emergency: { ...prev.emergency, [field]: value }
    }));
  };

  const updateDocuments = (field: string, value: any) => {
    setEmployeeData(prev => ({
      ...prev,
      documents: { ...prev.documents, [field]: value }
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Información Personal</h3>
                <p className="text-sm text-slate-500">Ingresa los datos personales del empleado</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nombre(s)"
                value={employeeData.personalInfo.firstName}
                onChange={(e) => updatePersonalInfo('firstName', e.target.value)}
                required
                placeholder="Juan"
              />
              <Input
                label="Apellido(s)"
                value={employeeData.personalInfo.lastName}
                onChange={(e) => updatePersonalInfo('lastName', e.target.value)}
                required
                placeholder="Pérez García"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Correo Electrónico"
                type="email"
                value={employeeData.personalInfo.email}
                onChange={(e) => updatePersonalInfo('email', e.target.value)}
                required
                placeholder="juan.perez@empresa.com"
              />
              <Input
                label="Teléfono"
                type="tel"
                value={employeeData.personalInfo.phone}
                onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                placeholder="+52 55 1234 5678"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Fecha de Nacimiento"
                type="text"
                value={employeeData.personalInfo.birthDate}
                onChange={(e) => {
                  let value = e.target.value.replace(/[^\d]/g, '');
                  if (value.length >= 2) {
                    value = value.slice(0, 2) + '/' + value.slice(2);
                  }
                  if (value.length >= 5) {
                    value = value.slice(0, 5) + '/' + value.slice(5, 9);
                  }
                  updatePersonalInfo('birthDate', value);
                }}
                placeholder="dd/mm/aaaa"
                maxLength={10}
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Género
                </label>
                <select
                  value={employeeData.personalInfo.gender}
                  onChange={(e) => updatePersonalInfo('gender', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar</option>
                  <option value="male">Masculino</option>
                  <option value="female">Femenino</option>
                  <option value="other">Otro</option>
                </select>
              </div>
              <Input
                label="ID Nacional / RFC"
                value={employeeData.personalInfo.nationalId}
                onChange={(e) => updatePersonalInfo('nationalId', e.target.value)}
                placeholder="ABCD123456XYZ"
              />
            </div>

            <CountryCitySelector
              selectedCountry={employeeData.personalInfo.country}
              selectedCity={employeeData.personalInfo.city}
              selectedCountryISO3={employeeData.personalInfo.countryISO3}
              onCountryChange={(country, iso3) => {
                console.log('onCountryChange callback:', country, iso3);
                setEmployeeData(prev => {
                  const newData = {
                    ...prev,
                    personalInfo: {
                      ...prev.personalInfo,
                      country: country,
                      countryISO3: iso3,
                      city: ''
                    }
                  };
                  console.log('New employeeData:', newData);
                  return newData;
                });
              }}
              onCityChange={(city) => updatePersonalInfo('city', city)}
            />

            <Input
              label="Dirección"
              value={employeeData.personalInfo.address}
              onChange={(e) => updatePersonalInfo('address', e.target.value)}
              placeholder={employeeData.personalInfo.city ? "Calle, número, colonia" : "Primero selecciona país y ciudad"}
              disabled={!employeeData.personalInfo.city}
            />
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Educación</h3>
                <p className="text-sm text-slate-500">Formación académica y certificaciones</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Autocomplete
                label="Nivel Académico Más Alto"
                value={employeeData.education.highestDegree}
                options={academicLevels.map(level => ({ value: level.name, label: level.name }))}
                onChange={(value) => updateEducation('highestDegree', value)}
                onSelect={(value) => updateEducation('highestDegree', value)}
                placeholder="Escribe para buscar nivel académico..."
                allowCustomValue={true}
              />
              <Autocomplete
                label="Institución"
                value={employeeData.education.institution}
                options={institutions.map(inst => ({ value: inst.name, label: inst.name }))}
                onChange={(value) => updateEducation('institution', value)}
                onSelect={(value) => updateEducation('institution', value)}
                placeholder="Escribe para buscar institución..."
                allowCustomValue={true}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Autocomplete
                label="Campo de Estudio"
                value={employeeData.education.fieldOfStudy}
                options={fieldsOfStudy.map(field => ({ value: field.name, label: field.name }))}
                onChange={(value) => updateEducation('fieldOfStudy', value)}
                onSelect={(value) => updateEducation('fieldOfStudy', value)}
                placeholder="Escribe para buscar campo de estudio..."
                allowCustomValue={true}
              />
              <Input
                label="Año de Graduación"
                type="number"
                value={employeeData.education.graduationYear}
                onChange={(e) => updateEducation('graduationYear', e.target.value)}
                placeholder="2020"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Certificaciones Profesionales
              </label>
              <textarea
                value={employeeData.education.certifications}
                onChange={(e) => updateEducation('certifications', e.target.value)}
                rows={4}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Lista de certificaciones, una por línea..."
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Información Laboral</h3>
                <p className="text-sm text-slate-500">Detalles del puesto y empleo</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Número de Empleado <span className="text-xs text-slate-500">(se generará automáticamente si se deja vacío)</span>
                </label>
                <Input
                  value={employeeData.employment.employeeNumber}
                  onChange={(e) => updateEmployment('employeeNumber', e.target.value)}
                  placeholder="Se generará automáticamente"
                />
              </div>
              <Input
                label="Fecha de Contratación"
                type="text"
                value={employeeData.employment.hireDate}
                onChange={(e) => {
                  let value = e.target.value.replace(/[^\d]/g, '');
                  if (value.length >= 2) {
                    value = value.slice(0, 2) + '/' + value.slice(2);
                  }
                  if (value.length >= 5) {
                    value = value.slice(0, 5) + '/' + value.slice(5, 9);
                  }
                  updateEmployment('hireDate', value);
                }}
                placeholder="dd/mm/aaaa"
                maxLength={10}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Autocomplete
                label="Departamento"
                value={employeeData.employment.department}
                options={departments.map(dept => dept.name)}
                onChange={(value) => updateEmployment('department', value)}
                placeholder="Escribe para buscar departamento..."
              />
              <Autocomplete
                label="Puesto"
                value={employeeData.employment.position}
                options={positions.map(pos => pos.name)}
                onChange={(value) => updateEmployment('position', value)}
                placeholder="Escribe para buscar puesto..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Autocomplete
                label="Tipo de Empleo"
                value={employeeData.employment.employmentType}
                options={employmentTypes.map(type => type.name)}
                onChange={(value) => updateEmployment('employmentType', value)}
                placeholder="Escribe para buscar tipo de empleo..."
              />
              <Autocomplete
                label="Ubicación de Trabajo"
                value={employeeData.employment.workLocation}
                options={workLocations.map(loc => loc.name)}
                onChange={(value) => updateEmployment('workLocation', value)}
                placeholder="Escribe para buscar ubicación..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Salario Mensual"
                type="number"
                value={employeeData.employment.salary}
                onChange={(e) => updateEmployment('salary', e.target.value)}
                placeholder="50000"
              />
              <Autocomplete
                label="Manager/Supervisor"
                value={employeeData.employment.manager}
                options={managers.map(mgr => mgr.name)}
                onChange={(value) => updateEmployment('manager', value)}
                placeholder="Nombre del supervisor"
                disabled={!employeeData.employment.department}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Información de Salud</h3>
                <p className="text-sm text-slate-500">Carnet de salud y documentación médica</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Número de Carnet de Salud"
                value={employeeData.health.cardNumber}
                onChange={(e) => updateHealth('cardNumber', e.target.value)}
                placeholder="123456789"
              />
              <Input
                label="Vigencia del Carnet"
                type="text"
                value={employeeData.health.cardExpiry}
                onChange={(e) => {
                  let value = e.target.value.replace(/[^\d]/g, '');
                  if (value.length >= 2) {
                    value = value.slice(0, 2) + '/' + value.slice(2);
                  }
                  if (value.length >= 5) {
                    value = value.slice(0, 5) + '/' + value.slice(5, 9);
                  }
                  updateHealth('cardExpiry', value);
                }}
                placeholder="dd/mm/aaaa"
                maxLength={10}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Archivo del Carnet de Salud
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      updateHealth('cardFile', file);
                    }
                  }}
                  className="hidden"
                  id="health-card-upload"
                />
                <label htmlFor="health-card-upload" className="cursor-pointer">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  {employeeData.health.cardFile ? (
                    <p className="text-sm text-slate-900">{employeeData.health.cardFile.name}</p>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-slate-900 mb-1">Haz clic para subir archivo</p>
                      <p className="text-xs text-slate-500">PDF, JPG o PNG hasta 10MB</p>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Datos Bancarios</h3>
                <p className="text-sm text-slate-500">Información para el pago de nómina</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nombre del Banco"
                value={employeeData.banking.bankName}
                onChange={(e) => updateBanking('bankName', e.target.value)}
                placeholder="Banco Nacional"
              />
              <Input
                label="Número de Cuenta"
                value={employeeData.banking.accountNumber}
                onChange={(e) => updateBanking('accountNumber', e.target.value)}
                placeholder="1234567890"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tipo de Cuenta
                </label>
                <select
                  value={employeeData.banking.accountType}
                  onChange={(e) => updateBanking('accountType', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar...</option>
                  <option value="checking">Cuenta Corriente</option>
                  <option value="savings">Cuenta de Ahorros</option>
                </select>
              </div>
              <Input
                label="Código CLABE / Routing"
                value={employeeData.banking.routingNumber}
                onChange={(e) => updateBanking('routingNumber', e.target.value)}
                placeholder="012345678901234567"
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Phone className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Contacto de Emergencia</h3>
                <p className="text-sm text-slate-500">Persona a contactar en caso de emergencia</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nombre Completo"
                value={employeeData.emergency.contactName}
                onChange={(e) => updateEmergency('contactName', e.target.value)}
                placeholder="Juan Pérez"
              />
              <Input
                label="Relación"
                value={employeeData.emergency.relationship}
                onChange={(e) => updateEmergency('relationship', e.target.value)}
                placeholder="Esposo/a, Padre/Madre, Hermano/a..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Teléfono Principal"
                value={employeeData.emergency.phone}
                onChange={(e) => updateEmergency('phone', e.target.value)}
                placeholder="+52 55 1234 5678"
              />
              <Input
                label="Teléfono Alternativo"
                value={employeeData.emergency.phoneAlt}
                onChange={(e) => updateEmergency('phoneAlt', e.target.value)}
                placeholder="+52 55 8765 4321"
              />
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Documentos</h3>
                <p className="text-sm text-slate-500">Documentación requerida para el expediente</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="contract"
                    checked={employeeData.documents.hasContract}
                    onChange={(e) => updateDocuments('hasContract', e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="contract" className="text-sm font-medium text-slate-900 cursor-pointer">
                    Contrato Firmado
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="id"
                    checked={employeeData.documents.hasIDCopy}
                    onChange={(e) => updateDocuments('hasIDCopy', e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="id" className="text-sm font-medium text-slate-900 cursor-pointer">
                    Copia de Identificación
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="background"
                    checked={employeeData.documents.hasBackground}
                    onChange={(e) => updateDocuments('hasBackground', e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="background" className="text-sm font-medium text-slate-900 cursor-pointer">
                    Verificación de Antecedentes
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Notas Adicionales
              </label>
              <textarea
                value={employeeData.documents.notes}
                onChange={(e) => updateDocuments('notes', e.target.value)}
                rows={4}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Cualquier información adicional relevante..."
              />
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileDown className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Contrato de Trabajo</h3>
                <p className="text-sm text-slate-500">Contrato generado con la plantilla del puesto</p>
              </div>
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-xl p-8 max-h-96 overflow-y-auto print-area">
              <div className="text-sm whitespace-pre-line font-sans leading-relaxed" id="contract-content">
                {contractTemplate || 'Cargando plantilla...'}
              </div>
            </div>

            <div className="flex gap-3 no-print">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  const printContent = document.getElementById('contract-content');
                  if (printContent) {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Contrato de Trabajo</title>
                            <style>
                              body {
                                font-family: Arial, sans-serif;
                                line-height: 1.6;
                                padding: 40px;
                                max-width: 800px;
                                margin: 0 auto;
                              }
                              h1, h2, h3 {
                                margin-top: 20px;
                                margin-bottom: 10px;
                              }
                              p {
                                margin-bottom: 10px;
                              }
                              @media print {
                                body {
                                  padding: 20px;
                                }
                              }
                            </style>
                          </head>
                          <body>
                            ${printContent.innerHTML}
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
                  }
                }}
              >
                <FileDown className="w-4 h-4 mr-2" />
                Imprimir Contrato
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => {
                  const contractContent = contractTemplate;
                  const blob = new Blob([contractContent], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `contrato_${employeeData.personalInfo.firstName}_${employeeData.personalInfo.lastName}.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
              >
                <FileDown className="w-4 h-4 mr-2" />
                Descargar Contrato
              </Button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-900">
                Al confirmar, se creará el registro del empleado con toda la información proporcionada.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar Nuevo Empleado" size="xl" showClose={false}>
      <StepWizard steps={steps} currentStep={currentStep}>
        {renderStepContent()}

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
          <div>
            {currentStep > 0 && (
              <Button variant="ghost" onClick={handleBack}>
                Anterior
              </Button>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button variant="primary" onClick={handleNext}>
                Siguiente
              </Button>
            ) : (
              <Button variant="primary" onClick={handleSubmit} isLoading={isSubmitting}>
                Crear Empleado
              </Button>
            )}
          </div>
        </div>
      </StepWizard>
    </Modal>
  );
}
