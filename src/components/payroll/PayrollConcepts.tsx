import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, DollarSign, TrendingUp, TrendingDown, Percent, Calculator, FileText, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useToast } from '../../hooks/useToast';
import Button from '../ui/Button';

interface PayrollConcept {
  id: string;
  company_id: string;
  code: string;
  name: string;
  category: 'perception' | 'deduction' | 'contribution' | 'benefit';
  calculation_type: 'fixed' | 'percentage' | 'formula';
  percentage_value?: number;
  fixed_amount?: number;
  formula_expression?: string;
  active: boolean;
  created_at: string;
}

interface PayrollFormula {
  id: string;
  name: string;
  code: string;
  expression: string;
  description: string;
}

const AVAILABLE_FORMULAS: PayrollFormula[] = [
  {
    id: 'aguinaldo',
    name: 'Aguinaldo (Salario Vacacional)',
    code: 'AGUINALDO',
    expression: 'base_salary / 12',
    description: 'Cálculo de aguinaldo: 1/12 del salario mensual'
  },
  {
    id: 'irpf',
    name: 'IRPF (Impuesto a la Renta)',
    code: 'IRPF',
    expression: '(base_salary - deductions) * tax_rate',
    description: 'Impuesto progresivo según tabla BPS'
  },
  {
    id: 'overtime',
    name: 'Horas Extra (50%)',
    code: 'OVERTIME_50',
    expression: '(base_salary / 192) * hours * 1.5',
    description: 'Horas extra con recargo del 50%'
  },
  {
    id: 'overtime_100',
    name: 'Horas Extra (100%)',
    code: 'OVERTIME_100',
    expression: '(base_salary / 192) * hours * 2',
    description: 'Horas extra con recargo del 100%'
  },
  {
    id: 'prorated',
    name: 'Prorrateo por Días',
    code: 'PRORATED',
    expression: 'base_salary * (worked_days / total_days)',
    description: 'Cálculo proporcional según días trabajados'
  }
];

export default function PayrollConcepts() {
  const { selectedCompanyId } = useCompany();
  const { showToast } = useToast();
  const [concepts, setConcepts] = useState<PayrollConcept[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingConcept, setEditingConcept] = useState<PayrollConcept | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'perception' as const,
    calculation_type: 'percentage' as const,
    percentage_value: 0,
    fixed_amount: 0,
    formula_expression: '',
    active: true,
  });

  useEffect(() => {
    if (selectedCompanyId) {
      loadConcepts();
    }
  }, [selectedCompanyId]);

  const loadConcepts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payroll_concepts')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setConcepts(data || []);
    } catch (error) {
      showToast('Error al cargar conceptos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!formData.code || !formData.name) {
      showToast('Complete todos los campos obligatorios', 'error');
      return;
    }

    if (formData.calculation_type === 'percentage' && (!formData.percentage_value || formData.percentage_value <= 0)) {
      showToast('Ingrese un porcentaje válido', 'error');
      return;
    }

    if (formData.calculation_type === 'fixed' && (!formData.fixed_amount || formData.fixed_amount <= 0)) {
      showToast('Ingrese un monto válido', 'error');
      return;
    }

    if (formData.calculation_type === 'formula' && !formData.formula_expression) {
      showToast('Seleccione una fórmula', 'error');
      return;
    }

    try {
      const dataToSave = {
        code: formData.code.toUpperCase(),
        name: formData.name,
        category: formData.category,
        calculation_type: formData.calculation_type,
        percentage_value: formData.calculation_type === 'percentage' ? formData.percentage_value / 100 : null,
        fixed_amount: formData.calculation_type === 'fixed' ? formData.fixed_amount : null,
        formula_expression: formData.calculation_type === 'formula' ? formData.formula_expression : null,
        active: formData.active,
        company_id: selectedCompanyId
      };

      if (editingConcept) {
        const { error } = await supabase
          .from('payroll_concepts')
          .update(dataToSave)
          .eq('id', editingConcept.id);

        if (error) throw error;
        showToast('Concepto actualizado correctamente', 'success');
      } else {
        const { error } = await supabase
          .from('payroll_concepts')
          .insert([dataToSave]);

        if (error) throw error;
        showToast('Concepto creado correctamente', 'success');
      }

      setShowModal(false);
      resetForm();
      loadConcepts();
    } catch (error) {
      console.error('Error saving concept:', error);
      showToast('Error al guardar concepto', 'error');
    }
  };

  const handleEdit = (concept: PayrollConcept) => {
    setEditingConcept(concept);
    setFormData({
      code: concept.code,
      name: concept.name,
      category: concept.category,
      calculation_type: concept.calculation_type,
      percentage_value: concept.percentage_value ? concept.percentage_value * 100 : 0,
      fixed_amount: concept.fixed_amount || 0,
      formula_expression: concept.formula_expression || '',
      active: concept.active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este concepto?')) return;

    try {
      const { error } = await supabase
        .from('payroll_concepts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showToast('Concepto eliminado correctamente', 'success');
      loadConcepts();
    } catch (error) {
      showToast('Error al eliminar concepto', 'error');
    }
  };

  const resetForm = () => {
    setEditingConcept(null);
    setFormData({
      code: '',
      name: '',
      category: 'perception',
      calculation_type: 'percentage',
      percentage_value: 0,
      fixed_amount: 0,
      formula_expression: '',
      active: true,
    });
  };

  const getConceptTypeIcon = (type: string) => {
    switch (type) {
      case 'perception': return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'deduction': return <TrendingDown className="w-5 h-5 text-red-600" />;
      case 'contribution': return <DollarSign className="w-5 h-5 text-blue-600" />;
      case 'benefit': return <CheckCircle2 className="w-5 h-5 text-purple-600" />;
      default: return <DollarSign className="w-5 h-5 text-slate-600" />;
    }
  };

  const getConceptTypeColor = (type: string) => {
    switch (type) {
      case 'perception': return 'bg-green-50 text-green-700 border-green-200';
      case 'deduction': return 'bg-red-50 text-red-700 border-red-200';
      case 'contribution': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'benefit': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getCalculationTypeIcon = (type: string) => {
    switch (type) {
      case 'percentage': return <Percent className="w-4 h-4" />;
      case 'formula': return <Calculator className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const conceptsByType = {
    perception: concepts.filter(c => c.category === 'perception'),
    deduction: concepts.filter(c => c.category === 'deduction'),
    contribution: concepts.filter(c => c.category === 'contribution'),
    benefit: concepts.filter(c => c.category === 'benefit'),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Conceptos de Nómina</h1>
          <p className="text-slate-600">Gestiona haberes, descuentos y aportes patronales</p>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Concepto
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-green-900">Haberes</h3>
            <div className="p-2 bg-green-200 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-green-900">{conceptsByType.perception.length}</p>
          <p className="text-xs text-green-700 mt-1">Percepciones activas</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-red-900">Descuentos</h3>
            <div className="p-2 bg-red-200 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-red-900">{conceptsByType.deduction.length}</p>
          <p className="text-xs text-red-700 mt-1">Deducciones activas</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-blue-900">Aportes</h3>
            <div className="p-2 bg-blue-200 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-blue-900">{conceptsByType.contribution.length}</p>
          <p className="text-xs text-blue-700 mt-1">Contribuciones patronales</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-purple-900">Beneficios</h3>
            <div className="p-2 bg-purple-200 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-purple-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-purple-900">{conceptsByType.benefit.length}</p>
          <p className="text-xs text-purple-700 mt-1">Beneficios adicionales</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Todos los Conceptos</h2>
        </div>

        {concepts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Código</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Categoría</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Cálculo</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {concepts.map((concept) => (
                  <tr key={concept.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono font-semibold text-slate-900 bg-slate-100 px-2 py-1 rounded">{concept.code}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {getConceptTypeIcon(concept.category)}
                        <span className="text-sm font-medium text-slate-900">{concept.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border ${getConceptTypeColor(concept.category)}`}>
                        {concept.category === 'perception' ? 'Haber' : concept.category === 'deduction' ? 'Descuento' : concept.category === 'contribution' ? 'Aporte' : 'Beneficio'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        {getCalculationTypeIcon(concept.calculation_type)}
                        <span className="capitalize">{concept.calculation_type === 'fixed' ? 'Monto fijo' : concept.calculation_type === 'percentage' ? 'Porcentaje' : 'Fórmula'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-slate-900">
                        {concept.calculation_type === 'percentage' && concept.percentage_value
                          ? `${(concept.percentage_value * 100).toFixed(2)}%`
                          : concept.calculation_type === 'fixed' && concept.fixed_amount
                          ? `$${concept.fixed_amount.toFixed(2)}`
                          : 'Fórmula'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${concept.active ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${concept.active ? 'bg-green-600' : 'bg-slate-400'}`}></div>
                        {concept.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(concept)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(concept.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium mb-2">No hay conceptos configurados</p>
            <p className="text-sm text-slate-400 mb-6">Crea tu primer concepto de nómina para comenzar</p>
            <Button onClick={() => { resetForm(); setShowModal(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Primer Concepto
            </Button>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-8 py-6 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {editingConcept ? 'Editar Concepto' : 'Nuevo Concepto'}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {editingConcept ? 'Modifica los datos del concepto' : 'Complete la información del nuevo concepto de nómina'}
                </p>
              </div>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {/* Basic Info Section */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Información Básica
                </h3>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Código <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono"
                      placeholder="Ej: BPS, FRL, IRPF"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Ej: Aporte Jubilatorio"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Category Section */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  Categoría y Tipo de Cálculo
                </h3>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Tipo de Concepto
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'perception', label: 'Haber', icon: TrendingUp, color: 'green' },
                        { value: 'deduction', label: 'Descuento', icon: TrendingDown, color: 'red' },
                        { value: 'contribution', label: 'Aporte', icon: DollarSign, color: 'blue' },
                        { value: 'benefit', label: 'Beneficio', icon: CheckCircle2, color: 'purple' },
                      ].map((type) => {
                        const Icon = type.icon;
                        const isSelected = formData.category === type.value;
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, category: type.value as any })}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              isSelected
                                ? `border-${type.color}-500 bg-${type.color}-50`
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <Icon className={`w-6 h-6 mx-auto mb-2 ${isSelected ? `text-${type.color}-600` : 'text-slate-400'}`} />
                            <p className={`text-sm font-medium ${isSelected ? `text-${type.color}-900` : 'text-slate-600'}`}>
                              {type.label}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Tipo de Cálculo
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: 'percentage', label: 'Porcentaje', icon: Percent, desc: 'Sobre el salario base' },
                        { value: 'fixed', label: 'Monto Fijo', icon: DollarSign, desc: 'Cantidad fija mensual' },
                        { value: 'formula', label: 'Fórmula', icon: Calculator, desc: 'Cálculo personalizado' },
                      ].map((type) => {
                        const Icon = type.icon;
                        const isSelected = formData.calculation_type === type.value;
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, calculation_type: type.value as any })}
                            className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                              <div className="flex-1">
                                <p className={`text-sm font-semibold ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>
                                  {type.label}
                                </p>
                                <p className={`text-xs ${isSelected ? 'text-blue-600' : 'text-slate-500'}`}>
                                  {type.desc}
                                </p>
                              </div>
                              {isSelected && (
                                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Value Configuration */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-blue-600" />
                  Configuración de Valor
                </h3>

                {formData.calculation_type === 'percentage' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <label className="block text-sm font-semibold text-blue-900 mb-3">
                      Porcentaje a aplicar
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.percentage_value}
                        onChange={(e) => setFormData({ ...formData, percentage_value: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-3 pr-12 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg font-semibold"
                        placeholder="0.00"
                        required
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600 font-semibold">
                        %
                      </div>
                    </div>
                    <p className="text-xs text-blue-700 mt-2">
                      <AlertCircle className="w-3 h-3 inline mr-1" />
                      Se aplicará sobre el salario base del empleado
                    </p>
                  </div>
                )}

                {formData.calculation_type === 'fixed' && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <label className="block text-sm font-semibold text-green-900 mb-3">
                      Monto fijo mensual
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-green-600 font-semibold">
                        $
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.fixed_amount}
                        onChange={(e) => setFormData({ ...formData, fixed_amount: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-3 pl-10 border border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-lg font-semibold"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <p className="text-xs text-green-700 mt-2">
                      <AlertCircle className="w-3 h-3 inline mr-1" />
                      Este monto se aplicará igual para todos los empleados
                    </p>
                  </div>
                )}

                {formData.calculation_type === 'formula' && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                    <label className="block text-sm font-semibold text-purple-900 mb-3">
                      Selecciona una fórmula
                    </label>
                    <div className="space-y-3">
                      {AVAILABLE_FORMULAS.map((formula) => {
                        const isSelected = formData.formula_expression === formula.expression;
                        return (
                          <button
                            key={formula.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, formula_expression: formula.expression })}
                            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                              isSelected
                                ? 'border-purple-500 bg-purple-100'
                                : 'border-purple-200 hover:border-purple-300 bg-white'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <Calculator className={`w-5 h-5 mt-0.5 ${isSelected ? 'text-purple-700' : 'text-purple-400'}`} />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <p className={`font-semibold ${isSelected ? 'text-purple-900' : 'text-slate-700'}`}>
                                    {formula.name}
                                  </p>
                                  {isSelected && (
                                    <CheckCircle2 className="w-5 h-5 text-purple-600" />
                                  )}
                                </div>
                                <p className="text-xs text-purple-700 mt-1 font-mono bg-purple-200 px-2 py-1 rounded inline-block">
                                  {formula.expression}
                                </p>
                                <p className="text-xs text-purple-600 mt-2">
                                  {formula.description}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {!formData.formula_expression && (
                      <p className="text-xs text-purple-700 mt-3 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Selecciona una fórmula para continuar
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Status */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  Estado
                </h3>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="font-semibold text-slate-900">Concepto Activo</p>
                      <p className="text-xs text-slate-600">El concepto estará disponible para usar en nóminas</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-6 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setShowModal(false); resetForm(); }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingConcept ? 'Actualizar Concepto' : 'Crear Concepto'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
