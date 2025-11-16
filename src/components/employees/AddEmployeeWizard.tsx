import { useState } from 'react';
import { User, GraduationCap, Briefcase, FileText, CheckCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import StepWizard from '../ui/StepWizard';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';

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
  { id: 'documents', title: 'Documentos', description: 'Documentación requerida' },
  { id: 'review', title: 'Revisión', description: 'Confirmar información' }
];

export default function AddEmployeeWizard({ isOpen, onClose, onSuccess }: AddEmployeeWizardProps) {
  const { selectedCompanyId } = useCompany();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    documents: {
      hasContract: false,
      hasIDCopy: false,
      hasBackground: false,
      notes: ''
    }
  });

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
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

      const { error } = await supabase.from('employees').insert({
        company_id: selectedCompanyId,
        employee_number: employeeNumber,
        first_name: employeeData.personalInfo.firstName,
        last_name: employeeData.personalInfo.lastName,
        email: employeeData.personalInfo.email,
        phone: employeeData.personalInfo.phone,
        birth_date: employeeData.personalInfo.birthDate,
        gender: employeeData.personalInfo.gender,
        national_id: employeeData.personalInfo.nationalId,
        hire_date: employeeData.employment.hireDate,
        work_location: employeeData.employment.workLocation,
        status: 'active'
      });

      if (error) throw error;

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
      documents: {
        hasContract: false,
        hasIDCopy: false,
        hasBackground: false,
        notes: ''
      }
    });
  };

  const updatePersonalInfo = (field: string, value: string) => {
    setEmployeeData({
      ...employeeData,
      personalInfo: { ...employeeData.personalInfo, [field]: value }
    });
  };

  const updateEducation = (field: string, value: string) => {
    setEmployeeData({
      ...employeeData,
      education: { ...employeeData.education, [field]: value }
    });
  };

  const updateEmployment = (field: string, value: string) => {
    setEmployeeData({
      ...employeeData,
      employment: { ...employeeData.employment, [field]: value }
    });
  };

  const updateDocuments = (field: string, value: any) => {
    setEmployeeData({
      ...employeeData,
      documents: { ...employeeData.documents, [field]: value }
    });
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
                type="date"
                value={employeeData.personalInfo.birthDate}
                onChange={(e) => updatePersonalInfo('birthDate', e.target.value)}
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

            <Input
              label="Dirección"
              value={employeeData.personalInfo.address}
              onChange={(e) => updatePersonalInfo('address', e.target.value)}
              placeholder="Calle, número, colonia"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Ciudad"
                value={employeeData.personalInfo.city}
                onChange={(e) => updatePersonalInfo('city', e.target.value)}
                placeholder="Ciudad de México"
              />
              <Input
                label="País"
                value={employeeData.personalInfo.country}
                onChange={(e) => updatePersonalInfo('country', e.target.value)}
              />
            </div>
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nivel Académico Más Alto
                </label>
                <select
                  value={employeeData.education.highestDegree}
                  onChange={(e) => updateEducation('highestDegree', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar</option>
                  <option value="high-school">Preparatoria</option>
                  <option value="associate">Técnico</option>
                  <option value="bachelor">Licenciatura</option>
                  <option value="master">Maestría</option>
                  <option value="doctorate">Doctorado</option>
                </select>
              </div>
              <Input
                label="Institución"
                value={employeeData.education.institution}
                onChange={(e) => updateEducation('institution', e.target.value)}
                placeholder="Universidad Nacional"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Campo de Estudio"
                value={employeeData.education.fieldOfStudy}
                onChange={(e) => updateEducation('fieldOfStudy', e.target.value)}
                placeholder="Ingeniería en Sistemas"
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
                type="date"
                value={employeeData.employment.hireDate}
                onChange={(e) => updateEmployment('hireDate', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Departamento"
                value={employeeData.employment.department}
                onChange={(e) => updateEmployment('department', e.target.value)}
                placeholder="Tecnología"
              />
              <Input
                label="Puesto"
                value={employeeData.employment.position}
                onChange={(e) => updateEmployment('position', e.target.value)}
                placeholder="Desarrollador Senior"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tipo de Empleo
                </label>
                <select
                  value={employeeData.employment.employmentType}
                  onChange={(e) => updateEmployment('employmentType', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="full-time">Tiempo Completo</option>
                  <option value="part-time">Medio Tiempo</option>
                  <option value="contract">Por Contrato</option>
                  <option value="temporary">Temporal</option>
                </select>
              </div>
              <Input
                label="Ubicación de Trabajo"
                value={employeeData.employment.workLocation}
                onChange={(e) => updateEmployment('workLocation', e.target.value)}
                placeholder="Oficina Central / Remoto"
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
              <Input
                label="Manager/Supervisor"
                value={employeeData.employment.manager}
                onChange={(e) => updateEmployment('manager', e.target.value)}
                placeholder="Nombre del supervisor"
              />
            </div>
          </div>
        );

      case 3:
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

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Revisión Final</h3>
                <p className="text-sm text-slate-500">Verifica que toda la información sea correcta</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-50 rounded-xl p-6">
                <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Información Personal
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Nombre:</span>
                    <p className="font-medium text-slate-900">
                      {employeeData.personalInfo.firstName} {employeeData.personalInfo.lastName}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Email:</span>
                    <p className="font-medium text-slate-900">{employeeData.personalInfo.email}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Teléfono:</span>
                    <p className="font-medium text-slate-900">{employeeData.personalInfo.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">RFC:</span>
                    <p className="font-medium text-slate-900">{employeeData.personalInfo.nationalId || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-6">
                <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Información Laboral
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Número de Empleado:</span>
                    <p className="font-medium text-slate-900">{employeeData.employment.employeeNumber}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Fecha de Contratación:</span>
                    <p className="font-medium text-slate-900">{employeeData.employment.hireDate}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Puesto:</span>
                    <p className="font-medium text-slate-900">{employeeData.employment.position || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Departamento:</span>
                    <p className="font-medium text-slate-900">{employeeData.employment.department || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-900">
                  Al confirmar, se creará el registro del empleado y se enviará un correo de bienvenida a <strong>{employeeData.personalInfo.email}</strong>
                </p>
              </div>
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
