import { useState, useEffect } from 'react';
import { Building2, FileText, Briefcase, Settings, CheckCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import StepWizard from '../ui/StepWizard';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Autocomplete from '../ui/Autocomplete';
import ValidationAlert from '../ui/ValidationAlert';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';

interface AddCompanyWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editMode?: boolean;
  companyToEdit?: any;
}

interface CompanyData {
  basicInfo: {
    code: string;
    legalName: string;
    tradeName: string;
    taxId: string;
    email: string;
    phone: string;
    website: string;
  };
  address: {
    address: string;
    locationId: string;
  };
  payrollConfig: {
    contributorTypeCode: string;
    contributionRegimeCode: string;
    companyTypeCode: string;
    companyDocumentTypeCode: string;
    economicActivityCode: string;
    locationCode: string;
    submissionType: string;
    payrollPeriodFormat: string;
    currencyCode: string;
    minimumWage: string;
  };
  additional: {
    legalRepName: string;
    legalRepTitle: string;
    legalRepId: string;
    registrationDate: string;
    industrySector: string;
    employeeCountRange: string;
    payrollStartDay: string;
    payrollEndDay: string;
    paymentDay: string;
    fiscalYearStartMonth: string;
  };
}

const steps = [
  { id: 'basic', title: 'Información Básica', description: 'Datos generales de la empresa' },
  { id: 'payroll', title: 'Configuración de Nómina', description: 'Parámetros para procesamiento de nómina' },
  { id: 'additional', title: 'Información Adicional', description: 'Datos complementarios' },
  { id: 'review', title: 'Revisión', description: 'Verificar datos ingresados' }
];

export default function AddCompanyWizard({ isOpen, onClose, onSuccess, editMode = false, companyToEdit }: AddCompanyWizardProps) {
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showValidationAlert, setShowValidationAlert] = useState(false);

  const [locations, setLocations] = useState<any[]>([]);
  const [contributorTypes, setContributorTypes] = useState<any[]>([]);
  const [contributionRegimes, setContributionRegimes] = useState<any[]>([]);
  const [companyTypes, setCompanyTypes] = useState<any[]>([]);
  const [companyDocumentTypes, setCompanyDocumentTypes] = useState<any[]>([]);
  const [economicActivities, setEconomicActivities] = useState<any[]>([]);
  const [submissionTypes, setSubmissionTypes] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);

  const [companyData, setCompanyData] = useState<CompanyData>({
    basicInfo: {
      code: '',
      legalName: '',
      tradeName: '',
      taxId: '',
      email: '',
      phone: '',
      website: ''
    },
    address: {
      address: '',
      locationId: ''
    },
    payrollConfig: {
      contributorTypeCode: '',
      contributionRegimeCode: '',
      companyTypeCode: '',
      companyDocumentTypeCode: '',
      economicActivityCode: '',
      locationCode: '',
      submissionType: 'ORIG',
      payrollPeriodFormat: 'MM/AAAA',
      currencyCode: 'USD',
      minimumWage: ''
    },
    additional: {
      legalRepName: '',
      legalRepTitle: '',
      legalRepId: '',
      registrationDate: '',
      industrySector: '',
      employeeCountRange: '',
      payrollStartDay: '1',
      payrollEndDay: '30',
      paymentDay: '30',
      fiscalYearStartMonth: '1'
    }
  });

  useEffect(() => {
    if (isOpen) {
      loadMasterData();
      if (editMode && companyToEdit) {
        loadCompanyData();
      }
    }
  }, [isOpen, editMode, companyToEdit]);

  const loadMasterData = async () => {
    try {
      const [
        locationsRes,
        contributorTypesRes,
        contributionRegimesRes,
        companyTypesRes,
        companyDocumentTypesRes,
        economicActivitiesRes,
        submissionTypesRes,
        currenciesRes
      ] = await Promise.all([
        supabase.from('locations').select('*').eq('active', true).order('name'),
        supabase.from('contributor_types').select('*').eq('is_active', true).order('display_order'),
        supabase.from('contribution_regimes').select('*').eq('is_active', true).order('display_order'),
        supabase.from('company_types').select('*').eq('is_active', true).order('display_order'),
        supabase.from('company_document_types').select('*').eq('is_active', true).order('display_order'),
        supabase.from('economic_activities').select('*').eq('is_active', true).order('display_order'),
        supabase.from('submission_types').select('*').eq('is_active', true).order('display_order'),
        supabase.from('currencies').select('*').eq('active', true).order('name')
      ]);

      if (locationsRes.data) setLocations(locationsRes.data);
      if (contributorTypesRes.data) setContributorTypes(contributorTypesRes.data);
      if (contributionRegimesRes.data) setContributionRegimes(contributionRegimesRes.data);
      if (companyTypesRes.data) setCompanyTypes(companyTypesRes.data);
      if (companyDocumentTypesRes.data) setCompanyDocumentTypes(companyDocumentTypesRes.data);
      if (economicActivitiesRes.data) setEconomicActivities(economicActivitiesRes.data);
      if (submissionTypesRes.data) setSubmissionTypes(submissionTypesRes.data);
      if (currenciesRes.data) setCurrencies(currenciesRes.data);
    } catch (error) {
      console.error('Error loading master data:', error);
      toast.error('Error al cargar datos maestros');
    }
  };

  const loadCompanyData = () => {
    if (!companyToEdit) return;

    setCompanyData({
      basicInfo: {
        code: companyToEdit.code || '',
        legalName: companyToEdit.legal_name || '',
        tradeName: companyToEdit.trade_name || '',
        taxId: companyToEdit.tax_id || '',
        email: companyToEdit.email || '',
        phone: companyToEdit.phone || '',
        website: companyToEdit.website || ''
      },
      address: {
        address: companyToEdit.address || '',
        locationId: companyToEdit.location_id || ''
      },
      payrollConfig: {
        contributorTypeCode: companyToEdit.contributor_type_code || '',
        contributionRegimeCode: companyToEdit.contribution_regime_code || '',
        companyTypeCode: companyToEdit.company_type_code || '',
        companyDocumentTypeCode: companyToEdit.company_document_type_code || '',
        economicActivityCode: companyToEdit.economic_activity_code || '',
        locationCode: companyToEdit.location_code || '',
        submissionType: companyToEdit.submission_type || 'ORIG',
        payrollPeriodFormat: companyToEdit.payroll_period_format || 'MM/AAAA',
        currencyCode: companyToEdit.currency_code || 'USD',
        minimumWage: companyToEdit.minimum_wage?.toString() || ''
      },
      additional: {
        legalRepName: companyToEdit.legal_representative_name || '',
        legalRepTitle: companyToEdit.legal_representative_title || '',
        legalRepId: companyToEdit.legal_representative_id || '',
        registrationDate: companyToEdit.registration_date || '',
        industrySector: companyToEdit.industry_sector || '',
        employeeCountRange: companyToEdit.employee_count_range || '',
        payrollStartDay: companyToEdit.payroll_start_day?.toString() || '1',
        payrollEndDay: companyToEdit.payroll_end_day?.toString() || '30',
        paymentDay: companyToEdit.payment_day?.toString() || '30',
        fiscalYearStartMonth: companyToEdit.fiscal_year_start_month?.toString() || '1'
      }
    });
  };

  const validateCurrentStep = (): boolean => {
    const errors: string[] = [];

    switch (currentStep) {
      case 0:
        if (!companyData.basicInfo.legalName.trim()) errors.push('Razón Social');
        if (!companyData.basicInfo.tradeName.trim()) errors.push('Nombre Comercial');
        if (!companyData.basicInfo.taxId.trim()) errors.push('RFC/NIT/Tax ID');
        break;
      case 1:
        break;
      case 2:
        break;
    }

    setValidationErrors(errors);
    setShowValidationAlert(errors.length > 0);
    return errors.length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep() && currentStep < steps.length - 1) {
      setValidationErrors([]);
      setShowValidationAlert(false);
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setValidationErrors([]);
      setShowValidationAlert(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    try {
      let code = companyData.basicInfo.code;

      const payload: any = {
        legal_name: companyData.basicInfo.legalName,
        trade_name: companyData.basicInfo.tradeName,
        tax_id: companyData.basicInfo.taxId,
        email: companyData.basicInfo.email || null,
        phone: companyData.basicInfo.phone || null,
        website: companyData.basicInfo.website || null,
        address: companyData.address.address || null,
        location_id: companyData.address.locationId || null,
        contributor_type_code: companyData.payrollConfig.contributorTypeCode || null,
        contribution_regime_code: companyData.payrollConfig.contributionRegimeCode || null,
        company_type_code: companyData.payrollConfig.companyTypeCode || null,
        company_document_type_code: companyData.payrollConfig.companyDocumentTypeCode || null,
        economic_activity_code: companyData.payrollConfig.economicActivityCode || null,
        location_code: companyData.payrollConfig.locationCode || null,
        submission_type: companyData.payrollConfig.submissionType || null,
        payroll_period_format: companyData.payrollConfig.payrollPeriodFormat || null,
        currency_code: companyData.payrollConfig.currencyCode || 'USD',
        minimum_wage: companyData.payrollConfig.minimumWage ? parseFloat(companyData.payrollConfig.minimumWage) : null,
        legal_representative_name: companyData.additional.legalRepName || null,
        legal_representative_title: companyData.additional.legalRepTitle || null,
        legal_representative_id: companyData.additional.legalRepId || null,
        registration_date: companyData.additional.registrationDate || null,
        industry_sector: companyData.additional.industrySector || null,
        employee_count_range: companyData.additional.employeeCountRange || null,
        payroll_start_day: parseInt(companyData.additional.payrollStartDay) || 1,
        payroll_end_day: parseInt(companyData.additional.payrollEndDay) || 30,
        payment_day: parseInt(companyData.additional.paymentDay) || 30,
        fiscal_year_start_month: parseInt(companyData.additional.fiscalYearStartMonth) || 1
      };

      if (editMode && companyToEdit) {
        const { error } = await supabase
          .from('companies')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', companyToEdit.id);

        if (error) throw error;
        toast.success('Empresa actualizada correctamente');
      } else {
        if (!code) {
          const { data: generatedCode, error: codeError } = await supabase
            .rpc('generate_entity_code', {
              p_entity_type: 'company',
              p_company_id: null
            });

          if (codeError) throw codeError;
          code = generatedCode;
        }

        const { error } = await supabase
          .from('companies')
          .insert({ ...payload, code });

        if (error) throw error;
        toast.success('Empresa creada correctamente');
      }

      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error saving company:', error);
      toast.error('Error al guardar la empresa');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    setValidationErrors([]);
    setShowValidationAlert(false);
    setCompanyData({
      basicInfo: { code: '', legalName: '', tradeName: '', taxId: '', email: '', phone: '', website: '' },
      address: { address: '', locationId: '' },
      payrollConfig: {
        contributorTypeCode: '',
        contributionRegimeCode: '',
        companyTypeCode: '',
        companyDocumentTypeCode: '',
        economicActivityCode: '',
        locationCode: '',
        submissionType: 'ORIG',
        payrollPeriodFormat: 'MM/AAAA',
        currencyCode: 'USD',
        minimumWage: ''
      },
      additional: {
        legalRepName: '',
        legalRepTitle: '',
        legalRepId: '',
        registrationDate: '',
        industrySector: '',
        employeeCountRange: '',
        payrollStartDay: '1',
        payrollEndDay: '30',
        paymentDay: '30',
        fiscalYearStartMonth: '1'
      }
    });
    onClose();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Información Básica</h3>
                <p className="text-sm text-slate-500">Ingrese los datos generales de la empresa</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Código {!editMode && <span className="text-xs text-slate-500">(se generará automáticamente si se deja vacío)</span>}
                </label>
                <Input
                  value={companyData.basicInfo.code}
                  onChange={(e) => setCompanyData(prev => ({
                    ...prev,
                    basicInfo: { ...prev.basicInfo, code: e.target.value }
                  }))}
                  placeholder={editMode ? companyData.basicInfo.code : "Se generará automáticamente"}
                  disabled={!!editMode}
                />
              </div>
              <Input
                label="RFC / NIT / Tax ID"
                value={companyData.basicInfo.taxId}
                onChange={(e) => setCompanyData(prev => ({
                  ...prev,
                  basicInfo: { ...prev.basicInfo, taxId: e.target.value }
                }))}
                required
                placeholder="ABC123456XYZ"
                tooltip="Identificador fiscal de la empresa según el país"
              />
            </div>

            <Input
              label="Razón Social"
              value={companyData.basicInfo.legalName}
              onChange={(e) => setCompanyData(prev => ({
                ...prev,
                basicInfo: { ...prev.basicInfo, legalName: e.target.value }
              }))}
              required
              placeholder="Nombre legal completo de la empresa"
              tooltip="Nombre legal registrado de la empresa"
            />

            <Input
              label="Nombre Comercial"
              value={companyData.basicInfo.tradeName}
              onChange={(e) => setCompanyData(prev => ({
                ...prev,
                basicInfo: { ...prev.basicInfo, tradeName: e.target.value }
              }))}
              required
              placeholder="Nombre comercial de la empresa"
              tooltip="Nombre con el que opera comercialmente"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                value={companyData.basicInfo.email}
                onChange={(e) => setCompanyData(prev => ({
                  ...prev,
                  basicInfo: { ...prev.basicInfo, email: e.target.value }
                }))}
                placeholder="contacto@empresa.com"
                tooltip="Correo electrónico de contacto de la empresa"
                onValidate={(value) => {
                  if (!value.trim()) return '';
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  return emailRegex.test(value) ? '' : 'Email inválido';
                }}
              />
              <Input
                label="Teléfono"
                type="tel"
                value={companyData.basicInfo.phone}
                onChange={(e) => setCompanyData(prev => ({
                  ...prev,
                  basicInfo: { ...prev.basicInfo, phone: e.target.value }
                }))}
                placeholder="+52 55 1234 5678"
                tooltip="Teléfono de contacto principal"
              />
            </div>

            <Input
              label="Sitio Web"
              type="url"
              value={companyData.basicInfo.website}
              onChange={(e) => setCompanyData(prev => ({
                ...prev,
                basicInfo: { ...prev.basicInfo, website: e.target.value }
              }))}
              placeholder="https://www.empresa.com"
              tooltip="Sitio web corporativo de la empresa"
            />

            <Input
              label="Dirección"
              value={companyData.address.address}
              onChange={(e) => setCompanyData(prev => ({
                ...prev,
                address: { ...prev.address, address: e.target.value }
              }))}
              placeholder="Dirección completa de la empresa"
            />

            <Autocomplete
              label="Ubicación Principal"
              value={companyData.address.locationId}
              options={locations.map(loc => ({
                value: loc.id,
                label: `${loc.name} - ${loc.city}, ${loc.country}`
              }))}
              onChange={(value) => setCompanyData(prev => ({
                ...prev,
                address: { ...prev.address, locationId: value }
              }))}
              placeholder="Seleccionar ubicación..."
            />
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Configuración de Nómina</h3>
                <p className="text-sm text-slate-500">Parámetros necesarios para el procesamiento de nómina</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                Estos parámetros son opcionales pero necesarios para generar reportes de nómina y cumplir con regulaciones locales.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Autocomplete
                label="Tipo de Contribuyente BPS (NC01)"
                value={companyData.payrollConfig.contributorTypeCode}
                options={contributorTypes.map(ct => ({
                  value: ct.code,
                  label: `${ct.code} - ${ct.name}`
                }))}
                onChange={(value) => setCompanyData(prev => ({
                  ...prev,
                  payrollConfig: { ...prev.payrollConfig, contributorTypeCode: value }
                }))}
                placeholder="Seleccionar tipo..."
              />

              <Autocomplete
                label="Tipo de Aporte / Régimen (NC02)"
                value={companyData.payrollConfig.contributionRegimeCode}
                options={contributionRegimes.map(cr => ({
                  value: cr.code,
                  label: cr.name
                }))}
                onChange={(value) => setCompanyData(prev => ({
                  ...prev,
                  payrollConfig: { ...prev.payrollConfig, contributionRegimeCode: value }
                }))}
                placeholder="Seleccionar régimen..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Autocomplete
                label="Tipo de Empresa (NC03)"
                value={companyData.payrollConfig.companyTypeCode}
                options={companyTypes.map(ct => ({
                  value: ct.code,
                  label: ct.name
                }))}
                onChange={(value) => setCompanyData(prev => ({
                  ...prev,
                  payrollConfig: { ...prev.payrollConfig, companyTypeCode: value }
                }))}
                placeholder="Seleccionar tipo..."
              />

              <Autocomplete
                label="Tipo de Documento Empresa (NC04)"
                value={companyData.payrollConfig.companyDocumentTypeCode}
                options={companyDocumentTypes.map(cdt => ({
                  value: cdt.code,
                  label: `${cdt.code} - ${cdt.name}`
                }))}
                onChange={(value) => setCompanyData(prev => ({
                  ...prev,
                  payrollConfig: { ...prev.payrollConfig, companyDocumentTypeCode: value }
                }))}
                placeholder="Seleccionar tipo..."
              />
            </div>

            <Autocomplete
              label="Actividad Económica CIUU/GIRO (NC05)"
              value={companyData.payrollConfig.economicActivityCode}
              options={economicActivities.map(ea => ({
                value: ea.code,
                label: `${ea.code} - ${ea.name}`
              }))}
              onChange={(value) => setCompanyData(prev => ({
                ...prev,
                payrollConfig: { ...prev.payrollConfig, economicActivityCode: value }
              }))}
              placeholder="Seleccionar actividad..."
            />

            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Código de Ubicación INE (NC06)"
                value={companyData.payrollConfig.locationCode}
                onChange={(e) => setCompanyData(prev => ({
                  ...prev,
                  payrollConfig: { ...prev.payrollConfig, locationCode: e.target.value }
                }))}
                placeholder="Código INE"
                tooltip="Código de departamento/localidad según INE"
              />

              <Autocomplete
                label="Tipo de Envío (NC07)"
                value={companyData.payrollConfig.submissionType}
                options={submissionTypes.map(st => ({
                  value: st.code,
                  label: st.name
                }))}
                onChange={(value) => setCompanyData(prev => ({
                  ...prev,
                  payrollConfig: { ...prev.payrollConfig, submissionType: value }
                }))}
                placeholder="Seleccionar tipo..."
              />

              <Input
                label="Formato Período (NC08)"
                value={companyData.payrollConfig.payrollPeriodFormat}
                onChange={(e) => setCompanyData(prev => ({
                  ...prev,
                  payrollConfig: { ...prev.payrollConfig, payrollPeriodFormat: e.target.value }
                }))}
                placeholder="MM/AAAA"
                tooltip="Formato de período de nómina, generalmente MM/AAAA"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Autocomplete
                label="Moneda"
                value={companyData.payrollConfig.currencyCode}
                options={currencies.map(cur => ({
                  value: cur.code,
                  label: `${cur.code} - ${cur.name} (${cur.symbol})`
                }))}
                onChange={(value) => setCompanyData(prev => ({
                  ...prev,
                  payrollConfig: { ...prev.payrollConfig, currencyCode: value }
                }))}
                placeholder="Seleccionar moneda..."
              />

              <Input
                label="Salario Mínimo"
                type="number"
                value={companyData.payrollConfig.minimumWage}
                onChange={(e) => setCompanyData(prev => ({
                  ...prev,
                  payrollConfig: { ...prev.payrollConfig, minimumWage: e.target.value }
                }))}
                placeholder="0.00"
                tooltip="Salario mínimo legal vigente en la moneda seleccionada"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Settings className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Información Adicional</h3>
                <p className="text-sm text-slate-500">Datos complementarios y configuraciones</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-3">Representante Legal</h4>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Nombre Completo"
                    value={companyData.additional.legalRepName}
                    onChange={(e) => setCompanyData(prev => ({
                      ...prev,
                      additional: { ...prev.additional, legalRepName: e.target.value }
                    }))}
                    placeholder="Nombre del representante legal"
                  />
                  <Input
                    label="Cargo"
                    value={companyData.additional.legalRepTitle}
                    onChange={(e) => setCompanyData(prev => ({
                      ...prev,
                      additional: { ...prev.additional, legalRepTitle: e.target.value }
                    }))}
                    placeholder="Director General"
                  />
                </div>
                <Input
                  label="Documento de Identidad"
                  value={companyData.additional.legalRepId}
                  onChange={(e) => setCompanyData(prev => ({
                    ...prev,
                    additional: { ...prev.additional, legalRepId: e.target.value }
                  }))}
                  placeholder="Número de identificación"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Fecha de Registro"
                type="date"
                value={companyData.additional.registrationDate}
                onChange={(e) => setCompanyData(prev => ({
                  ...prev,
                  additional: { ...prev.additional, registrationDate: e.target.value }
                }))}
                tooltip="Fecha de constitución de la empresa"
              />
              <Input
                label="Sector Industrial"
                value={companyData.additional.industrySector}
                onChange={(e) => setCompanyData(prev => ({
                  ...prev,
                  additional: { ...prev.additional, industrySector: e.target.value }
                }))}
                placeholder="Tecnología, Manufactura, etc."
              />
            </div>

            <Autocomplete
              label="Rango de Empleados"
              value={companyData.additional.employeeCountRange}
              options={[
                { value: '1-10', label: '1-10 empleados' },
                { value: '11-50', label: '11-50 empleados' },
                { value: '51-200', label: '51-200 empleados' },
                { value: '201-500', label: '201-500 empleados' },
                { value: '501+', label: 'Más de 500 empleados' }
              ]}
              onChange={(value) => setCompanyData(prev => ({
                ...prev,
                additional: { ...prev.additional, employeeCountRange: value }
              }))}
              placeholder="Seleccionar rango..."
            />

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-3">Configuración de Períodos</h4>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Día Inicio Nómina"
                  type="number"
                  min="1"
                  max="31"
                  value={companyData.additional.payrollStartDay}
                  onChange={(e) => setCompanyData(prev => ({
                    ...prev,
                    additional: { ...prev.additional, payrollStartDay: e.target.value }
                  }))}
                  tooltip="Día del mes en que inicia el período de nómina"
                />
                <Input
                  label="Día Fin Nómina"
                  type="number"
                  min="1"
                  max="31"
                  value={companyData.additional.payrollEndDay}
                  onChange={(e) => setCompanyData(prev => ({
                    ...prev,
                    additional: { ...prev.additional, payrollEndDay: e.target.value }
                  }))}
                  tooltip="Día del mes en que finaliza el período de nómina"
                />
                <Input
                  label="Día de Pago"
                  type="number"
                  min="1"
                  max="31"
                  value={companyData.additional.paymentDay}
                  onChange={(e) => setCompanyData(prev => ({
                    ...prev,
                    additional: { ...prev.additional, paymentDay: e.target.value }
                  }))}
                  tooltip="Día del mes en que se realiza el pago"
                />
              </div>
              <div className="mt-4">
                <Autocomplete
                  label="Mes de Inicio Año Fiscal"
                  value={companyData.additional.fiscalYearStartMonth}
                  options={[
                    { value: '1', label: 'Enero' },
                    { value: '2', label: 'Febrero' },
                    { value: '3', label: 'Marzo' },
                    { value: '4', label: 'Abril' },
                    { value: '5', label: 'Mayo' },
                    { value: '6', label: 'Junio' },
                    { value: '7', label: 'Julio' },
                    { value: '8', label: 'Agosto' },
                    { value: '9', label: 'Septiembre' },
                    { value: '10', label: 'Octubre' },
                    { value: '11', label: 'Noviembre' },
                    { value: '12', label: 'Diciembre' }
                  ]}
                  onChange={(value) => setCompanyData(prev => ({
                    ...prev,
                    additional: { ...prev.additional, fiscalYearStartMonth: value }
                  }))}
                  placeholder="Seleccionar mes..."
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Revisión de Datos</h3>
                <p className="text-sm text-slate-500">Verifique la información antes de guardar</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Información Básica
                </h4>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <dt className="text-slate-600">Código:</dt>
                  <dd className="text-slate-900 font-medium">{companyData.basicInfo.code || '(Se generará automáticamente)'}</dd>
                  <dt className="text-slate-600">Razón Social:</dt>
                  <dd className="text-slate-900 font-medium">{companyData.basicInfo.legalName || '-'}</dd>
                  <dt className="text-slate-600">Nombre Comercial:</dt>
                  <dd className="text-slate-900 font-medium">{companyData.basicInfo.tradeName || '-'}</dd>
                  <dt className="text-slate-600">RFC/NIT:</dt>
                  <dd className="text-slate-900 font-medium">{companyData.basicInfo.taxId || '-'}</dd>
                  <dt className="text-slate-600">Email:</dt>
                  <dd className="text-slate-900">{companyData.basicInfo.email || '-'}</dd>
                  <dt className="text-slate-600">Teléfono:</dt>
                  <dd className="text-slate-900">{companyData.basicInfo.phone || '-'}</dd>
                </dl>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Configuración de Nómina
                </h4>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <dt className="text-slate-600">Tipo Contribuyente:</dt>
                  <dd className="text-slate-900">{companyData.payrollConfig.contributorTypeCode || '-'}</dd>
                  <dt className="text-slate-600">Régimen:</dt>
                  <dd className="text-slate-900">{companyData.payrollConfig.contributionRegimeCode || '-'}</dd>
                  <dt className="text-slate-600">Tipo de Empresa:</dt>
                  <dd className="text-slate-900">{companyData.payrollConfig.companyTypeCode || '-'}</dd>
                  <dt className="text-slate-600">Moneda:</dt>
                  <dd className="text-slate-900 font-medium">{companyData.payrollConfig.currencyCode}</dd>
                  <dt className="text-slate-600">Salario Mínimo:</dt>
                  <dd className="text-slate-900">{companyData.payrollConfig.minimumWage || '-'}</dd>
                </dl>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Información Adicional
                </h4>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <dt className="text-slate-600">Representante Legal:</dt>
                  <dd className="text-slate-900">{companyData.additional.legalRepName || '-'}</dd>
                  <dt className="text-slate-600">Cargo:</dt>
                  <dd className="text-slate-900">{companyData.additional.legalRepTitle || '-'}</dd>
                  <dt className="text-slate-600">Período Nómina:</dt>
                  <dd className="text-slate-900">Día {companyData.additional.payrollStartDay} al {companyData.additional.payrollEndDay}</dd>
                  <dt className="text-slate-600">Día de Pago:</dt>
                  <dd className="text-slate-900">Día {companyData.additional.paymentDay} de cada mes</dd>
                </dl>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={editMode ? 'Editar Empresa' : 'Nueva Empresa'} size="xl" showClose={false}>
      <StepWizard steps={steps} currentStep={currentStep}>
        {showValidationAlert && validationErrors.length > 0 && (
          <ValidationAlert
            errors={validationErrors}
            onClose={() => {
              setShowValidationAlert(false);
              setValidationErrors([]);
            }}
          />
        )}
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
            <Button variant="secondary" onClick={handleClose}>
              Cancelar
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button variant="primary" onClick={handleNext}>
                Siguiente
              </Button>
            ) : (
              <Button variant="primary" onClick={handleSubmit} isLoading={isSubmitting}>
                {editMode ? 'Actualizar Empresa' : 'Crear Empresa'}
              </Button>
            )}
          </div>
        </div>
      </StepWizard>
    </Modal>
  );
}
