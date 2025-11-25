import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Calculator, FileCode, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useToast } from '../../hooks/useToast';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Autocomplete from '../ui/Autocomplete';

interface PayrollFormula {
  id: string;
  company_id: string;
  concept_id: string | null;
  name: string;
  formula_expression: string;
  description: string;
  variables: any;
  is_active: boolean;
  created_at: string;
  concept?: {
    code: string;
    name: string;
  };
}

interface PayrollConcept {
  id: string;
  code: string;
  name: string;
}

export default function PayrollFormulas() {
  const { selectedCompanyId } = useCompany();
  const { showToast } = useToast();
  const [formulas, setFormulas] = useState<PayrollFormula[]>([]);
  const [concepts, setConcepts] = useState<PayrollConcept[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFormula, setEditingFormula] = useState<PayrollFormula | null>(null);
  const [formData, setFormData] = useState({
    concept_id: '',
    name: '',
    formula_expression: '',
    description: '',
    is_active: true,
  });

  useEffect(() => {
    if (selectedCompanyId) {
      loadFormulas();
      loadConcepts();
    }
  }, [selectedCompanyId]);

  const loadFormulas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payroll_formulas')
        .select(`
          *,
          concept:payroll_concepts(code, name)
        `)
        .eq('company_id', selectedCompanyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFormulas(data || []);
    } catch (error) {
      showToast('Error al cargar fórmulas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadConcepts = async () => {
    try {
      const { data, error } = await supabase
        .from('payroll_concepts')
        .select('id, code, name')
        .eq('company_id', selectedCompanyId)
        .eq('calculation_type', 'formula')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setConcepts(data || []);
    } catch (error) {
      console.error('Error loading concepts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingFormula) {
        const { error } = await supabase
          .from('payroll_formulas')
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq('id', editingFormula.id);

        if (error) throw error;
        showToast('Fórmula actualizada correctamente', 'success');
      } else {
        const { error } = await supabase
          .from('payroll_formulas')
          .insert([{
            ...formData,
            company_id: selectedCompanyId,
            concept_id: formData.concept_id || null
          }]);

        if (error) throw error;
        showToast('Fórmula creada correctamente', 'success');
      }

      setShowModal(false);
      resetForm();
      loadFormulas();
    } catch (error) {
      showToast('Error al guardar fórmula', 'error');
    }
  };

  const handleEdit = (formula: PayrollFormula) => {
    setEditingFormula(formula);
    setFormData({
      concept_id: formula.concept_id || '',
      name: formula.name,
      formula_expression: formula.formula_expression,
      description: formula.description,
      is_active: formula.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta fórmula?')) return;

    try {
      const { error } = await supabase
        .from('payroll_formulas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showToast('Fórmula eliminada correctamente', 'success');
      loadFormulas();
    } catch (error) {
      showToast('Error al eliminar fórmula', 'error');
    }
  };

  const resetForm = () => {
    setEditingFormula(null);
    setFormData({
      concept_id: '',
      name: '',
      formula_expression: '',
      description: '',
      is_active: true,
    });
  };

  const insertVariable = (variable: string) => {
    setFormData({
      ...formData,
      formula_expression: formData.formula_expression + variable
    });
  };

  const commonVariables = [
    { label: 'Salario Base', value: '{SALARIO_BASE}' },
    { label: 'Días Trabajados', value: '{DIAS_TRABAJADOS}' },
    { label: 'Horas Trabajadas', value: '{HORAS_TRABAJADAS}' },
    { label: 'Horas Extra', value: '{HORAS_EXTRA}' },
    { label: 'Total Percepciones', value: '{TOTAL_PERCEPCIONES}' },
    { label: 'Total Deducciones', value: '{TOTAL_DEDUCCIONES}' },
  ];

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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Fórmulas de Nómina</h1>
          <p className="text-slate-600">Crea y administra fórmulas de cálculo personalizadas</p>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus className="w-5 h-5 mr-2" />
          Nueva Fórmula
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Total Fórmulas</h3>
            <Calculator className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{formulas.length}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Activas</h3>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {formulas.filter(f => f.is_active).length}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Inactivas</h3>
            <XCircle className="w-5 h-5 text-slate-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {formulas.filter(f => !f.is_active).length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Todas las Fórmulas</h2>
        </div>

        {formulas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Concepto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Fórmula</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {formulas.map((formula) => (
                  <tr key={formula.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-slate-900">{formula.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formula.concept ? (
                        <span className="text-sm text-slate-900">
                          {formula.concept.code} - {formula.concept.name}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">Sin asociar</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-700 font-mono">
                        {formula.formula_expression.length > 50
                          ? formula.formula_expression.substring(0, 50) + '...'
                          : formula.formula_expression
                        }
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        formula.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {formula.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(formula)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(formula.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
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
          <div className="text-center py-12">
            <Calculator className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500 mb-2">No hay fórmulas configuradas</p>
            <p className="text-sm text-slate-400">Crea tu primera fórmula de cálculo</p>
          </div>
        )}
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex gap-3">
          <FileCode className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">Ayuda para crear fórmulas</h3>
            <p className="text-sm text-slate-700 mb-3">
              Puedes usar variables entre llaves y operadores matemáticos básicos (+, -, *, /, %)
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2 rounded border border-blue-100">
                <code className="text-blue-600">{'{SALARIO_BASE}'} * 0.10</code>
                <p className="text-slate-600 mt-1">10% del salario base</p>
              </div>
              <div className="bg-white p-2 rounded border border-blue-100">
                <code className="text-blue-600">{'{HORAS_EXTRA}'} * 25</code>
                <p className="text-slate-600 mt-1">Pago por horas extra</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingFormula ? 'Editar Fórmula' : 'Nueva Fórmula'}
        maxWidth="3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Nombre de la Fórmula"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Autocomplete
            label="Concepto Asociado (opcional)"
            options={concepts.map(c => ({ value: c.id, label: `${c.code} - ${c.name}` }))}
            value={formData.concept_id}
            onChange={(value) => setFormData({ ...formData, concept_id: value })}
            placeholder="Selecciona un concepto"
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Expresión de la Fórmula
            </label>
            <textarea
              value={formData.formula_expression}
              onChange={(e) => setFormData({ ...formData, formula_expression: e.target.value })}
              rows={5}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm transition-all bg-slate-50"
              placeholder="Ejemplo: {SALARIO_BASE} * 0.10"
              required
            />
            <p className="text-xs text-slate-500 mt-2">
              Usa operadores matemáticos: +, -, *, /, () y las variables disponibles abajo
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Variables disponibles (haz clic para insertar)
            </label>
            <div className="grid grid-cols-2 gap-3">
              {commonVariables.map((variable) => (
                <button
                  key={variable.value}
                  type="button"
                  onClick={() => insertVariable(variable.value)}
                  className="text-left px-4 py-3 text-sm bg-white hover:bg-blue-50 hover:border-blue-500 border border-slate-200 rounded-lg transition-all"
                >
                  <code className="text-blue-600 font-mono text-xs font-semibold">{variable.value}</code>
                  <p className="text-slate-600 text-xs mt-1">{variable.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Describe cómo funciona esta fórmula y cuándo se aplica"
            />
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700">Fórmula activa</span>
            </label>
          </div>

          <div className="flex gap-3 justify-end pt-6 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setShowModal(false); resetForm(); }}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {editingFormula ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
