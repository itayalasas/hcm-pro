import { useEffect, useState } from 'react';
import { Hash, Save, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useToast } from '../../hooks/useToast';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface CodeConfig {
  id: string;
  company_id: string | null;
  entity_type: string;
  prefix: string;
  use_year: boolean;
  use_month: boolean;
  sequence_length: number;
  separator: string;
  sample: string | null;
  current_sequence: number;
  active: boolean;
}

const entityTypes = [
  { value: 'company', label: 'Empresas', icon: '🏢' },
  { value: 'employee', label: 'Empleados', icon: '👤' },
  { value: 'department', label: 'Departamentos', icon: '📁' },
  { value: 'work_location', label: 'Ubicaciones', icon: '📍' },
  { value: 'position', label: 'Puestos', icon: '💼' },
  { value: 'academic_level', label: 'Niveles Académicos', icon: '🎓' },
  { value: 'educational_institution', label: 'Instituciones Educativas', icon: '🏫' },
  { value: 'field_of_study', label: 'Campos de Estudio', icon: '📚' },
  { value: 'employment_type', label: 'Tipos de Empleo', icon: '📝' },
];

export default function CodeConfigurationPanel() {
  const { selectedCompanyId } = useCompany();
  const toast = useToast();
  const [configs, setConfigs] = useState<CodeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingConfig, setEditingConfig] = useState<Partial<CodeConfig> | null>(null);

  useEffect(() => {
    if (selectedCompanyId) {
      loadConfigs();
    }
  }, [selectedCompanyId]);

  const loadConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('code_configurations')
        .select('*')
        .or(`company_id.eq.${selectedCompanyId},company_id.is.null`)
        .eq('active', true)
        .order('entity_type', { ascending: true });

      if (error) throw error;
      setConfigs(data || []);
    } catch (error) {
      console.error('Error loading code configurations:', error);
      toast.error('Error al cargar las configuraciones');
    } finally {
      setLoading(false);
    }
  };

  const generateSample = (config: Partial<CodeConfig>): string => {
    let sample = config.prefix || '';
    const sep = config.separator || '';

    if (config.use_year) {
      sample += (sample ? sep : '') + new Date().getFullYear();
    }

    if (config.use_month) {
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      sample += (sample ? sep : '') + month;
    }

    const seqLength = config.sequence_length || 4;
    const sequence = '1'.padStart(seqLength, '0');
    sample += (sample ? sep : '') + sequence;

    return sample;
  };

  const handleEdit = (config: CodeConfig) => {
    setEditingConfig({ ...config });
  };

  const handleSave = async () => {
    if (!editingConfig || !editingConfig.entity_type) {
      toast.warning('Por favor complete todos los campos requeridos');
      return;
    }

    try {
      const sample = generateSample(editingConfig);
      const dataToSave = {
        ...editingConfig,
        sample,
        company_id: selectedCompanyId,
      };

      if (editingConfig.id) {
        const { error } = await supabase
          .from('code_configurations')
          .update(dataToSave)
          .eq('id', editingConfig.id);

        if (error) throw error;
        toast.success('Configuración actualizada correctamente');
      } else {
        const { error } = await supabase
          .from('code_configurations')
          .insert(dataToSave);

        if (error) throw error;
        toast.success('Configuración creada correctamente');
      }

      setEditingConfig(null);
      loadConfigs();
    } catch (error: any) {
      console.error('Error saving code configuration:', error);
      toast.error(error.message || 'Error al guardar la configuración');
    }
  };

  const handleReset = async (configId: string) => {
    if (!confirm('¿Está seguro de reiniciar el contador de secuencia a 0?')) return;

    try {
      const { error } = await supabase
        .from('code_configurations')
        .update({ current_sequence: 0 })
        .eq('id', configId);

      if (error) throw error;
      toast.success('Contador reiniciado correctamente');
      loadConfigs();
    } catch (error) {
      console.error('Error resetting sequence:', error);
      toast.error('Error al reiniciar el contador');
    }
  };

  const getConfigForEntity = (entityType: string): CodeConfig | null => {
    return configs.find(c => c.entity_type === entityType) || null;
  };

  if (!selectedCompanyId) {
    return (
      <div className="text-center py-12">
        <Hash className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-500">Seleccione una empresa para configurar los códigos</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Configuración de Códigos Automáticos</h2>
        <p className="text-slate-600">
          Configure la estructura de los códigos que se generan automáticamente para cada entidad
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {entityTypes.map((entityType) => {
            const config = getConfigForEntity(entityType.value);
            const isEditing = editingConfig?.entity_type === entityType.value;

            return (
              <div key={entityType.value} className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{entityType.icon}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{entityType.label}</h3>
                      {config && (
                        <p className="text-sm text-slate-500">
                          Ejemplo: <code className="px-2 py-1 bg-slate-100 rounded text-blue-600 font-mono">{config.sample}</code>
                        </p>
                      )}
                    </div>
                  </div>
                  {!isEditing && config && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(config)}
                        className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleReset(config.id)}
                        className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm flex items-center gap-2"
                        title="Reiniciar contador de secuencia"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Reiniciar
                      </button>
                    </div>
                  )}
                  {!config && !isEditing && (
                    <button
                      onClick={() => setEditingConfig({
                        entity_type: entityType.value,
                        prefix: entityType.value.substring(0, 3).toUpperCase(),
                        use_year: false,
                        use_month: false,
                        sequence_length: 4,
                        separator: '-',
                        current_sequence: 0,
                        active: true
                      })}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Configurar
                    </button>
                  )}
                </div>

                {isEditing && (
                  <div className="space-y-4 pt-4 border-t border-slate-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Prefijo</label>
                        <Input
                          value={editingConfig.prefix || ''}
                          onChange={(e) => setEditingConfig({ ...editingConfig, prefix: e.target.value.toUpperCase() })}
                          placeholder="EMP"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Separador</label>
                        <Input
                          value={editingConfig.separator || ''}
                          onChange={(e) => setEditingConfig({ ...editingConfig, separator: e.target.value })}
                          placeholder="-"
                          maxLength={2}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Longitud de Secuencia</label>
                      <Input
                        type="number"
                        value={editingConfig.sequence_length || 4}
                        onChange={(e) => setEditingConfig({ ...editingConfig, sequence_length: parseInt(e.target.value) || 4 })}
                        min={1}
                        max={10}
                      />
                      <p className="text-xs text-slate-500 mt-1">Número de dígitos para la secuencia numérica (ej: 4 = 0001)</p>
                    </div>

                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editingConfig.use_year || false}
                          onChange={(e) => setEditingConfig({ ...editingConfig, use_year: e.target.checked })}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">Incluir año (2025)</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editingConfig.use_month || false}
                          onChange={(e) => setEditingConfig({ ...editingConfig, use_month: e.target.checked })}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">Incluir mes (01-12)</span>
                      </label>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-slate-700 mb-1">Vista previa del código:</p>
                      <code className="text-lg font-mono font-bold text-blue-600">{generateSample(editingConfig)}</code>
                    </div>

                    {config && (
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-700">
                          Secuencia actual: <span className="font-bold">{config.current_sequence}</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          El próximo código generado será: <code className="font-mono">{config.prefix}{config.separator}{String(config.current_sequence + 1).padStart(config.sequence_length, '0')}</code>
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => setEditingConfig(null)}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSave}
                        className="flex-1 flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Guardar Configuración
                      </Button>
                    </div>
                  </div>
                )}

                {!isEditing && config && (
                  <div className="grid grid-cols-4 gap-4 text-sm mt-4">
                    <div>
                      <p className="text-slate-500">Prefijo</p>
                      <p className="font-medium text-slate-900">{config.prefix}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Separador</p>
                      <p className="font-medium text-slate-900">{config.separator || '(ninguno)'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Incluye Año/Mes</p>
                      <p className="font-medium text-slate-900">
                        {config.use_year ? 'Año' : ''} {config.use_year && config.use_month ? '/' : ''} {config.use_month ? 'Mes' : ''}
                        {!config.use_year && !config.use_month ? 'No' : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Secuencia Actual</p>
                      <p className="font-medium text-slate-900">{config.current_sequence}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <toast.ToastContainer />
    </div>
  );
}
