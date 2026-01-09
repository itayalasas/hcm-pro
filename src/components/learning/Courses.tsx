import { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit2, Trash2, Users, Calendar, Clock, MapPin, Globe, DollarSign, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useToast } from '../../hooks/useToast';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';
import Autocomplete from '../ui/Autocomplete';

interface Course {
  id: string;
  company_id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  type: string;
  duration_hours: number;
  instructor: string;
  provider: string;
  max_participants: number;
  cost: number;
  currency_id: string;
  status: string;
  start_date: string;
  end_date: string;
  location: string;
  url: string;
  objectives: string;
  prerequisites: string;
  active: boolean;
  created_at: string;
  enrollments?: CourseEnrollment[];
}

interface CourseEnrollment {
  id: string;
  employee_id: string;
  enrollment_date: string;
  status: string;
  completion_date: string;
  score: number;
  passed: boolean;
  employee?: {
    first_name: string;
    last_name: string;
    employee_number: string;
  };
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  employee_number: string;
}

const courseCategories = [
  'Técnico',
  'Liderazgo',
  'Gestión',
  'Compliance',
  'Seguridad',
  'Ventas',
  'Marketing',
  'Finanzas',
  'Recursos Humanos',
  'Desarrollo Personal',
  'Idiomas',
  'Tecnología',
  'Otro'
];

const courseTypes = [
  'Presencial',
  'Virtual',
  'E-learning',
  'Híbrido',
  'Taller',
  'Seminario',
  'Webinar'
];

const courseStatuses = [
  'Planificado',
  'En curso',
  'Completado',
  'Cancelado'
];

const enrollmentStatuses = [
  'Inscrito',
  'En progreso',
  'Completado',
  'Cancelado',
  'No asistió'
];

export default function Courses() {
  const { selectedCompanyId } = useCompany();
  const { showToast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    category: '',
    type: 'E-learning',
    duration_hours: 0,
    instructor: '',
    provider: '',
    max_participants: 0,
    cost: 0,
    status: 'Planificado',
    start_date: '',
    end_date: '',
    location: '',
    url: '',
    objectives: '',
    prerequisites: ''
  });

  const [enrollmentFormData, setEnrollmentFormData] = useState({
    employee_id: '',
    enrollment_date: new Date().toISOString().split('T')[0],
    status: 'Inscrito'
  });

  useEffect(() => {
    if (selectedCompanyId) {
      loadCourses();
      loadEmployees();
    }
  }, [selectedCompanyId]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const coursesWithEnrollments = await Promise.all(
        (data || []).map(async (course) => {
          const { data: enrollments } = await supabase
            .from('course_enrollments')
            .select(`
              *,
              employee:employees(first_name, last_name, employee_number)
            `)
            .eq('course_id', course.id);

          return { ...course, enrollments: enrollments || [] };
        })
      );

      setCourses(coursesWithEnrollments);
    } catch (error: any) {
      console.error('Error loading courses:', error);
      showToast(error.message || 'Error al cargar cursos', 'error');
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

  const handleCreate = () => {
    setSelectedCourse(null);
    setFormData({
      code: '',
      title: '',
      description: '',
      category: '',
      type: 'E-learning',
      duration_hours: 0,
      instructor: '',
      provider: '',
      max_participants: 0,
      cost: 0,
      status: 'Planificado',
      start_date: '',
      end_date: '',
      location: '',
      url: '',
      objectives: '',
      prerequisites: ''
    });
    setShowModal(true);
  };

  const handleEdit = (course: Course) => {
    setSelectedCourse(course);
    setFormData({
      code: course.code,
      title: course.title,
      description: course.description || '',
      category: course.category || '',
      type: course.type,
      duration_hours: course.duration_hours || 0,
      instructor: course.instructor || '',
      provider: course.provider || '',
      max_participants: course.max_participants || 0,
      cost: course.cost || 0,
      status: course.status,
      start_date: course.start_date || '',
      end_date: course.end_date || '',
      location: course.location || '',
      url: course.url || '',
      objectives: course.objectives || '',
      prerequisites: course.prerequisites || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.title) {
      showToast('Complete los campos requeridos', 'error');
      return;
    }

    try {
      if (selectedCourse) {
        const { error } = await supabase
          .from('courses')
          .update(formData)
          .eq('id', selectedCourse.id);

        if (error) throw error;
        showToast('Curso actualizado exitosamente', 'success');
      } else {
        const { error } = await supabase
          .from('courses')
          .insert({
            ...formData,
            company_id: selectedCompanyId
          });

        if (error) throw error;
        showToast('Curso creado exitosamente', 'success');
      }

      setShowModal(false);
      loadCourses();
    } catch (error: any) {
      console.error('Error saving course:', error);
      showToast(error.message || 'Error al guardar curso', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showToast('Curso eliminado exitosamente', 'success');
      loadCourses();
    } catch (error: any) {
      console.error('Error deleting course:', error);
      showToast(error.message || 'Error al eliminar curso', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleEnrollEmployee = (course: Course) => {
    setSelectedCourse(course);
    setEnrollmentFormData({
      employee_id: '',
      enrollment_date: new Date().toISOString().split('T')[0],
      status: 'Inscrito'
    });
    setShowEnrollmentModal(true);
  };

  const handleSubmitEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!enrollmentFormData.employee_id || !selectedCourse) {
      showToast('Seleccione un empleado', 'error');
      return;
    }

    try {
      const { error } = await supabase
        .from('course_enrollments')
        .insert({
          ...enrollmentFormData,
          course_id: selectedCourse.id,
          company_id: selectedCompanyId
        });

      if (error) throw error;
      showToast('Empleado inscrito exitosamente', 'success');
      setShowEnrollmentModal(false);
      loadCourses();
    } catch (error: any) {
      console.error('Error enrolling employee:', error);
      showToast(error.message || 'Error al inscribir empleado', 'error');
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          course.instructor?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || course.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || course.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Planificado': return 'bg-blue-100 text-blue-800';
      case 'En curso': return 'bg-green-100 text-green-800';
      case 'Completado': return 'bg-slate-100 text-slate-800';
      case 'Cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Presencial': return <MapPin className="w-4 h-4" />;
      case 'Virtual':
      case 'E-learning':
      case 'Webinar': return <Globe className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Cursos</h1>
          <p className="text-slate-600">Gestión de cursos y capacitaciones</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Curso
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-600">Total Cursos</p>
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{courses.length}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-600">En Curso</p>
            <Clock className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {courses.filter(c => c.status === 'En curso').length}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-600">Completados</p>
            <BookOpen className="w-5 h-5 text-slate-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {courses.filter(c => c.status === 'Completado').length}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-600">Total Inscripciones</p>
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {courses.reduce((sum, c) => sum + (c.enrollments?.length || 0), 0)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar cursos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              {courseStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas las categorías</option>
              {courseCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No hay cursos</h3>
              <p className="text-slate-600 mb-4">Comienza creando tu primer curso</p>
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Curso
              </Button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Curso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Duración
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Fechas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Inscritos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{course.title}</p>
                        <p className="text-sm text-slate-500">{course.code}</p>
                        {course.category && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 mt-1">
                            {course.category}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-slate-600">
                        {getTypeIcon(course.type)}
                        <span className="ml-2">{course.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {course.duration_hours}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {course.start_date && (
                        <div className="text-sm">
                          <p className="text-slate-900">{new Date(course.start_date).toLocaleDateString('es-ES')}</p>
                          {course.end_date && (
                            <p className="text-slate-500">{new Date(course.end_date).toLocaleDateString('es-ES')}</p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-slate-900">
                        <Users className="w-4 h-4 mr-1 text-slate-400" />
                        {course.enrollments?.length || 0}
                        {course.max_participants > 0 && ` / ${course.max_participants}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(course.status)}`}>
                        {course.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEnrollEmployee(course)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Inscribir empleado"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(course)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(course.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedCourse ? 'Editar Curso' : 'Nuevo Curso'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Código *"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Estado *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {courseStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Título del Curso *"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Categoría
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar categoría</option>
                {courseCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tipo *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {courseTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Duración (horas)"
              type="number"
              value={formData.duration_hours}
              onChange={(e) => setFormData({ ...formData, duration_hours: Number(e.target.value) })}
            />
            <Input
              label="Capacidad Máxima"
              type="number"
              value={formData.max_participants}
              onChange={(e) => setFormData({ ...formData, max_participants: Number(e.target.value) })}
            />
            <Input
              label="Costo"
              type="number"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Instructor"
              value={formData.instructor}
              onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
            />
            <Input
              label="Proveedor"
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fecha de Inicio"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
            <Input
              label="Fecha de Fin"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            />
          </div>

          <Input
            label="Ubicación"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Para cursos presenciales"
          />

          <Input
            label="URL"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            placeholder="Para cursos virtuales"
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Objetivos
            </label>
            <textarea
              value={formData.objectives}
              onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Prerrequisitos
            </label>
            <textarea
              value={formData.prerequisites}
              onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {selectedCourse ? 'Actualizar' : 'Crear'} Curso
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showEnrollmentModal}
        onClose={() => setShowEnrollmentModal(false)}
        title="Inscribir Empleado"
      >
        <form onSubmit={handleSubmitEnrollment} className="space-y-4">
          {selectedCourse && (
            <div className="bg-slate-50 p-4 rounded-lg mb-4">
              <p className="text-sm font-medium text-slate-700">Curso:</p>
              <p className="text-lg font-semibold text-slate-900">{selectedCourse.title}</p>
            </div>
          )}

          <Autocomplete
            label="Empleado"
            value={enrollmentFormData.employee_id}
            onChange={(value) => setEnrollmentFormData({ ...enrollmentFormData, employee_id: value })}
            options={employees.map((emp) => ({
              value: emp.id,
              label: `${emp.first_name} ${emp.last_name}`,
              description: `Nro: ${emp.employee_number}`
            }))}
            placeholder="Buscar empleado"
            required
          />

          <Input
            label="Fecha de Inscripción"
            type="date"
            value={enrollmentFormData.enrollment_date}
            onChange={(e) => setEnrollmentFormData({ ...enrollmentFormData, enrollment_date: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Estado
            </label>
            <select
              value={enrollmentFormData.status}
              onChange={(e) => setEnrollmentFormData({ ...enrollmentFormData, status: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {enrollmentStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              Inscribir
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowEnrollmentModal(false)} className="flex-1">
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Eliminar Curso"
        message="¿Está seguro de que desea eliminar este curso? Esta acción no se puede deshacer."
      />
    </div>
  );
}
