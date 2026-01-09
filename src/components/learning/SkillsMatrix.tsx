import { useState, useEffect } from 'react';
import { Brain, Plus, Edit2, Trash2, Users, TrendingUp, Search, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useToast } from '../../hooks/useToast';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';
import Autocomplete from '../ui/Autocomplete';

interface Skill {
  id: string;
  company_id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  level_1_description: string;
  level_2_description: string;
  level_3_description: string;
  level_4_description: string;
  active: boolean;
  created_at: string;
  employee_skills?: EmployeeSkill[];
}

interface EmployeeSkill {
  id: string;
  company_id: string;
  employee_id: string;
  skill_id: string;
  current_level: number;
  target_level: number;
  assessment_date: string;
  comments: string;
  employee?: {
    first_name: string;
    last_name: string;
    employee_number: string;
  };
  skill?: {
    name: string;
    category: string;
  };
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  employee_number: string;
}

const skillCategories = [
  'Técnica',
  'Blanda',
  'Liderazgo',
  'Comunicación',
  'Gestión',
  'Idiomas',
  'Herramientas',
  'Metodologías',
  'Dominio del Negocio',
  'Otro'
];

const skillLevels = [
  { value: 1, label: 'Básico', color: 'bg-red-100 text-red-800' },
  { value: 2, label: 'Intermedio', color: 'bg-yellow-100 text-yellow-800' },
  { value: 3, label: 'Avanzado', color: 'bg-blue-100 text-blue-800' },
  { value: 4, label: 'Experto', color: 'bg-green-100 text-green-800' }
];

export default function SkillsMatrix() {
  const { selectedCompanyId } = useCompany();
  const { showToast } = useToast();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeSkills, setEmployeeSkills] = useState<EmployeeSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'skills' | 'matrix'>('skills');
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [selectedEmployeeSkill, setSelectedEmployeeSkill] = useState<EmployeeSkill | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState('all');

  const [skillFormData, setSkillFormData] = useState({
    code: '',
    name: '',
    description: '',
    category: '',
    level_1_description: 'Conocimiento básico',
    level_2_description: 'Conocimiento intermedio',
    level_3_description: 'Conocimiento avanzado',
    level_4_description: 'Experto'
  });

  const [assessmentFormData, setAssessmentFormData] = useState({
    employee_id: '',
    skill_id: '',
    current_level: 1,
    target_level: 2,
    assessment_date: new Date().toISOString().split('T')[0],
    comments: ''
  });

  useEffect(() => {
    if (selectedCompanyId) {
      loadSkills();
      loadEmployees();
      loadEmployeeSkills();
    }
  }, [selectedCompanyId]);

  const loadSkills = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setSkills(data || []);
    } catch (error: any) {
      console.error('Error loading skills:', error);
      showToast(error.message || 'Error al cargar habilidades', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, employee_number')
        .eq('company_id', selectedCompanyId)
        .eq('active', true)
        .order('first_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error: any) {
      console.error('Error loading employees:', error);
    }
  };

  const loadEmployeeSkills = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_skills')
        .select(`
          *,
          employee:employees(first_name, last_name, employee_number),
          skill:skills(name, category)
        `)
        .eq('company_id', selectedCompanyId)
        .order('assessment_date', { ascending: false });

      if (error) throw error;
      setEmployeeSkills(data || []);
    } catch (error: any) {
      console.error('Error loading employee skills:', error);
    }
  };

  const handleCreateSkill = () => {
    setSelectedSkill(null);
    setSkillFormData({
      code: '',
      name: '',
      description: '',
      category: '',
      level_1_description: 'Conocimiento básico',
      level_2_description: 'Conocimiento intermedio',
      level_3_description: 'Conocimiento avanzado',
      level_4_description: 'Experto'
    });
    setShowSkillModal(true);
  };

  const handleEditSkill = (skill: Skill) => {
    setSelectedSkill(skill);
    setSkillFormData({
      code: skill.code,
      name: skill.name,
      description: skill.description || '',
      category: skill.category,
      level_1_description: skill.level_1_description,
      level_2_description: skill.level_2_description,
      level_3_description: skill.level_3_description,
      level_4_description: skill.level_4_description
    });
    setShowSkillModal(true);
  };

  const handleSubmitSkill = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!skillFormData.code || !skillFormData.name || !skillFormData.category) {
      showToast('Complete los campos requeridos', 'error');
      return;
    }

    try {
      if (selectedSkill) {
        const { error } = await supabase
          .from('skills')
          .update(skillFormData)
          .eq('id', selectedSkill.id);

        if (error) throw error;
        showToast('Habilidad actualizada exitosamente', 'success');
      } else {
        const { error } = await supabase
          .from('skills')
          .insert({
            ...skillFormData,
            company_id: selectedCompanyId
          });

        if (error) throw error;
        showToast('Habilidad creada exitosamente', 'success');
      }

      setShowSkillModal(false);
      loadSkills();
    } catch (error: any) {
      console.error('Error saving skill:', error);
      showToast(error.message || 'Error al guardar habilidad', 'error');
    }
  };

  const handleDeleteSkill = async (id: string) => {
    try {
      const { error } = await supabase
        .from('skills')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showToast('Habilidad eliminada exitosamente', 'success');
      loadSkills();
    } catch (error: any) {
      console.error('Error deleting skill:', error);
      showToast(error.message || 'Error al eliminar habilidad', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleCreateAssessment = () => {
    setSelectedEmployeeSkill(null);
    setAssessmentFormData({
      employee_id: '',
      skill_id: '',
      current_level: 1,
      target_level: 2,
      assessment_date: new Date().toISOString().split('T')[0],
      comments: ''
    });
    setShowAssessmentModal(true);
  };

  const handleEditAssessment = (empSkill: EmployeeSkill) => {
    setSelectedEmployeeSkill(empSkill);
    setAssessmentFormData({
      employee_id: empSkill.employee_id,
      skill_id: empSkill.skill_id,
      current_level: empSkill.current_level,
      target_level: empSkill.target_level || empSkill.current_level + 1,
      assessment_date: empSkill.assessment_date || new Date().toISOString().split('T')[0],
      comments: empSkill.comments || ''
    });
    setShowAssessmentModal(true);
  };

  const handleSubmitAssessment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!assessmentFormData.employee_id || !assessmentFormData.skill_id) {
      showToast('Complete los campos requeridos', 'error');
      return;
    }

    try {
      if (selectedEmployeeSkill) {
        const { error } = await supabase
          .from('employee_skills')
          .update(assessmentFormData)
          .eq('id', selectedEmployeeSkill.id);

        if (error) throw error;
        showToast('Evaluación actualizada exitosamente', 'success');
      } else {
        const { error } = await supabase
          .from('employee_skills')
          .insert({
            ...assessmentFormData,
            company_id: selectedCompanyId
          });

        if (error) throw error;
        showToast('Evaluación registrada exitosamente', 'success');
      }

      setShowAssessmentModal(false);
      loadEmployeeSkills();
    } catch (error: any) {
      console.error('Error saving assessment:', error);
      showToast(error.message || 'Error al guardar evaluación', 'error');
    }
  };

  const filteredSkills = skills.filter(skill => {
    const matchesSearch = skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          skill.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || skill.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getMatrixData = () => {
    const matrix: any = {};

    employees.forEach(emp => {
      const empKey = `${emp.first_name} ${emp.last_name}`;
      matrix[empKey] = { employee: emp, skills: {} };

      skills.forEach(skill => {
        const empSkill = employeeSkills.find(
          es => es.employee_id === emp.id && es.skill_id === skill.id
        );
        matrix[empKey].skills[skill.id] = empSkill || null;
      });
    });

    return matrix;
  };

  const getLevelColor = (level: number) => {
    const levelConfig = skillLevels.find(l => l.value === level);
    return levelConfig?.color || 'bg-slate-100 text-slate-800';
  };

  const getLevelLabel = (level: number) => {
    const levelConfig = skillLevels.find(l => l.value === level);
    return levelConfig?.label || '';
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Matriz de Habilidades</h1>
          <p className="text-slate-600">Gestión de habilidades y evaluaciones</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('skills')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'skills'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Brain className="w-4 h-4 inline mr-2" />
              Habilidades
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'matrix'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Matriz
            </button>
          </div>
          {viewMode === 'skills' ? (
            <Button onClick={handleCreateSkill}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Habilidad
            </Button>
          ) : (
            <Button onClick={handleCreateAssessment}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Evaluación
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-600">Total Habilidades</p>
            <Brain className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{skills.length}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-600">Evaluaciones</p>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{employeeSkills.length}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-600">Nivel Promedio</p>
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {employeeSkills.length > 0
              ? (employeeSkills.reduce((sum, es) => sum + es.current_level, 0) / employeeSkills.length).toFixed(1)
              : '0'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-600">Gaps Identificados</p>
            <TrendingUp className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {employeeSkills.filter(es => es.target_level > es.current_level).length}
          </p>
        </div>
      </div>

      {viewMode === 'skills' ? (
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar habilidades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todas las categorías</option>
                {skillCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredSkills.length === 0 ? (
              <div className="text-center py-12">
                <Brain className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No hay habilidades</h3>
                <p className="text-slate-600 mb-4">Comienza creando la primera habilidad</p>
                <Button onClick={handleCreateSkill}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Habilidad
                </Button>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Habilidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Evaluaciones
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredSkills.map((skill) => {
                    const skillAssessments = employeeSkills.filter(es => es.skill_id === skill.id);
                    return (
                      <tr key={skill.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{skill.name}</p>
                            <p className="text-sm text-slate-500">{skill.code}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800">
                            {skill.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-600 line-clamp-2">{skill.description}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {skillAssessments.length} empleados
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditSkill(skill)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(skill.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Matriz de Habilidades por Empleado</h3>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos los empleados</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            {skills.length === 0 || employees.length === 0 ? (
              <div className="text-center py-12">
                <Brain className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No hay datos disponibles</h3>
                <p className="text-slate-600">Crea habilidades y empleados para ver la matriz</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50 z-10">
                      Empleado
                    </th>
                    {skills.map(skill => (
                      <th key={skill.id} className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider min-w-[120px]">
                        <div className="flex flex-col items-center">
                          <span className="mb-1">{skill.name}</span>
                          <span className="text-xs text-slate-400 font-normal">{skill.category}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {employees
                    .filter(emp => selectedEmployee === 'all' || emp.id === selectedEmployee)
                    .map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white z-10">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {emp.first_name} {emp.last_name}
                          </p>
                          <p className="text-sm text-slate-500">{emp.employee_number}</p>
                        </div>
                      </td>
                      {skills.map(skill => {
                        const empSkill = employeeSkills.find(
                          es => es.employee_id === emp.id && es.skill_id === skill.id
                        );
                        return (
                          <td key={skill.id} className="px-6 py-4 text-center">
                            {empSkill ? (
                              <button
                                onClick={() => handleEditAssessment(empSkill)}
                                className="inline-flex flex-col items-center gap-1 hover:opacity-80 transition-opacity"
                              >
                                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getLevelColor(empSkill.current_level)}`}>
                                  {getLevelLabel(empSkill.current_level)}
                                </span>
                                {empSkill.target_level > empSkill.current_level && (
                                  <span className="text-xs text-slate-500">
                                    → {getLevelLabel(empSkill.target_level)}
                                  </span>
                                )}
                              </button>
                            ) : (
                              <span className="text-slate-400 text-xs">Sin evaluar</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-700">Niveles:</span>
              {skillLevels.map(level => (
                <span key={level.value} className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${level.color}`}>
                  {level.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={showSkillModal}
        onClose={() => setShowSkillModal(false)}
        title={selectedSkill ? 'Editar Habilidad' : 'Nueva Habilidad'}
      >
        <form onSubmit={handleSubmitSkill} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Código *"
              value={skillFormData.code}
              onChange={(e) => setSkillFormData({ ...skillFormData, code: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Categoría *
              </label>
              <select
                value={skillFormData.category}
                onChange={(e) => setSkillFormData({ ...skillFormData, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Seleccionar categoría</option>
                {skillCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Nombre de la Habilidad *"
            value={skillFormData.name}
            onChange={(e) => setSkillFormData({ ...skillFormData, name: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Descripción
            </label>
            <textarea
              value={skillFormData.description}
              onChange={(e) => setSkillFormData({ ...skillFormData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700">Descripción por niveles:</p>

            <Input
              label="Nivel 1 - Básico"
              value={skillFormData.level_1_description}
              onChange={(e) => setSkillFormData({ ...skillFormData, level_1_description: e.target.value })}
            />

            <Input
              label="Nivel 2 - Intermedio"
              value={skillFormData.level_2_description}
              onChange={(e) => setSkillFormData({ ...skillFormData, level_2_description: e.target.value })}
            />

            <Input
              label="Nivel 3 - Avanzado"
              value={skillFormData.level_3_description}
              onChange={(e) => setSkillFormData({ ...skillFormData, level_3_description: e.target.value })}
            />

            <Input
              label="Nivel 4 - Experto"
              value={skillFormData.level_4_description}
              onChange={(e) => setSkillFormData({ ...skillFormData, level_4_description: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {selectedSkill ? 'Actualizar' : 'Crear'} Habilidad
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowSkillModal(false)} className="flex-1">
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showAssessmentModal}
        onClose={() => setShowAssessmentModal(false)}
        title={selectedEmployeeSkill ? 'Editar Evaluación' : 'Nueva Evaluación de Habilidad'}
      >
        <form onSubmit={handleSubmitAssessment} className="space-y-4">
          <Autocomplete
            label="Empleado"
            value={assessmentFormData.employee_id}
            onChange={(value) => setAssessmentFormData({ ...assessmentFormData, employee_id: value })}
            options={employees.map((emp) => ({
              value: emp.id,
              label: `${emp.first_name} ${emp.last_name}`,
              description: `Nro: ${emp.employee_number}`
            }))}
            placeholder="Buscar empleado"
            required
            disabled={!!selectedEmployeeSkill}
          />

          <Autocomplete
            label="Habilidad"
            value={assessmentFormData.skill_id}
            onChange={(value) => setAssessmentFormData({ ...assessmentFormData, skill_id: value })}
            options={skills.map((skill) => ({
              value: skill.id,
              label: skill.name,
              description: skill.category
            }))}
            placeholder="Buscar habilidad"
            required
            disabled={!!selectedEmployeeSkill}
          />

          <Input
            label="Fecha de Evaluación"
            type="date"
            value={assessmentFormData.assessment_date}
            onChange={(e) => setAssessmentFormData({ ...assessmentFormData, assessment_date: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Nivel Actual *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {skillLevels.map(level => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setAssessmentFormData({ ...assessmentFormData, current_level: level.value })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    assessmentFormData.current_level === level.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className={`text-sm font-semibold ${assessmentFormData.current_level === level.value ? 'text-blue-900' : 'text-slate-700'}`}>
                    {level.value} - {level.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Nivel Objetivo
            </label>
            <div className="grid grid-cols-2 gap-3">
              {skillLevels.map(level => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setAssessmentFormData({ ...assessmentFormData, target_level: level.value })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    assessmentFormData.target_level === level.value
                      ? 'border-green-500 bg-green-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className={`text-sm font-semibold ${assessmentFormData.target_level === level.value ? 'text-green-900' : 'text-slate-700'}`}>
                    {level.value} - {level.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Comentarios
            </label>
            <textarea
              value={assessmentFormData.comments}
              onChange={(e) => setAssessmentFormData({ ...assessmentFormData, comments: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Observaciones sobre la evaluación..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {selectedEmployeeSkill ? 'Actualizar' : 'Registrar'} Evaluación
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowAssessmentModal(false)} className="flex-1">
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDeleteSkill(deleteConfirm)}
        title="Eliminar Habilidad"
        message="¿Está seguro de que desea eliminar esta habilidad? Esta acción también eliminará todas las evaluaciones asociadas."
      />
    </div>
  );
}
