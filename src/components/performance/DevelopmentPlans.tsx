import { useState, useEffect } from 'react';
import { Target, Plus, Edit2, Trash2, CheckCircle, Circle, PlayCircle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useToast } from '../../hooks/useToast';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';
import Autocomplete from '../ui/Autocomplete';

interface DevelopmentPlan {
  id: string;
  company_id: string;
  employee_id: string;
  title: string;
  description: string;
  start_date: string;
  target_date: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  progress: number;
  created_at: string;
  employee?: {
    first_name: string;
    last_name: string;
    employee_number: string;
  };
}

interface Objective {
  id: string;
  plan_id: string;
  title: string;
  description: string;
  success_criteria: string;
  target_date: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
  sort_order: number;
}

export default function DevelopmentPlans() {
  const { selectedCompanyId } = useCompany();
  const { showToast } = useToast();
  const [plans, setPlans] = useState<DevelopmentPlan[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<DevelopmentPlan | null>(null);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showObjectivesModal, setShowObjectivesModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [planFormData, setPlanFormData] = useState({
    employee_id: '',
    title: '',
    description: '',
    start_date: '',
    target_date: '',
    status: 'draft' as 'draft' | 'active' | 'completed' | 'cancelled'
  });

  const [objectiveFormData, setObjectiveFormData] = useState({
    title: '',
    description: '',
    success_criteria: '',
    target_date: '',
    status: 'not_started' as 'not_started' | 'in_progress' | 'completed',
    progress: 0
  });

  useEffect(() => {
    if (selectedCompanyId) {
      loadPlans();
      loadEmployees();
    }
  }, [selectedCompanyId]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('development_plans')
        .select(`
          *,
          employee:employees(first_name, last_name, employee_number)
        `)
        .eq('company_id', selectedCompanyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      console.error('Error loading plans:', error);
      showToast(error.message || 'Error al cargar planes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, employee_number, status')
        .eq('company_id', selectedCompanyId)
        .eq('status', 'active')
        .order('first_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error: any) {
      console.error('Error loading employees:', error);
    }
  };

  const loadObjectives = async (planId: string) => {
    try {
      const { data, error } = await supabase
        .from('development_plan_objectives')
        .select('*')
        .eq('plan_id', planId)
        .order('sort_order');

      if (error) throw error;
      setObjectives(data || []);
    } catch (error: any) {
      console.error('Error loading objectives:', error);
      showToast(error.message || 'Error al cargar objetivos', 'error');
    }
  };

  const handleCreatePlan = () => {
    setSelectedPlan(null);
    setPlanFormData({
      employee_id: '',
      title: '',
      description: '',
      start_date: '',
      target_date: '',
      status: 'draft'
    });
    setShowPlanModal(true);
  };

  const handleEditPlan = (plan: DevelopmentPlan) => {
    setSelectedPlan(plan);
    setPlanFormData({
      employee_id: plan.employee_id,
      title: plan.title,
      description: plan.description || '',
      start_date: plan.start_date || '',
      target_date: plan.target_date || '',
      status: plan.status
    });
    setShowPlanModal(true);
  };

  const handleSavePlan = async () => {
    if (!planFormData.employee_id || !planFormData.title) {
      showToast('Complete los campos requeridos', 'error');
      return;
    }

    try {
      if (selectedPlan) {
        const { error } = await supabase
          .from('development_plans')
          .update(planFormData)
          .eq('id', selectedPlan.id);

        if (error) throw error;
        showToast('Plan actualizado exitosamente', 'success');
      } else {
        const { error } = await supabase
          .from('development_plans')
          .insert({
            ...planFormData,
            company_id: selectedCompanyId
          });

        if (error) throw error;
        showToast('Plan creado exitosamente', 'success');
      }

      setShowPlanModal(false);
      loadPlans();
    } catch (error: any) {
      console.error('Error saving plan:', error);
      showToast(error.message || 'Error al guardar plan', 'error');
    }
  };

  const handleViewObjectives = async (plan: DevelopmentPlan) => {
    setSelectedPlan(plan);
    await loadObjectives(plan.id);
    setShowObjectivesModal(true);
  };

  const handleAddObjective = async () => {
    if (!objectiveFormData.title || !selectedPlan) {
      showToast('Complete los campos requeridos', 'error');
      return;
    }

    try {
      const { error } = await supabase
        .from('development_plan_objectives')
        .insert({
          ...objectiveFormData,
          plan_id: selectedPlan.id,
          sort_order: objectives.length
        });

      if (error) throw error;
      showToast('Objetivo agregado exitosamente', 'success');
      await loadObjectives(selectedPlan.id);

      setObjectiveFormData({
        title: '',
        description: '',
        success_criteria: '',
        target_date: '',
        status: 'not_started',
        progress: 0
      });
    } catch (error: any) {
      console.error('Error adding objective:', error);
      showToast(error.message || 'Error al agregar objetivo', 'error');
    }
  };

  const handleUpdateObjectiveStatus = async (objectiveId: string, newStatus: string, newProgress: number) => {
    try {
      const { error } = await supabase
        .from('development_plan_objectives')
        .update({
          status: newStatus,
          progress: newProgress
        })
        .eq('id', objectiveId);

      if (error) throw error;
      showToast('Objetivo actualizado', 'success');
      if (selectedPlan) {
        await loadObjectives(selectedPlan.id);
        updatePlanProgress(selectedPlan.id);
      }
    } catch (error: any) {
      console.error('Error updating objective:', error);
      showToast(error.message || 'Error al actualizar objetivo', 'error');
    }
  };

  const handleDeleteObjective = async (objectiveId: string) => {
    try {
      const { error } = await supabase
        .from('development_plan_objectives')
        .delete()
        .eq('id', objectiveId);

      if (error) throw error;
      showToast('Objetivo eliminado', 'success');
      if (selectedPlan) {
        await loadObjectives(selectedPlan.id);
        updatePlanProgress(selectedPlan.id);
      }
    } catch (error: any) {
      console.error('Error deleting objective:', error);
      showToast(error.message || 'Error al eliminar objetivo', 'error');
    }
  };

  const updatePlanProgress = async (planId: string) => {
    try {
      const { data, error } = await supabase
        .from('development_plan_objectives')
        .select('progress')
        .eq('plan_id', planId);

      if (error) throw error;

      const avgProgress = data && data.length > 0
        ? Math.round(data.reduce((sum, obj) => sum + obj.progress, 0) / data.length)
        : 0;

      await supabase
        .from('development_plans')
        .update({ progress: avgProgress })
        .eq('id', planId);

      loadPlans();
    } catch (error: any) {
      console.error('Error updating plan progress:', error);
    }
  };

  const handleDeletePlan = async (id: string) => {
    try {
      const { error } = await supabase
        .from('development_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showToast('Plan eliminado exitosamente', 'success');
      loadPlans();
    } catch (error: any) {
      console.error('Error deleting plan:', error);
      showToast(error.message || 'Error al eliminar plan', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200';
      case 'draft': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getObjectiveStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in_progress': return <PlayCircle className="w-5 h-5 text-blue-600" />;
      case 'not_started': return <Circle className="w-5 h-5 text-slate-400" />;
      default: return <Circle className="w-5 h-5 text-slate-400" />;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Planes de Desarrollo</h1>
          <p className="text-slate-600">Gestiona los Planes de Desarrollo Individual (PDI) de tus empleados</p>
        </div>
        <Button onClick={handleCreatePlan}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Total Planes</h3>
            <Target className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{plans.length}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Activos</h3>
            <PlayCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {plans.filter(p => p.status === 'active').length}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Completados</h3>
            <CheckCircle className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {plans.filter(p => p.status === 'completed').length}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Progreso Promedio</h3>
            <Target className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {plans.length > 0 ? Math.round(plans.reduce((sum, p) => sum + p.progress, 0) / plans.length) : 0}%
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Listado de Planes</h2>
        </div>

        {plans.length > 0 ? (
          <div className="divide-y divide-slate-200">
            {plans.map((plan) => (
              <div key={plan.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">{plan.title}</h3>
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(plan.status)}`}>
                        {plan.status === 'active' ? 'Activo' : plan.status === 'draft' ? 'Borrador' : plan.status === 'completed' ? 'Completado' : 'Cancelado'}
                      </span>
                    </div>
                    {plan.employee && (
                      <p className="text-sm text-slate-600 mb-2">
                        Empleado: {plan.employee.first_name} {plan.employee.last_name} ({plan.employee.employee_number})
                      </p>
                    )}
                    {plan.description && (
                      <p className="text-sm text-slate-600 mb-3">{plan.description}</p>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Progreso</span>
                    <span className="text-sm font-bold text-slate-900">{plan.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${plan.progress}%` }}
                    />
                  </div>
                </div>

                {(plan.start_date || plan.target_date) && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {plan.start_date && (
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">Fecha Inicio</p>
                        <p className="text-sm font-medium text-slate-900">{formatDate(plan.start_date)}</p>
                      </div>
                    )}
                    {plan.target_date && (
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">Fecha Objetivo</p>
                        <p className="text-sm font-medium text-slate-900">{formatDate(plan.target_date)}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewObjectives(plan)}
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Ver Objetivos
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditPlan(plan)}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Editar
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirm(plan.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500 mb-2">No hay planes de desarrollo</p>
            <p className="text-sm text-slate-400">Crea un plan para comenzar</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        title={selectedPlan ? 'Editar Plan de Desarrollo' : 'Nuevo Plan de Desarrollo'}
      >
        <div className="space-y-4">
          <Autocomplete
            label="Empleado"
            value={planFormData.employee_id}
            onChange={(value) => setPlanFormData({ ...planFormData, employee_id: value })}
            options={employees.map((emp) => ({
              value: emp.id,
              label: `${emp.first_name} ${emp.last_name}`,
              description: `Nro: ${emp.employee_number}`
            }))}
            placeholder="Buscar por nombre o número de empleado"
            required
          />

          <Input
            label="Título del Plan *"
            value={planFormData.title}
            onChange={(e) => setPlanFormData({ ...planFormData, title: e.target.value })}
            placeholder="Ej: Desarrollo de Liderazgo"
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Descripción
            </label>
            <textarea
              value={planFormData.description}
              onChange={(e) => setPlanFormData({ ...planFormData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descripción del plan de desarrollo"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha Inicio"
              type="date"
              value={planFormData.start_date}
              onChange={(e) => setPlanFormData({ ...planFormData, start_date: e.target.value })}
            />
            <Input
              label="Fecha Objetivo"
              type="date"
              value={planFormData.target_date}
              onChange={(e) => setPlanFormData({ ...planFormData, target_date: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Estado
            </label>
            <select
              value={planFormData.status}
              onChange={(e) => setPlanFormData({ ...planFormData, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="draft">Borrador</option>
              <option value="active">Activo</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSavePlan} className="flex-1">
              {selectedPlan ? 'Actualizar' : 'Crear'} Plan
            </Button>
            <Button variant="outline" onClick={() => setShowPlanModal(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showObjectivesModal}
        onClose={() => setShowObjectivesModal(false)}
        title={`Objetivos: ${selectedPlan?.title}`}
      >
        <div className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="font-semibold text-slate-900 mb-3">Agregar Nuevo Objetivo</h3>
            <div className="space-y-3">
              <Input
                label="Título del Objetivo *"
                value={objectiveFormData.title}
                onChange={(e) => setObjectiveFormData({ ...objectiveFormData, title: e.target.value })}
                placeholder="Ej: Completar certificación PMP"
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={objectiveFormData.description}
                  onChange={(e) => setObjectiveFormData({ ...objectiveFormData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descripción del objetivo"
                />
              </div>

              <Input
                label="Criterios de Éxito"
                value={objectiveFormData.success_criteria}
                onChange={(e) => setObjectiveFormData({ ...objectiveFormData, success_criteria: e.target.value })}
                placeholder="Cómo medir el éxito"
              />

              <Input
                label="Fecha Objetivo"
                type="date"
                value={objectiveFormData.target_date}
                onChange={(e) => setObjectiveFormData({ ...objectiveFormData, target_date: e.target.value })}
              />

              <Button onClick={handleAddObjective} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Objetivo
              </Button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Objetivos del Plan</h3>
            {objectives.length > 0 ? (
              <div className="space-y-3">
                {objectives.map((objective) => (
                  <div key={objective.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        {getObjectiveStatusIcon(objective.status)}
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900 mb-1">{objective.title}</h4>
                          {objective.description && (
                            <p className="text-sm text-slate-600 mb-2">{objective.description}</p>
                          )}
                          {objective.success_criteria && (
                            <p className="text-xs text-slate-500 mb-2">
                              <span className="font-medium">Criterio:</span> {objective.success_criteria}
                            </p>
                          )}
                          {objective.target_date && (
                            <p className="text-xs text-slate-500">
                              <span className="font-medium">Fecha objetivo:</span> {formatDate(objective.target_date)}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteObjective(objective.id)}
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${objective.progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-900 w-12">{objective.progress}%</span>
                    </div>

                    <div className="flex gap-2">
                      {objective.status !== 'not_started' && (
                        <button
                          onClick={() => handleUpdateObjectiveStatus(objective.id, 'not_started', 0)}
                          className="text-xs px-2 py-1 border border-slate-300 rounded hover:bg-slate-50"
                        >
                          No iniciado
                        </button>
                      )}
                      {objective.status !== 'in_progress' && (
                        <button
                          onClick={() => handleUpdateObjectiveStatus(objective.id, 'in_progress', 50)}
                          className="text-xs px-2 py-1 border border-slate-300 rounded hover:bg-slate-50"
                        >
                          En progreso
                        </button>
                      )}
                      {objective.status !== 'completed' && (
                        <button
                          onClick={() => handleUpdateObjectiveStatus(objective.id, 'completed', 100)}
                          className="text-xs px-2 py-1 border border-slate-300 rounded hover:bg-slate-50"
                        >
                          Completado
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50 rounded-lg">
                <Target className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No hay objetivos aún</p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {deleteConfirm && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => handleDeletePlan(deleteConfirm)}
          title="Eliminar Plan"
          message="¿Está seguro de eliminar este plan de desarrollo? Esta acción no se puede deshacer."
          confirmText="Eliminar"
          cancelText="Cancelar"
        />
      )}
    </div>
  );
}
