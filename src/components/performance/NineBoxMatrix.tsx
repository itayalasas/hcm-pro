import { useState, useEffect } from 'react';
import { Grid3x3, Plus, Edit2, Trash2, User, TrendingUp, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useToast } from '../../hooks/useToast';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';

interface NineBoxAssessment {
  id: string;
  company_id: string;
  employee_id: string;
  assessment_date: string;
  performance_rating: number;
  potential_rating: number;
  box_position: string;
  succession_readiness: 'ready_now' | '1-2_years' | '3-5_years' | 'not_ready';
  comments: string;
  created_at: string;
  employee?: {
    first_name: string;
    last_name: string;
    employee_number: string;
    position?: {
      name: string;
    };
  };
}

interface BoxDefinition {
  performance: number;
  potential: number;
  label: string;
  color: string;
  description: string;
}

const boxDefinitions: BoxDefinition[] = [
  { performance: 3, potential: 3, label: 'Estrella', color: 'bg-green-500', description: 'Alto desempeño y alto potencial' },
  { performance: 3, potential: 2, label: 'Alto Desempeño', color: 'bg-green-400', description: 'Alto desempeño, potencial moderado' },
  { performance: 3, potential: 1, label: 'Experto', color: 'bg-blue-400', description: 'Alto desempeño, limitado potencial' },
  { performance: 2, potential: 3, label: 'Alto Potencial', color: 'bg-amber-400', description: 'Potencial alto, desempeño moderado' },
  { performance: 2, potential: 2, label: 'Rendimiento Sólido', color: 'bg-yellow-300', description: 'Desempeño y potencial moderados' },
  { performance: 2, potential: 1, label: 'Profesional', color: 'bg-slate-300', description: 'Desempeño moderado, limitado potencial' },
  { performance: 1, potential: 3, label: 'Enigma', color: 'bg-orange-400', description: 'Alto potencial, bajo desempeño' },
  { performance: 1, potential: 2, label: 'En Desarrollo', color: 'bg-orange-300', description: 'Desempeño y potencial bajo-moderado' },
  { performance: 1, potential: 1, label: 'Bajo Rendimiento', color: 'bg-red-400', description: 'Bajo desempeño y potencial' }
];

export default function NineBoxMatrix() {
  const { selectedCompanyId } = useCompany();
  const { showToast } = useToast();
  const [assessments, setAssessments] = useState<NineBoxAssessment[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<NineBoxAssessment | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'matrix' | 'list'>('matrix');

  const [formData, setFormData] = useState({
    employee_id: '',
    assessment_date: new Date().toISOString().split('T')[0],
    performance_rating: 2,
    potential_rating: 2,
    succession_readiness: 'not_ready' as 'ready_now' | '1-2_years' | '3-5_years' | 'not_ready',
    comments: ''
  });

  useEffect(() => {
    if (selectedCompanyId) {
      loadAssessments();
      loadEmployees();
    }
  }, [selectedCompanyId]);

  const loadAssessments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('nine_box_assessments')
        .select(`
          *,
          employee:employees(
            first_name,
            last_name,
            employee_number,
            position:positions(name)
          )
        `)
        .eq('company_id', selectedCompanyId)
        .order('assessment_date', { ascending: false });

      if (error) throw error;
      setAssessments(data || []);
    } catch (error: any) {
      console.error('Error loading assessments:', error);
      showToast(error.message || 'Error al cargar evaluaciones', 'error');
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

  const handleCreate = () => {
    setSelectedAssessment(null);
    setFormData({
      employee_id: '',
      assessment_date: new Date().toISOString().split('T')[0],
      performance_rating: 2,
      potential_rating: 2,
      succession_readiness: 'not_ready',
      comments: ''
    });
    setShowModal(true);
  };

  const handleEdit = (assessment: NineBoxAssessment) => {
    setSelectedAssessment(assessment);
    setFormData({
      employee_id: assessment.employee_id,
      assessment_date: assessment.assessment_date,
      performance_rating: assessment.performance_rating,
      potential_rating: assessment.potential_rating,
      succession_readiness: assessment.succession_readiness,
      comments: assessment.comments || ''
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.employee_id) {
      showToast('Seleccione un empleado', 'error');
      return;
    }

    try {
      const boxDef = boxDefinitions.find(
        b => b.performance === formData.performance_rating && b.potential === formData.potential_rating
      );

      const dataToSave = {
        ...formData,
        company_id: selectedCompanyId,
        box_position: boxDef?.label || ''
      };

      if (selectedAssessment) {
        const { error } = await supabase
          .from('nine_box_assessments')
          .update(dataToSave)
          .eq('id', selectedAssessment.id);

        if (error) throw error;
        showToast('Evaluación actualizada exitosamente', 'success');
      } else {
        const { error } = await supabase
          .from('nine_box_assessments')
          .insert(dataToSave);

        if (error) throw error;
        showToast('Evaluación creada exitosamente', 'success');
      }

      setShowModal(false);
      loadAssessments();
    } catch (error: any) {
      console.error('Error saving assessment:', error);
      showToast(error.message || 'Error al guardar evaluación', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('nine_box_assessments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showToast('Evaluación eliminada exitosamente', 'success');
      loadAssessments();
    } catch (error: any) {
      console.error('Error deleting assessment:', error);
      showToast(error.message || 'Error al eliminar evaluación', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const getBoxColor = (performance: number, potential: number) => {
    const box = boxDefinitions.find(b => b.performance === performance && b.potential === potential);
    return box?.color || 'bg-slate-200';
  };

  const getBoxLabel = (performance: number, potential: number) => {
    const box = boxDefinitions.find(b => b.performance === performance && b.potential === potential);
    return box?.label || '';
  };

  const getEmployeesInBox = (performance: number, potential: number) => {
    return assessments.filter(
      a => a.performance_rating === performance && a.potential_rating === potential
    );
  };

  const formatDate = (dateStr: string) => {
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Matriz 9-Box</h1>
          <p className="text-slate-600">Evaluación de Desempeño vs Potencial</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'matrix'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid3x3 className="w-4 h-4 inline mr-2" />
              Matriz
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Listado
            </button>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Evaluación
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Total Evaluaciones</h3>
            <Grid3x3 className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{assessments.length}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Estrellas</h3>
            <Star className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {assessments.filter(a => a.performance_rating === 3 && a.potential_rating === 3).length}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Alto Potencial</h3>
            <TrendingUp className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {assessments.filter(a => a.potential_rating === 3).length}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Alto Desempeño</h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {assessments.filter(a => a.performance_rating === 3).length}
          </p>
        </div>
      </div>

      {viewMode === 'matrix' ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Matriz 9-Box</h2>
                <p className="text-sm text-slate-600">Distribución de empleados por desempeño y potencial</p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-600">Eje Y: Potencial</span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-600">Eje X: Desempeño</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-16 top-0 bottom-0 flex flex-col justify-between text-sm font-medium text-slate-600 py-8">
              <div>Alto</div>
              <div>Medio</div>
              <div>Bajo</div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              {[3, 2, 1].map(potential => (
                <div key={potential} className="contents">
                  {[1, 2, 3].map(performance => {
                    const employeesInBox = getEmployeesInBox(performance, potential);
                    const boxColor = getBoxColor(performance, potential);
                    const boxLabel = getBoxLabel(performance, potential);

                    return (
                      <div
                        key={`${performance}-${potential}`}
                        className={`${boxColor} rounded-lg p-4 min-h-[180px] border-2 border-white shadow-sm`}
                      >
                        <h3 className="font-semibold text-white text-sm mb-2">{boxLabel}</h3>
                        <div className="space-y-1">
                          {employeesInBox.map((assessment) => (
                            <div
                              key={assessment.id}
                              className="bg-white bg-opacity-90 rounded px-2 py-1 text-xs"
                            >
                              <p className="font-medium text-slate-900 truncate">
                                {assessment.employee?.first_name} {assessment.employee?.last_name}
                              </p>
                              <p className="text-slate-600 truncate">
                                {assessment.employee?.employee_number}
                              </p>
                            </div>
                          ))}
                          {employeesInBox.length === 0 && (
                            <p className="text-white text-opacity-70 text-xs italic">Sin empleados</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="flex justify-between text-sm font-medium text-slate-600 px-4">
              <div>Bajo</div>
              <div>Medio</div>
              <div>Alto</div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-slate-50 rounded-lg">
            <h3 className="font-semibold text-slate-900 mb-3">Leyenda</h3>
            <div className="grid grid-cols-3 gap-3">
              {boxDefinitions.map((box) => (
                <div key={`${box.performance}-${box.potential}`} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${box.color}`}></div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{box.label}</p>
                    <p className="text-xs text-slate-600">{box.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Listado de Evaluaciones</h2>
          </div>

          {assessments.length > 0 ? (
            <div className="divide-y divide-slate-200">
              {assessments.map((assessment) => (
                <div key={assessment.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">
                        {assessment.employee?.first_name} {assessment.employee?.last_name}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {assessment.employee?.employee_number}
                        {assessment.employee?.position && ` • ${assessment.employee.position.name}`}
                      </p>
                    </div>
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full text-white ${getBoxColor(assessment.performance_rating, assessment.potential_rating)}`}>
                      {assessment.box_position}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500 mb-1">Desempeño</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${(assessment.performance_rating / 3) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-900">{assessment.performance_rating}/3</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500 mb-1">Potencial</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-amber-600 h-2 rounded-full"
                            style={{ width: `${(assessment.potential_rating / 3) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-900">{assessment.potential_rating}/3</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500 mb-1">Sucesión</p>
                      <p className="text-sm font-medium text-slate-900">
                        {assessment.succession_readiness === 'ready_now' ? 'Listo ahora' :
                         assessment.succession_readiness === '1-2_years' ? '1-2 años' :
                         assessment.succession_readiness === '3-5_years' ? '3-5 años' : 'No listo'}
                      </p>
                    </div>
                  </div>

                  {assessment.comments && (
                    <p className="text-sm text-slate-600 mb-3">{assessment.comments}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      Evaluado el {formatDate(assessment.assessment_date)}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(assessment)}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirm(assessment.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Grid3x3 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-500 mb-2">No hay evaluaciones 9-Box</p>
              <p className="text-sm text-slate-400">Crea una evaluación para comenzar</p>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedAssessment ? 'Editar Evaluación 9-Box' : 'Nueva Evaluación 9-Box'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Empleado *
            </label>
            <select
              value={formData.employee_id}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Seleccionar empleado</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} ({emp.employee_number})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Fecha de Evaluación"
            type="date"
            value={formData.assessment_date}
            onChange={(e) => setFormData({ ...formData, assessment_date: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Desempeño (Performance) *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setFormData({ ...formData, performance_rating: rating })}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    formData.performance_rating === rating
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-lg font-bold">{rating}</div>
                  <div className="text-xs">
                    {rating === 1 ? 'Bajo' : rating === 2 ? 'Medio' : 'Alto'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Potencial *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setFormData({ ...formData, potential_rating: rating })}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    formData.potential_rating === rating
                      ? 'border-amber-600 bg-amber-50 text-amber-700'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-lg font-bold">{rating}</div>
                  <div className="text-xs">
                    {rating === 1 ? 'Bajo' : rating === 2 ? 'Medio' : 'Alto'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Preparación para Sucesión
            </label>
            <select
              value={formData.succession_readiness}
              onChange={(e) => setFormData({ ...formData, succession_readiness: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ready_now">Listo ahora</option>
              <option value="1-2_years">1-2 años</option>
              <option value="3-5_years">3-5 años</option>
              <option value="not_ready">No está listo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Comentarios
            </label>
            <textarea
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Comentarios sobre la evaluación..."
            />
          </div>

          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm font-medium text-slate-700 mb-1">Posición en Matriz</p>
            <p className="text-lg font-bold text-slate-900">
              {getBoxLabel(formData.performance_rating, formData.potential_rating)}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} className="flex-1">
              {selectedAssessment ? 'Actualizar' : 'Crear'} Evaluación
            </Button>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {deleteConfirm && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => handleDelete(deleteConfirm)}
          title="Eliminar Evaluación"
          message="¿Está seguro de eliminar esta evaluación 9-Box? Esta acción no se puede deshacer."
          confirmText="Eliminar"
          cancelText="Cancelar"
        />
      )}
    </div>
  );
}
