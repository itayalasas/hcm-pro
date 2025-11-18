import { useState, useEffect } from 'react';
import { User, GraduationCap, Briefcase, FileText, CheckCircle, Heart, CreditCard, Phone, FileDown, Upload, X } from 'lucide-react';
import Modal from '../ui/Modal';
import StepWizard from '../ui/StepWizard';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Autocomplete from '../ui/Autocomplete';
import CountryCitySelector from '../ui/CountryCitySelector';
import { supabase, setCurrentUser } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useToast } from '../../hooks/useToast';
import { replaceContractVariables, EmployeeContractData } from '../../lib/contractTemplates';

interface AddEmployeeWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editMode?: boolean;
  employeeToEdit?: any;
}

interface EmployeeData {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    birthDate: string;
    genderId: string;
    documentTypeId: string;
    nationalId: string;
    address: string;
    city: string;
    country: string;
    countryISO3: string;
  };
  education: {
    academicLevelId: string;
    institutionId: string;
    fieldOfStudyId: string;
    graduationYear: string;
    certifications: string;
  };
  employment: {
    employeeNumber: string;
    hireDate: string;
    departmentId: string;
    positionId: string;
    employmentTypeId: string;
    workLocationId: string;
    salary: string;
    managerId: string;
  };
  health: {
    cardNumber: string;
    cardExpiry: string;
    cardFile: File | null;
  };
  banking: {
    bankId: string;
    accountNumber: string;
    bankAccountTypeId: string;
    routingNumber: string;
  };
  emergency: {
    contactName: string;
    relationship: string;
    phone: string;
    alternatePhone: string;
  };
  documents: {
    files: { name: string; file: File; type: string }[];
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

export default function AddEmployeeWizard({ isOpen, onClose, onSuccess, editMode = false, employeeToEdit }: AddEmployeeWizardProps) {
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

  const [documentTypes, setDocumentTypes] = useState<Array<{id: string, name: string, code: string}>>([]);
  const [genders, setGenders] = useState<Array<{id: string, name: string}>>([]);
  const [academicLevels, setAcademicLevels] = useState<Array<{id: string, name: string}>>([]);
  const [institutions, setInstitutions] = useState<Array<{id: string, name: string}>>([]);
  const [fieldsOfStudy, setFieldsOfStudy] = useState<Array<{id: string, name: string}>>([]);
  const [departments, setDepartments] = useState<Array<{id: string, name: string}>>([]);
  const [positions, setPositions] = useState<Array<{id: string, name: string}>>([]);
  const [employmentTypes, setEmploymentTypes] = useState<Array<{id: string, name: string}>>([]);
  const [workLocations, setWorkLocations] = useState<Array<{id: string, name: string}>>([]);
  const [managers, setManagers] = useState<Array<{id: string, name: string}>>([]);
  const [banks, setBanks] = useState<Array<{id: string, name: string, country: string}>>([]);
  const [bankAccountTypes, setBankAccountTypes] = useState<Array<{id: string, name: string}>>([]);
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
      departmentId: '',
      position: '',
      positionId: '',
      employmentType: 'full-time',
      workLocation: '',
      workLocationId: '',
      salary: '',
      manager: '',
      managerId: ''
    },
    health: {
      cardNumber: '',
      cardExpiry: '',
      cardFile: null
    },
    banking: {
      bankId: '',
      accountNumber: '',
      bankAccountTypeId: '',
      routingNumber: ''
    },
    emergency: {
      contactName: '',
      relationship: '',
      phone: '',
      phoneAlt: ''
    },
    documents: {
      files: []
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
      employmentType: employmentTypes.find(t => t.id === employeeData.employment.employmentTypeId)?.name || 'N/A',
      hireDate: employeeData.employment.hireDate,
      salary: employeeData.employment.salary,
      bankName: banks.find(b => b.id === employeeData.banking.bankId)?.name || 'N/A',
      accountNumber: employeeData.banking.accountNumber,
      accountType: bankAccountTypes.find(t => t.id === employeeData.banking.bankAccountTypeId)?.name || 'N/A',
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

      const convertDateToISO = (dateStr: string) => {
        if (!dateStr) return null;
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const [day, month, year] = parts;
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        return dateStr;
      };

      const isValidId = (id: string, validIds: string[]) => {
        return id && validIds.includes(id);
      };

      const departmentIds = departments.map(d => d.id);
      const positionIds = positions.map(p => p.id);
      const managerIds = managers.map(m => m.id);
      const locationIds = workLocations.map(l => l.id);

      console.log('Validation debug:', {
        departmentId: employeeData.employment.departmentId,
        availableDepartments: departmentIds,
        isValid: employeeData.employment.departmentId ? departmentIds.includes(employeeData.employment.departmentId) : 'empty'
      });

      const validPositionId = employeeData.employment.positionId &&
        isValidId(employeeData.employment.positionId, positionIds)
        ? employeeData.employment.positionId
        : null;

      const validDepartmentId = employeeData.employment.departmentId &&
        isValidId(employeeData.employment.departmentId, departmentIds)
        ? employeeData.employment.departmentId
        : null;

      const validManagerId = employeeData.employment.managerId &&
        isValidId(employeeData.employment.managerId, managerIds)
        ? employeeData.employment.managerId
        : null;

      const validWorkLocationId = employeeData.employment.workLocationId &&
        isValidId(employeeData.employment.workLocationId, locationIds)
        ? employeeData.employment.workLocationId
        : null;

      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id || null;

      const employeePayload = {
        first_name: employeeData.personalInfo.firstName,
        last_name: employeeData.personalInfo.lastName,
        email: employeeData.personalInfo.email,
        phone: employeeData.personalInfo.phone || null,
        mobile: employeeData.personalInfo.phone || null,
        date_of_birth: employeeData.personalInfo.birthDate ? convertDateToISO(employeeData.personalInfo.birthDate) : null,
        gender_id: employeeData.personalInfo.genderId || null,
        document_type_id: employeeData.personalInfo.documentTypeId || null,
        national_id: employeeData.personalInfo.nationalId || null,
        address_street: employeeData.personalInfo.address || null,
        address_city: employeeData.personalInfo.city || null,
        address_country: employeeData.personalInfo.country || null,
        address_country_iso3: employeeData.personalInfo.countryISO3 || null,
        academic_level_id: employeeData.education.academicLevelId || null,
        educational_institution_id: employeeData.education.institutionId || null,
        field_of_study_id: employeeData.education.fieldOfStudyId || null,
        graduation_year: employeeData.education.graduationYear || null,
        certifications: employeeData.education.certifications || null,
        hire_date: convertDateToISO(employeeData.employment.hireDate),
        position_id: validPositionId,
        department_id: validDepartmentId,
        direct_manager_id: validManagerId,
        work_location_id: validWorkLocationId,
        salary: employeeData.employment.salary ? parseFloat(employeeData.employment.salary) : null,
        employment_type_id: employeeData.employment.employmentTypeId || null,
        health_card_number: employeeData.health.cardNumber || null,
        health_card_expiry: employeeData.health.cardExpiry ? convertDateToISO(employeeData.health.cardExpiry) : null,
        bank_id: employeeData.banking.bankId || null,
        bank_account_number: employeeData.banking.accountNumber || null,
        bank_account_type_id: employeeData.banking.bankAccountTypeId || null,
        bank_routing_number: employeeData.banking.routingNumber || null,
        emergency_contact_name: employeeData.emergency.contactName || null,
        emergency_contact_relationship: employeeData.emergency.relationship || null,
        emergency_contact_phone: employeeData.emergency.phone || null,
        emergency_contact_phone_alt: employeeData.emergency.alternatePhone || null,
        created_by: editMode ? undefined : userId,
        updated_by: editMode ? userId : undefined
      };

      let employeeId: string;

      if (editMode && employeeToEdit) {
        const { error: employeeError } = await supabase
          .from('employees')
          .update(employeePayload)
          .eq('id', employeeToEdit.id);

        if (employeeError) throw employeeError;
        employeeId = employeeToEdit.id;
        toast.success('Empleado actualizado exitosamente');
      } else {
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

        const { data: newEmployee, error: employeeError } = await supabase.from('employees').insert({
          ...employeePayload,
          company_id: selectedCompanyId,
          employee_number: employeeNumber,
          status: 'active'
        }).select().single();

        if (employeeError) throw employeeError;
        if (!newEmployee) throw new Error('No se pudo crear el empleado');

        employeeId = newEmployee.id;
        toast.success('Empleado creado exitosamente');
      }

      if (employeeData.documents.files.length > 0) {
        await setCurrentUser();
        for (const doc of employeeData.documents.files) {
          const filePath = `${selectedCompanyId}/${employeeId}/${Date.now()}_${doc.name}`;
          const { error: uploadError } = await supabase.storage
            .from('employee-documents')
            .upload(filePath, doc.file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('Error uploading document:', uploadError);
          }
        }
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error(`Error ${editMode ? 'updating' : 'creating'} employee:`, error);
      toast.error(`Error al ${editMode ? 'actualizar' : 'crear'} empleado`);
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
        genderId: '',
        documentTypeId: '',
        nationalId: '',
        address: '',
        city: '',
        country: 'México',
        countryISO3: 'MEX'
      },
      education: {
        academicLevelId: '',
        institutionId: '',
        fieldOfStudyId: '',
        graduationYear: '',
        certifications: ''
      },
      employment: {
        employeeNumber: '',
        hireDate: '',
        departmentId: '',
        positionId: '',
        employmentTypeId: '',
        workLocationId: '',
        salary: '',
        managerId: ''
      },
      health: {
        cardNumber: '',
        cardExpiry: '',
        cardFile: null
      },
      banking: {
        bankId: '',
        accountNumber: '',
        bankAccountTypeId: '',
        routingNumber: ''
      },
      emergency: {
        contactName: '',
        relationship: '',
        phone: '',
        alternatePhone: ''
      },
      documents: {
        files: []
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
    if (employeeData.employment.departmentId && selectedCompanyId) {
      loadManagersByDepartment(employeeData.employment.departmentId);
    } else {
      setManagers([]);
    }
  }, [employeeData.employment.departmentId, selectedCompanyId]);

  const loadEmployeeData = async () => {
    if (!employeeToEdit) return;

    try {
      console.log('loadEmployeeData called with:', employeeToEdit);
      console.log('Available data:', {
        departments: departments.length,
        positions: positions.length,
        locations: workLocations.length
      });

      const dept = departments.find(d => d.id === employeeToEdit.department_id);
      const pos = positions.find(p => p.id === employeeToEdit.position_id);
      const loc = workLocations.find(l => l.id === employeeToEdit.work_location_id);

      console.log('Found data:', { dept, pos, loc });
      console.log('Looking for:', {
        deptId: employeeToEdit.department_id,
        posId: employeeToEdit.position_id,
        locId: employeeToEdit.work_location_id
      });

      let mgr = null;
      if (employeeToEdit.direct_manager_id && employeeToEdit.department_id) {
        const loadedManagers = await loadManagersByDepartment(employeeToEdit.department_id);
        mgr = loadedManagers.find(m => m.id === employeeToEdit.direct_manager_id);
      }

      const dataToSet = {
        personalInfo: {
          firstName: employeeToEdit.first_name || '',
          lastName: employeeToEdit.last_name || '',
          email: employeeToEdit.email || '',
          phone: employeeToEdit.phone || employeeToEdit.mobile || '',
          birthDate: employeeToEdit.date_of_birth || '',
          genderId: employeeToEdit.gender_id || '',
          documentTypeId: employeeToEdit.document_type_id || '',
          nationalId: employeeToEdit.national_id || '',
          address: employeeToEdit.address_street || '',
          city: employeeToEdit.address_city || '',
          country: employeeToEdit.address_country || '',
          countryISO3: employeeToEdit.address_country_iso3 || ''
        },
        education: {
          academicLevelId: employeeToEdit.academic_level_id || '',
          institutionId: employeeToEdit.educational_institution_id || '',
          fieldOfStudyId: employeeToEdit.field_of_study_id || '',
          graduationYear: employeeToEdit.graduation_year || '',
          certifications: employeeToEdit.certifications || ''
        },
        employment: {
          employeeNumber: employeeToEdit.employee_number || '',
          hireDate: employeeToEdit.hire_date || '',
          departmentId: employeeToEdit.department_id || '',
          positionId: employeeToEdit.position_id || '',
          employmentTypeId: employeeToEdit.employment_type_id || '',
          workLocationId: employeeToEdit.work_location_id || '',
          salary: employeeToEdit.salary?.toString() || '',
          managerId: employeeToEdit.direct_manager_id || ''
        },
        health: {
          cardNumber: employeeToEdit.health_card_number || '',
          cardExpiry: employeeToEdit.health_card_expiry || '',
          cardFile: null
        },
        banking: {
          bankId: employeeToEdit.bank_id || '',
          accountNumber: employeeToEdit.bank_account_number || '',
          bankAccountTypeId: employeeToEdit.bank_account_type_id || '',
          routingNumber: employeeToEdit.bank_routing_number || ''
        },
        emergency: {
          contactName: employeeToEdit.emergency_contact_name || '',
          relationship: employeeToEdit.emergency_contact_relationship || '',
          phone: employeeToEdit.emergency_contact_phone || '',
          alternatePhone: employeeToEdit.emergency_contact_phone_alt || ''
        },
        documents: {
          files: []
        }
      };

      console.log('Setting employee data:', dataToSet);
      setEmployeeData(dataToSet);
    } catch (error) {
      console.error('Error loading employee data:', error);
    }
  };

  useEffect(() => {
    console.log('Edit mode effect:', {
      editMode,
      hasEmployeeToEdit: !!employeeToEdit,
      isOpen,
      documentTypesLength: documentTypes.length,
      gendersLength: genders.length,
      academicLevelsLength: academicLevels.length,
      institutionsLength: institutions.length,
      fieldsOfStudyLength: fieldsOfStudy.length,
      departmentsLength: departments.length,
      positionsLength: positions.length,
      employmentTypesLength: employmentTypes.length,
      locationsLength: workLocations.length
    });

    if (editMode && employeeToEdit && isOpen &&
        documentTypes.length > 0 &&
        genders.length > 0 &&
        academicLevels.length > 0 &&
        institutions.length > 0 &&
        fieldsOfStudy.length > 0 &&
        departments.length > 0 &&
        positions.length > 0 &&
        employmentTypes.length > 0 &&
        workLocations.length > 0 &&
        banks.length > 0 &&
        bankAccountTypes.length > 0) {
      console.log('All master data loaded, loading employee data for:', employeeToEdit);
      loadEmployeeData();
    }
  }, [editMode, employeeToEdit, isOpen, documentTypes, genders, academicLevels, institutions, fieldsOfStudy, departments, positions, employmentTypes, workLocations, banks, bankAccountTypes]);

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
    if (!selectedCompanyId) {
      console.log('loadMasterData: no selectedCompanyId');
      return;
    }

    console.log('loadMasterData: loading for company', selectedCompanyId);

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

      console.log('loadMasterData: Raw data loaded:', {
        positions: posData?.length || 0,
        departments: deptData?.length || 0,
        posError,
        deptError
      });

      const { data: documentTypeData } = await supabase
        .from('document_types')
        .select('id, code, name')
        .eq('company_id', selectedCompanyId)
        .eq('active', true)
        .order('name');

      const { data: genderData } = await supabase
        .from('genders')
        .select('id, name')
        .eq('company_id', selectedCompanyId)
        .eq('active', true)
        .order('name');

      const { data: academicData } = await supabase
        .from('academic_levels')
        .select('id, name')
        .eq('company_id', selectedCompanyId)
        .eq('active', true)
        .order('name');

      const { data: institutionData } = await supabase
        .from('educational_institutions')
        .select('id, name')
        .eq('company_id', selectedCompanyId)
        .eq('active', true)
        .order('name');

      const { data: fieldData } = await supabase
        .from('fields_of_study')
        .select('id, name')
        .eq('company_id', selectedCompanyId)
        .eq('active', true)
        .order('name');

      const { data: empTypeData } = await supabase
        .from('employment_types')
        .select('id, name')
        .eq('company_id', selectedCompanyId)
        .eq('active', true)
        .order('name');

      const { data: locData } = await supabase
        .from('work_locations')
        .select('id, name')
        .eq('company_id', selectedCompanyId)
        .eq('active', true)
        .order('name');

      const { data: bankData } = await supabase
        .from('banks')
        .select('id, name, country')
        .or(`company_id.eq.${selectedCompanyId},company_id.is.null`)
        .eq('is_active', true)
        .order('country, name');

      const { data: accountTypeData } = await supabase
        .from('bank_account_types')
        .select('id, name')
        .or(`company_id.eq.${selectedCompanyId},company_id.is.null`)
        .eq('is_active', true)
        .order('name');

      if (posError) {
        console.error('Error loading positions:', posError);
      }
      if (deptError) {
        console.error('Error loading departments:', deptError);
      }

      const mappedPositions = (posData || []).map(p => ({ id: p.id, name: p.title }));

      setDocumentTypes(documentTypeData || []);
      setGenders(genderData || []);
      setAcademicLevels(academicData || []);
      setInstitutions(institutionData || []);
      setFieldsOfStudy(fieldData || []);
      setDepartments(deptData || []);
      setPositions(mappedPositions);
      setEmploymentTypes(empTypeData || []);
      setWorkLocations(locData || []);
      setBanks(bankData || []);
      setBankAccountTypes(accountTypeData || []);

      console.log('loadMasterData: State updated with:', {
        documentTypes: documentTypeData?.length || 0,
        genders: genderData?.length || 0,
        academicLevels: academicData?.length || 0,
        institutions: institutionData?.length || 0,
        fieldsOfStudy: fieldData?.length || 0,
        departments: deptData?.length || 0,
        positions: mappedPositions.length,
        employmentTypes: empTypeData?.length || 0,
        workLocations: locData?.length || 0,
        banks: bankData?.length || 0,
        bankAccountTypes: accountTypeData?.length || 0
      });
    } catch (error) {
      console.error('Error loading master data:', error);
    }
  };

  const loadManagersByDepartment = async (businessUnitId: string) => {
    if (!selectedCompanyId || !businessUnitId) return [];

    try {
      const { data: employees } = await supabase
        .from('employees')
        .select('id, first_name, last_name, department_id')
        .eq('company_id', selectedCompanyId)
        .eq('status', 'active')
        .eq('department_id', businessUnitId);

      const managersData = (employees || []).map(emp => ({
        id: emp.id,
        name: `${emp.first_name} ${emp.last_name}`
      }));

      setManagers(managersData);
      return managersData;
    } catch (error) {
      console.error('Error loading managers:', error);
      setManagers([]);
      return [];
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
              <Autocomplete
                label="Género"
                value={employeeData.personalInfo.genderId}
                options={genders.map(gender => ({ value: gender.id, label: gender.name }))}
                onChange={(value) => updatePersonalInfo('genderId', value)}
                placeholder="Seleccionar género..."
              />
              <Autocomplete
                label="Tipo de Documento"
                value={employeeData.personalInfo.documentTypeId}
                options={documentTypes.map(docType => ({ value: docType.id, label: docType.name }))}
                onChange={(value) => updatePersonalInfo('documentTypeId', value)}
                placeholder="Seleccionar tipo de documento..."
              />
              <Input
                label="Número de Documento"
                value={employeeData.personalInfo.nationalId}
                onChange={(e) => updatePersonalInfo('nationalId', e.target.value)}
                placeholder="Ej: 123456789"
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
                value={employeeData.education.academicLevelId}
                options={academicLevels.map(level => ({ value: level.id, label: level.name }))}
                onChange={(value) => updateEducation('academicLevelId', value)}
                placeholder="Escribe para buscar nivel académico..."
              />
              <Autocomplete
                label="Institución"
                value={employeeData.education.institutionId}
                options={institutions.map(inst => ({ value: inst.id, label: inst.name }))}
                onChange={(value) => updateEducation('institutionId', value)}
                placeholder="Escribe para buscar institución..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Autocomplete
                label="Campo de Estudio"
                value={employeeData.education.fieldOfStudyId}
                options={fieldsOfStudy.map(field => ({ value: field.id, label: field.name }))}
                onChange={(value) => updateEducation('fieldOfStudyId', value)}
                placeholder="Escribe para buscar campo de estudio..."
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
                onChange={(value) => {
                  const dept = departments.find(d => d.name === value);
                  setEmployeeData(prev => ({
                    ...prev,
                    employment: {
                      ...prev.employment,
                      department: value,
                      departmentId: dept?.id || ''
                    }
                  }));
                }}
                placeholder="Escribe para buscar departamento..."
              />
              <Autocomplete
                label="Puesto"
                value={employeeData.employment.position}
                options={positions.map(pos => pos.name)}
                onChange={(value) => {
                  const pos = positions.find(p => p.name === value);
                  setEmployeeData(prev => ({
                    ...prev,
                    employment: {
                      ...prev.employment,
                      position: value,
                      positionId: pos?.id || ''
                    }
                  }));
                }}
                placeholder="Escribe para buscar puesto..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Autocomplete
                label="Tipo de Empleo"
                value={employeeData.employment.employmentTypeId}
                options={employmentTypes.map(type => ({ value: type.id, label: type.name }))}
                onChange={(value) => updateEmployment('employmentTypeId', value)}
                placeholder="Escribe para buscar tipo de empleo..."
              />
              <Autocomplete
                label="Ubicación de Trabajo"
                value={employeeData.employment.workLocationId}
                options={workLocations.map(loc => ({ value: loc.id, label: loc.name }))}
                onChange={(value) => updateEmployment('workLocationId', value)}
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
                value={employeeData.employment.managerId}
                options={managers.map(mgr => ({ value: mgr.id, label: mgr.name }))}
                onChange={(value) => updateEmployment('managerId', value)}
                placeholder="Nombre del supervisor"
                disabled={!employeeData.employment.departmentId}
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
              <Autocomplete
                label="Nombre del Banco"
                value={employeeData.banking.bankId}
                options={banks.map(bank => ({
                  value: bank.id,
                  label: `${bank.name} (${bank.country})`,
                  description: bank.country
                }))}
                onChange={(value) => updateBanking('bankId', value)}
                placeholder="Escribe para buscar banco..."
              />
              <Input
                label="Número de Cuenta"
                value={employeeData.banking.accountNumber}
                onChange={(e) => updateBanking('accountNumber', e.target.value)}
                placeholder="1234567890"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Autocomplete
                label="Tipo de Cuenta"
                value={employeeData.banking.bankAccountTypeId}
                options={bankAccountTypes.map(type => ({
                  value: type.id,
                  label: type.name
                }))}
                onChange={(value) => updateBanking('bankAccountTypeId', value)}
                placeholder="Escribe para buscar tipo de cuenta..."
              />
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
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <input
                  type="file"
                  id="document-upload"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    const newFiles = files.map(file => ({
                      name: file.name,
                      file: file,
                      type: file.type
                    }));
                    setEmployeeData(prev => ({
                      ...prev,
                      documents: {
                        files: [...prev.documents.files, ...newFiles]
                      }
                    }));
                    e.target.value = '';
                  }}
                />
                <label
                  htmlFor="document-upload"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  Seleccionar Archivos
                </label>
                <p className="text-sm text-slate-500 mt-2">
                  PDF, DOC, DOCX, JPG, PNG, TXT (máx. 10MB cada uno)
                </p>
              </div>

              {employeeData.documents.files.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-900">Archivos seleccionados:</h4>
                  {employeeData.documents.files.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                          <p className="text-xs text-slate-500">
                            {(doc.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setEmployeeData(prev => ({
                            ...prev,
                            documents: {
                              files: prev.documents.files.filter((_, i) => i !== index)
                            }
                          }));
                        }}
                        className="p-1 hover:bg-slate-200 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
    <Modal isOpen={isOpen} onClose={onClose} title={editMode ? "Editar Empleado" : "Agregar Nuevo Empleado"} size="xl" showClose={false}>
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
                {editMode ? 'Actualizar Empleado' : 'Crear Empleado'}
              </Button>
            )}
          </div>
        </div>
      </StepWizard>
    </Modal>
  );
}
