import { useState, useEffect } from 'react';
import { FileText, Plus, Edit2, Copy, History, Trash2, Save, X, Sparkles } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useToast } from '../../hooks/useToast';

interface ContractTemplate {
  id: string;
  name: string;
  position_id: string | null;
  position_name?: string;
  content: string;
  version: number;
  is_active: boolean;
  created_at: string;
  notes: string;
}

export default function ContractTemplates() {
  const { selectedCompanyId } = useCompany();
  const toast = useToast();
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [positions, setPositions] = useState<Array<{ id: string; title: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [versions, setVersions] = useState<ContractTemplate[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    position_id: '',
    content: '',
    notes: ''
  });

  useEffect(() => {
    if (selectedCompanyId) {
      loadTemplates();
      loadPositions();
    }
  }, [selectedCompanyId]);

  const loadTemplates = async () => {
    if (!selectedCompanyId) return;

    setIsLoading(true);
    try {
      const { data: templatesData, error } = await supabase
        .from('contract_templates')
        .select(`
          id,
          name,
          position_id,
          content,
          version,
          is_active,
          created_at,
          notes
        `)
        .eq('company_id', selectedCompanyId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const templatesWithPositions = await Promise.all(
        (templatesData || []).map(async (template) => {
          if (template.position_id) {
            const { data: posData } = await supabase
              .from('positions')
              .select('title')
              .eq('id', template.position_id)
              .maybeSingle();

            return { ...template, position_name: posData?.title || 'Sin asignar' };
          }
          return { ...template, position_name: 'General' };
        })
      );

      setTemplates(templatesWithPositions);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Error al cargar las plantillas');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPositions = async () => {
    if (!selectedCompanyId) return;

    const { data, error } = await supabase
      .from('positions')
      .select('id, title')
      .eq('company_id', selectedCompanyId)
      .order('title');

    if (!error && data) {
      setPositions(data);
    }
  };

  const loadVersions = async (templateId: string) => {
    if (!selectedCompanyId) return;

    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) return;

      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .eq('name', template.name)
        .or(`position_id.is.null,position_id.eq.${template.position_id}`)
        .order('version', { ascending: false });

      if (error) throw error;
      setVersions(data || []);
      setShowVersionsModal(true);
    } catch (error) {
      console.error('Error loading versions:', error);
      toast.error('Error al cargar versiones');
    }
  };

  const handleCreate = () => {
    setSelectedTemplate(null);
    setFormData({
      name: '',
      position_id: '',
      content: `CONTRATO INDIVIDUAL DE TRABAJO

Entre:
[NOMBRE_EMPRESA], con domicilio en [DIRECCION_EMPRESA], representada en este acto por [REPRESENTANTE_EMPRESA], en calidad de [CARGO_REPRESENTANTE], a quien en adelante se denominará "EL EMPLEADOR", por una parte.

Y por la otra, [NOMBRE_EMPLEADO], titular de la cédula de identidad/DNI número [RFC_EMPLEADO], con domicilio en [DIRECCION_EMPLEADO], quien en adelante se denominará "EL TRABAJADOR", convienen celebrar el presente contrato de trabajo, el cual se regirá por las siguientes cláusulas:

CLÁUSULAS

PRIMERA – Objeto:
El EMPLEADOR contrata al TRABAJADOR para desempeñar el cargo de [PUESTO_EMPLEADO].

...

Firmas:

_________________________              _________________________
[REPRESENTANTE_EMPRESA]                [NOMBRE_EMPLEADO]
[CARGO_REPRESENTANTE]                  RFC: [RFC_EMPLEADO]

Fecha: [FECHA_CONTRATO]`,
      notes: ''
    });
    setShowModal(true);
  };

  const handleEdit = (template: ContractTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      position_id: template.position_id || '',
      content: template.content,
      notes: ''
    });
    setShowModal(true);
  };

  const handleDuplicate = async (template: ContractTemplate) => {
    setSelectedTemplate(null);
    setFormData({
      name: `${template.name} (Copia)`,
      position_id: '',
      content: template.content,
      notes: 'Copia de plantilla existente'
    });
    setShowModal(true);
  };

  const handleGenerateWithAI = async () => {
    if (!formData.position_id) {
      toast.error('Selecciona un puesto para generar el contrato con IA');
      return;
    }

    setIsGenerating(true);
    try {
      const position = positions.find(p => p.id === formData.position_id);
      if (!position) return;

      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('legal_name, location_id')
        .eq('id', selectedCompanyId)
        .maybeSingle();

      if (companyError) throw companyError;

      let country = 'México';
      if (companyData?.location_id) {
        const { data: locationData } = await supabase
          .from('locations')
          .select('country')
          .eq('id', companyData.location_id)
          .maybeSingle();

        if (locationData?.country) {
          country = locationData.country;
        }
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-contract-template`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            positionTitle: position.title,
            positionDescription: '',
            companyName: companyData?.legal_name || '[NOMBRE_EMPRESA]',
            country: country
          })
        }
      );

      if (!response.ok) {
        throw new Error('Error al generar contrato con IA');
      }

      const data = await response.json();
      setFormData({
        ...formData,
        content: data.template,
        notes: 'Generado con IA y pendiente de revisión'
      });
      toast.success('Contrato generado con IA. Revisa y ajusta según sea necesario.');
    } catch (error) {
      console.error('Error generating with AI:', error);
      toast.error('Error al generar contrato con IA');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!selectedCompanyId) return;
    if (!formData.name.trim() || !formData.content.trim()) {
      toast.error('El nombre y contenido son requeridos');
      return;
    }

    try {
      if (selectedTemplate) {
        await supabase
          .from('contract_templates')
          .update({ is_active: false })
          .eq('company_id', selectedCompanyId)
          .eq('name', selectedTemplate.name)
          .or(`position_id.is.null,position_id.eq.${selectedTemplate.position_id}`);

        const { error } = await supabase
          .from('contract_templates')
          .insert({
            company_id: selectedCompanyId,
            name: formData.name,
            position_id: formData.position_id || null,
            content: formData.content,
            version: selectedTemplate.version + 1,
            is_active: true,
            notes: formData.notes
          });

        if (error) throw error;
        toast.success('Nueva versión creada exitosamente');
      } else {
        const { error } = await supabase
          .from('contract_templates')
          .insert({
            company_id: selectedCompanyId,
            name: formData.name,
            position_id: formData.position_id || null,
            content: formData.content,
            version: 1,
            is_active: true,
            notes: formData.notes
          });

        if (error) throw error;
        toast.success('Plantilla creada exitosamente');
      }

      setShowModal(false);
      loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Error al guardar la plantilla');
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta plantilla y todas sus versiones?')) return;

    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) return;

      const { error } = await supabase
        .from('contract_templates')
        .delete()
        .eq('company_id', selectedCompanyId)
        .eq('name', template.name)
        .or(`position_id.is.null,position_id.eq.${template.position_id}`);

      if (error) throw error;
      toast.success('Plantilla eliminada');
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Error al eliminar la plantilla');
    }
  };

  const handleActivateVersion = async (versionId: string) => {
    if (!selectedCompanyId) return;

    try {
      const version = versions.find(v => v.id === versionId);
      if (!version) return;

      await supabase
        .from('contract_templates')
        .update({ is_active: false })
        .eq('company_id', selectedCompanyId)
        .eq('name', version.name)
        .or(`position_id.is.null,position_id.eq.${version.position_id}`);

      const { error } = await supabase
        .from('contract_templates')
        .update({ is_active: true })
        .eq('id', versionId);

      if (error) throw error;
      toast.success('Versión activada');
      setShowVersionsModal(false);
      loadTemplates();
    } catch (error) {
      console.error('Error activating version:', error);
      toast.error('Error al activar versión');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Plantillas de Contratos</h2>
          <p className="text-slate-600 mt-1">Gestiona las plantillas de contratos por puesto</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Plantilla
        </Button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Variables disponibles:</h3>
        <div className="grid grid-cols-3 gap-2 text-xs text-blue-800">
          <div>[NOMBRE_EMPRESA]</div>
          <div>[DIRECCION_EMPRESA]</div>
          <div>[REPRESENTANTE_EMPRESA]</div>
          <div>[CARGO_REPRESENTANTE]</div>
          <div>[NOMBRE_EMPLEADO]</div>
          <div>[RFC_EMPLEADO]</div>
          <div>[DIRECCION_EMPLEADO]</div>
          <div>[CIUDAD_EMPLEADO]</div>
          <div>[PAIS_EMPLEADO]</div>
          <div>[PUESTO_EMPLEADO]</div>
          <div>[DEPARTAMENTO_EMPLEADO]</div>
          <div>[TIPO_EMPLEO]</div>
          <div>[FECHA_INICIO]</div>
          <div>[SALARIO]</div>
          <div>[BANCO]</div>
          <div>[NUMERO_CUENTA]</div>
          <div>[TIPO_CUENTA]</div>
          <div>[CARNET_SALUD]</div>
          <div>[VIGENCIA_CARNET]</div>
          <div>[CONTACTO_EMERGENCIA]</div>
          <div>[RELACION_EMERGENCIA]</div>
          <div>[TELEFONO_EMERGENCIA]</div>
          <div>[FECHA_CONTRATO]</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-slate-900">{template.name}</h3>
                    <p className="text-sm text-slate-500">
                      Puesto: {template.position_name} • Versión {template.version}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mt-3 line-clamp-2">{template.content.substring(0, 150)}...</p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => loadVersions(template.id)}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Ver versiones"
                >
                  <History className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEdit(template)}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Crear nueva versión"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDuplicate(template)}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Duplicar"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {templates.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No hay plantillas creadas</p>
            <Button onClick={handleCreate} variant="primary" className="mt-4">
              Crear primera plantilla
            </Button>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedTemplate ? 'Crear Nueva Versión' : 'Nueva Plantilla'}
        size="xl"
      >
        <div className="space-y-4">
          <Input
            label="Nombre de la Plantilla"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Contrato Tiempo Completo"
            disabled={!!selectedTemplate}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Puesto Asociado (Opcional)
            </label>
            <select
              value={formData.position_id}
              onChange={(e) => setFormData({ ...formData, position_id: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!!selectedTemplate}
            >
              <option value="">Plantilla General</option>
              {positions.map((pos) => (
                <option key={pos.id} value={pos.id}>{pos.title}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">
                Contenido de la Plantilla
              </label>
              {!selectedTemplate && formData.position_id && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleGenerateWithAI}
                  disabled={isGenerating}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isGenerating ? 'Generando...' : 'Generar con IA'}
                </Button>
              )}
            </div>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={15}
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="Escribe el contenido del contrato usando las variables o genera uno con IA..."
            />
            {isGenerating && (
              <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Generando contrato con IA...</span>
              </div>
            )}
          </div>

          {selectedTemplate && (
            <Input
              label="Notas de la Versión"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Describe los cambios en esta versión..."
            />
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSave} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              {selectedTemplate ? 'Crear Nueva Versión' : 'Guardar Plantilla'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showVersionsModal}
        onClose={() => setShowVersionsModal(false)}
        title="Historial de Versiones"
        size="lg"
      >
        <div className="space-y-3">
          {versions.map((version) => (
            <div
              key={version.id}
              className={`border rounded-lg p-4 ${
                version.is_active ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">Versión {version.version}</span>
                    {version.is_active && (
                      <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                        Activa
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-1">
                    {new Date(version.created_at).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                  {version.notes && (
                    <p className="text-sm text-slate-700 mt-2 italic">{version.notes}</p>
                  )}
                </div>
                {!version.is_active && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleActivateVersion(version.id)}
                  >
                    Activar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
