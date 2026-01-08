import { useState, useEffect } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import { supabase } from '../../lib/supabase';
import { Settings, Save, Database, Sliders, Calendar } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import PayrollNomenclatorsPanel from './PayrollNomenclatorsPanel';
import VacationConfigPanel from './VacationConfigPanel';

interface SystemParameter {
  id: string;
  parameter_key: string;
  parameter_value: any;
  parameter_type: string;
  category: string;
  description: string | null;
  is_editable: boolean;
}

export default function SystemParametersPanel() {
  const { selectedCompanyId } = useCompany();
  const [activeTab, setActiveTab] = useState<'parameters' | 'nomenclators' | 'vacation'>('nomenclators');
  const [parameters, setParameters] = useState<SystemParameter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});

  useEffect(() => {
    loadParameters();
  }, [selectedCompanyId]);

  const loadParameters = async () => {
    if (!selectedCompanyId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_parameters')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .order('category')
        .order('parameter_key');

      if (error) throw error;
      setParameters(data || []);
    } catch (error) {
      console.error('Error loading parameters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (Object.keys(editedValues).length === 0) {
      return;
    }

    setSaving(true);
    try {
      for (const [key, value] of Object.entries(editedValues)) {
        const param = parameters.find(p => p.parameter_key === key);
        if (param) {
          const { error } = await supabase
            .from('system_parameters')
            .update({
              parameter_value: value,
              updated_at: new Date().toISOString(),
            })
            .eq('id', param.id);

          if (error) throw error;
        }
      }

      setEditedValues({});
      loadParameters();
      alert('Parámetros guardados exitosamente');
    } catch (error) {
      console.error('Error saving parameters:', error);
      alert('Error al guardar los parámetros');
    } finally {
      setSaving(false);
    }
  };

  const getValue = (param: SystemParameter) => {
    if (editedValues[param.parameter_key] !== undefined) {
      return editedValues[param.parameter_key];
    }
    return param.parameter_value;
  };

  const setValue = (key: string, value: any) => {
    setEditedValues(prev => ({ ...prev, [key]: value }));
  };

  const groupedParameters = parameters.reduce((acc, param) => {
    if (!acc[param.category]) {
      acc[param.category] = [];
    }
    acc[param.category].push(param);
    return acc;
  }, {} as Record<string, SystemParameter[]>);

  const categoryLabels: Record<string, string> = {
    time: 'Tiempo y Asistencia',
    leave: 'Ausencias y Vacaciones',
    general: 'General',
    payroll: 'Nómina',
    performance: 'Desempeño',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Parámetros del Sistema</h2>
        <p className="text-slate-600 mt-1">Configura los parámetros generales de tu sistema</p>
      </div>

      <div className="border-b border-slate-200">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('nomenclators')}
            className={`flex items-center gap-2 px-1 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'nomenclators'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            Nomencladores de Nómina
          </button>
          <button
            onClick={() => setActiveTab('vacation')}
            className={`flex items-center gap-2 px-1 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'vacation'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Configuración de Vacaciones
          </button>
          <button
            onClick={() => setActiveTab('parameters')}
            className={`flex items-center gap-2 px-1 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'parameters'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Otros Parámetros
          </button>
        </nav>
      </div>

      {activeTab === 'nomenclators' ? (
        <PayrollNomenclatorsPanel />
      ) : activeTab === 'vacation' ? (
        <VacationConfigPanel />
      ) : (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                {Object.keys(editedValues).length > 0 && (
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Guardando...' : `Guardar Cambios (${Object.keys(editedValues).length})`}
                  </Button>
                )}
              </div>

              {parameters.length === 0 ? (
                <div className="text-center py-12">
                  <Settings className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 mb-4">No hay parámetros configurados</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedParameters).map(([category, params]) => (
                    <div key={category} className="border border-slate-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">
                        {categoryLabels[category] || category}
                      </h3>
                      <div className="space-y-4">
                        {params.map((param) => (
                          <div key={param.id} className="grid grid-cols-2 gap-4 items-start">
                            <div>
                              <label className="block text-sm font-medium text-slate-900 mb-1">
                                {param.description || param.parameter_key}
                              </label>
                              <p className="text-xs text-slate-500 font-mono">{param.parameter_key}</p>
                            </div>
                            <div>
                              {param.parameter_type === 'number' && (
                                <Input
                                  type="number"
                                  value={getValue(param)}
                                  onChange={(e) => setValue(param.parameter_key, e.target.value)}
                                  disabled={!param.is_editable}
                                  className={!param.is_editable ? 'bg-slate-50' : ''}
                                />
                              )}
                              {param.parameter_type === 'boolean' && (
                                <div className="flex items-center gap-2 h-10">
                                  <input
                                    type="checkbox"
                                    checked={getValue(param) === 'true' || getValue(param) === true}
                                    onChange={(e) => setValue(param.parameter_key, e.target.checked)}
                                    disabled={!param.is_editable}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-sm text-slate-600">
                                    {getValue(param) === 'true' || getValue(param) === true ? 'Activado' : 'Desactivado'}
                                  </span>
                                </div>
                              )}
                              {param.parameter_type === 'text' && (
                                <Input
                                  type="text"
                                  value={getValue(param)}
                                  onChange={(e) => setValue(param.parameter_key, e.target.value)}
                                  disabled={!param.is_editable}
                                  className={!param.is_editable ? 'bg-slate-50' : ''}
                                />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
