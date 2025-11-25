import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, DollarSign, TrendingUp, TrendingDown, Percent, Calculator } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useToast } from '../../hooks/useToast';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface PayrollConcept {
  id: string;
  company_id: string;
  code: string;
  name: string;
  concept_type: 'perception' | 'deduction' | 'contribution' | 'tax';
  calculation_type: 'fixed' | 'percentage' | 'formula' | 'manual';
  default_value: number;
  is_taxable: boolean;
  affects_social_security: boolean;
  is_active: boolean;
  display_order: number;
  description: string;
  created_at: string;
}

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
    concept_type: 'perception' as const,
    calculation_type: 'fixed' as const,
    default_value: 0,
    is_taxable: false,
    affects_social_security: false,
    is_active: true,
    description: '',
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
        .order('display_order', { ascending: true });

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

    try {
      if (editingConcept) {
        const { error } = await supabase
          .from('payroll_concepts')
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq('id', editingConcept.id);

        if (error) throw error;
        showToast('Concepto actualizado correctamente', 'success');
      } else {
        const { error } = await supabase
          .from('payroll_concepts')
          .insert([{ ...formData, company_id: selectedCompanyId }]);

        if (error) throw error;
        showToast('Concepto creado correctamente', 'success');
      }

      setShowModal(false);
      resetForm();
      loadConcepts();
    } catch (error) {
      showToast('Error al guardar concepto', 'error');
    }
  };

  const handleEdit = (concept: PayrollConcept) => {
    setEditingConcept(concept);
    setFormData({
      code: concept.code,
      name: concept.name,
      concept_type: concept.concept_type,
      calculation_type: concept.calculation_type,
      default_value: concept.default_value,
      is_taxable: concept.is_taxable,
      affects_social_security: concept.affects_social_security,
      is_active: concept.is_active,
      description: concept.description,
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
      concept_type: 'perception',
      calculation_type: 'fixed',
      default_value: 0,
      is_taxable: false,
      affects_social_security: false,
      is_active: true,
      description: '',
    });
  };

  const getConceptTypeIcon = (type: string) => {
    switch (type) {
      case 'perception': return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'deduction': return <TrendingDown className="w-5 h-5 text-red-600" />;
      case 'contribution': return <DollarSign className="w-5 h-5 text-blue-600" />;
      case 'tax': return <Percent className="w-5 h-5 text-amber-600" />;
      default: return <DollarSign className="w-5 h-5 text-slate-600" />;
    }
  };

  const getConceptTypeColor = (type: string) => {
    switch (type) {
      case 'perception': return 'bg-green-100 text-green-700';
      case 'deduction': return 'bg-red-100 text-red-700';
      case 'contribution': return 'bg-blue-100 text-blue-700';
      case 'tax': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
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
    perception: concepts.filter(c => c.concept_type === 'perception'),
    deduction: concepts.filter(c => c.concept_type === 'deduction'),
    contribution: concepts.filter(c => c.concept_type === 'contribution'),
    tax: concepts.filter(c => c.concept_type === 'tax'),
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
          <p className="text-slate-600">Gestiona percepciones, deducciones y aportes</p>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Concepto
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Percepciones</h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{conceptsByType.perception.length}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Deducciones</h3>
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{conceptsByType.deduction.length}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Aportes</h3>
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{conceptsByType.contribution.length}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Impuestos</h3>
            <Percent className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{conceptsByType.tax.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Todos los Conceptos</h2>
        </div>

        {concepts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Cálculo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {concepts.map((concept) => (
                  <tr key={concept.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-slate-900">{concept.code}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getConceptTypeIcon(concept.concept_type)}
                        <span className="text-sm text-slate-900">{concept.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getConceptTypeColor(concept.concept_type)}`}>
                        {concept.concept_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        {getCalculationTypeIcon(concept.calculation_type)}
                        <span>{concept.calculation_type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {concept.calculation_type === 'percentage' ? `${concept.default_value}%` : `$${concept.default_value.toFixed(2)}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${concept.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                        {concept.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(concept)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(concept.id)}
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
            <DollarSign className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500 mb-2">No hay conceptos configurados</p>
            <p className="text-sm text-slate-400">Crea tu primer concepto de nómina</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingConcept ? 'Editar Concepto' : 'Nuevo Concepto'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Código"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
            />
            <Input
              label="Nombre"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tipo de Concepto
              </label>
              <select
                value={formData.concept_type}
                onChange={(e) => setFormData({ ...formData, concept_type: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="perception">Percepción</option>
                <option value="deduction">Deducción</option>
                <option value="contribution">Aporte</option>
                <option value="tax">Impuesto</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tipo de Cálculo
              </label>
              <select
                value={formData.calculation_type}
                onChange={(e) => setFormData({ ...formData, calculation_type: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="fixed">Monto Fijo</option>
                <option value="percentage">Porcentaje</option>
                <option value="formula">Fórmula</option>
                <option value="manual">Manual</option>
              </select>
            </div>
          </div>

          <Input
            label="Valor por Defecto"
            type="number"
            step="0.01"
            value={formData.default_value}
            onChange={(e) => setFormData({ ...formData, default_value: parseFloat(e.target.value) })}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_taxable}
                onChange={(e) => setFormData({ ...formData, is_taxable: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">Gravable (sujeto a impuestos)</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.affects_social_security}
                onChange={(e) => setFormData({ ...formData, affects_social_security: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">Afecta seguridad social</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">Activo</span>
            </label>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setShowModal(false); resetForm(); }}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {editingConcept ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
