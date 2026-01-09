import { useState, useEffect } from 'react';
import { FileText, Plus, Edit2, Trash2, CheckCircle, AlertCircle, Search, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useToast } from '../../hooks/useToast';
import { useFileUpload } from '../../hooks/useFileUpload';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';
import FileUpload from '../ui/FileUpload';

interface Document {
  id: string;
  company_id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  version: string;
  status: string;
  effective_date: string;
  review_date: string;
  file_name: string;
  created_at: string;
}

const procedureCategories = [
  'Operativo',
  'Administrativo',
  'Financiero',
  'Recursos Humanos',
  'Tecnología',
  'Calidad',
  'Seguridad',
  'Compras',
  'Ventas',
  'Servicio al Cliente',
  'Otro'
];

const documentStatuses = [
  { value: 'draft', label: 'Borrador', color: 'bg-slate-100 text-slate-800' },
  { value: 'under_review', label: 'En Revisión', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'published', label: 'Publicado', color: 'bg-green-100 text-green-800' },
  { value: 'archived', label: 'Archivado', color: 'bg-red-100 text-red-800' }
];

export default function Procedures() {
  const { selectedCompanyId } = useCompany();
  const { showToast } = useToast();
  const { uploadFile, downloadFile, uploading } = useFileUpload();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    category: '',
    version: '1.0',
    status: 'draft',
    effective_date: '',
    review_date: '',
    file_name: '',
    file_path: ''
  });

  useEffect(() => {
    if (selectedCompanyId) {
      loadDocuments();
    }
  }, [selectedCompanyId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .eq('document_type', 'procedure')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      console.error('Error loading procedures:', error);
      showToast(error.message || 'Error al cargar procedimientos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedDocument(null);
    setSelectedFile(null);
    setFormData({
      code: '',
      title: '',
      description: '',
      category: '',
      version: '1.0',
      status: 'draft',
      effective_date: '',
      review_date: '',
      file_name: '',
      file_path: ''
    });
    setShowModal(true);
  };

  const handleEdit = (doc: Document) => {
    setSelectedDocument(doc);
    setSelectedFile(null);
    setFormData({
      code: doc.code,
      title: doc.title,
      description: doc.description || '',
      category: doc.category || '',
      version: doc.version,
      status: doc.status,
      effective_date: doc.effective_date || '',
      review_date: doc.review_date || '',
      file_name: doc.file_name || '',
      file_path: ''
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
      let documentData = {
        ...formData,
        company_id: selectedCompanyId,
        document_type: 'procedure'
      };

      if (selectedFile) {
        const uploadResult = await uploadFile(selectedFile, {
          bucket: 'documents',
          folder: 'procedures',
          companyId: selectedCompanyId
        });

        if (uploadResult) {
          documentData = {
            ...documentData,
            file_path: uploadResult.path,
            file_name: uploadResult.name,
            file_size: uploadResult.size,
            file_type: uploadResult.type
          };
        } else {
          showToast('Error al subir archivo', 'error');
          return;
        }
      }

      if (selectedDocument) {
        const { error } = await supabase
          .from('documents')
          .update(documentData)
          .eq('id', selectedDocument.id);

        if (error) throw error;
        showToast('Procedimiento actualizado exitosamente', 'success');
      } else {
        const { error } = await supabase
          .from('documents')
          .insert(documentData);

        if (error) throw error;
        showToast('Procedimiento creado exitosamente', 'success');
      }

      setShowModal(false);
      setSelectedFile(null);
      loadDocuments();
    } catch (error: any) {
      console.error('Error saving procedure:', error);
      showToast(error.message || 'Error al guardar procedimiento', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showToast('Procedimiento eliminado exitosamente', 'success');
      loadDocuments();
    } catch (error: any) {
      console.error('Error deleting procedure:', error);
      showToast(error.message || 'Error al eliminar procedimiento', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handlePublish = async (doc: Document) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ status: 'published' })
        .eq('id', doc.id);

      if (error) throw error;
      showToast('Procedimiento publicado exitosamente', 'success');
      loadDocuments();
    } catch (error: any) {
      console.error('Error publishing procedure:', error);
      showToast(error.message || 'Error al publicar procedimiento', 'error');
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || doc.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusConfig = (status: string) => {
    return documentStatuses.find(s => s.value === status) || documentStatuses[0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const publishedDocs = documents.filter(d => d.status === 'published').length;
  const draftDocs = documents.filter(d => d.status === 'draft').length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Procedimientos</h1>
          <p className="text-slate-600">Gestión de procedimientos operativos y administrativos</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Procedimiento
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-600">Total Procedimientos</p>
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{documents.length}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-600">Publicados</p>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{publishedDocs}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-600">Borradores</p>
            <FileText className="w-5 h-5 text-slate-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{draftDocs}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-600">En Revisión</p>
            <AlertCircle className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {documents.filter(d => d.status === 'under_review').length}
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
                placeholder="Buscar procedimientos..."
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
              {documentStatuses.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas las categorías</option>
              {procedureCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No hay procedimientos</h3>
              <p className="text-slate-600 mb-4">Comienza creando tu primer procedimiento</p>
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Procedimiento
              </Button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Procedimiento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Versión
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Vigencia
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
                {filteredDocuments.map((doc) => {
                  const statusConfig = getStatusConfig(doc.status);
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{doc.title}</p>
                          <p className="text-sm text-slate-500">{doc.code}</p>
                          {doc.category && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 mt-1">
                              {doc.category}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        v{doc.version}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {doc.effective_date ? (
                          <div className="text-sm text-slate-900">
                            {new Date(doc.effective_date).toLocaleDateString('es-ES')}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {doc.file_path && (
                            <button
                              onClick={() => downloadFile('documents', doc.file_path, doc.file_name)}
                              className="text-purple-600 hover:text-purple-900"
                              title="Descargar"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                          {doc.status === 'draft' && (
                            <button
                              onClick={() => handlePublish(doc)}
                              className="text-green-600 hover:text-green-900"
                              title="Publicar"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(doc)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(doc.id)}
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

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedDocument ? 'Editar Procedimiento' : 'Nuevo Procedimiento'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Código *"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
            />
            <Input
              label="Versión *"
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              required
            />
          </div>

          <Input
            label="Título *"
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
                {procedureCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
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
                {documentStatuses.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fecha de Vigencia"
              type="date"
              value={formData.effective_date}
              onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
            />
            <Input
              label="Fecha de Revisión"
              type="date"
              value={formData.review_date}
              onChange={(e) => setFormData({ ...formData, review_date: e.target.value })}
            />
          </div>

          <FileUpload
            onFileSelect={(file) => setSelectedFile(file)}
            currentFile={selectedDocument?.file_name}
            label="Documento de Procedimiento"
            accept=".pdf,.doc,.docx"
            maxSizeMB={10}
          />

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1" disabled={uploading}>
              {uploading ? 'Subiendo archivo...' : selectedDocument ? 'Actualizar Procedimiento' : 'Crear Procedimiento'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1" disabled={uploading}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Eliminar Procedimiento"
        message="¿Está seguro de que desea eliminar este procedimiento? Esta acción no se puede deshacer."
      />
    </div>
  );
}
