import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Plus, Trash2, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

interface IRPFConfig {
  id: string;
  fiscal_year: number;
  bpc_value: number;
  minimum_non_taxable_bpc: number;
  is_active: boolean;
}

interface IRPFBracket {
  id: string;
  from_bpc: number;
  to_bpc: number | null;
  rate: number;
  sort_order: number;
}

export default function IRPFConfigPanel() {
  const { selectedCompanyId } = useCompany();
  const [configs, setConfigs] = useState<IRPFConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<IRPFConfig | null>(null);
  const [brackets, setBrackets] = useState<IRPFBracket[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    fiscal_year: new Date().getFullYear(),
    bpc_value: 6576,
    minimum_non_taxable_bpc: 7,
    is_active: true
  });

  useEffect(() => {
    if (selectedCompanyId) {
      loadConfigs();
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    if (selectedConfig) {
      loadBrackets(selectedConfig.id);
    }
  }, [selectedConfig]);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('irpf_configuration')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .order('fiscal_year', { ascending: false });

      if (error) throw error;
      setConfigs(data || []);

      if (data && data.length > 0) {
        const activeConfig = data.find(c => c.is_active) || data[0];
        setSelectedConfig(activeConfig);
        setFormData({
          fiscal_year: activeConfig.fiscal_year,
          bpc_value: activeConfig.bpc_value,
          minimum_non_taxable_bpc: activeConfig.minimum_non_taxable_bpc,
          is_active: activeConfig.is_active
        });
      }
    } catch (error) {
      console.error('Error loading IRPF configs:', error);
      showToast('Error al cargar configuraciones de IRPF', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadBrackets = async (configId: string) => {
    try {
      const { data, error } = await supabase
        .from('irpf_brackets')
        .select('*')
        .eq('irpf_config_id', configId)
        .order('sort_order');

      if (error) throw error;
      setBrackets(data || []);
    } catch (error) {
      console.error('Error loading brackets:', error);
      showToast('Error al cargar tramos de IRPF', 'error');
    }
  };

  const handleCreateConfig = async () => {
    try {
      setSaving(true);

      const { data: newConfig, error: configError } = await supabase
        .from('irpf_configuration')
        .insert({
          company_id: selectedCompanyId,
          fiscal_year: formData.fiscal_year,
          bpc_value: formData.bpc_value,
          minimum_non_taxable_bpc: formData.minimum_non_taxable_bpc,
          is_active: formData.is_active
        })
        .select()
        .single();

      if (configError) throw configError;

      const defaultBrackets = [
        { from_bpc: 0, to_bpc: 7, rate: 0.00, sort_order: 1 },
        { from_bpc: 7, to_bpc: 10, rate: 0.10, sort_order: 2 },
        { from_bpc: 10, to_bpc: 15, rate: 0.15, sort_order: 3 },
        { from_bpc: 15, to_bpc: 30, rate: 0.24, sort_order: 4 },
        { from_bpc: 30, to_bpc: 50, rate: 0.25, sort_order: 5 },
        { from_bpc: 50, to_bpc: 75, rate: 0.27, sort_order: 6 },
        { from_bpc: 75, to_bpc: 115, rate: 0.31, sort_order: 7 },
        { from_bpc: 115, to_bpc: null, rate: 0.36, sort_order: 8 }
      ];

      const { error: bracketsError } = await supabase
        .from('irpf_brackets')
        .insert(
          defaultBrackets.map(b => ({
            ...b,
            irpf_config_id: newConfig.id
          }))
        );

      if (bracketsError) throw bracketsError;

      showToast('Configuración de IRPF creada exitosamente', 'success');
      loadConfigs();
    } catch (error: any) {
      console.error('Error creating config:', error);
      showToast(error.message || 'Error al crear configuración', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateConfig = async () => {
    if (!selectedConfig) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('irpf_configuration')
        .update({
          bpc_value: formData.bpc_value,
          minimum_non_taxable_bpc: formData.minimum_non_taxable_bpc,
          is_active: formData.is_active
        })
        .eq('id', selectedConfig.id);

      if (error) throw error;

      showToast('Configuración actualizada exitosamente', 'success');
      loadConfigs();
    } catch (error: any) {
      console.error('Error updating config:', error);
      showToast(error.message || 'Error al actualizar configuración', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBracket = async (bracketId: string, field: string, value: any) => {
    try {
      const { error } = await supabase
        .from('irpf_brackets')
        .update({ [field]: value })
        .eq('id', bracketId);

      if (error) throw error;

      setBrackets(prev => prev.map(b =>
        b.id === bracketId ? { ...b, [field]: value } : b
      ));
    } catch (error: any) {
      console.error('Error updating bracket:', error);
      showToast(error.message || 'Error al actualizar tramo', 'error');
    }
  };

  const handleAddBracket = async () => {
    if (!selectedConfig) return;

    try {
      const maxSortOrder = Math.max(...brackets.map(b => b.sort_order), 0);
      const lastBracket = brackets[brackets.length - 1];

      const { data, error } = await supabase
        .from('irpf_brackets')
        .insert({
          irpf_config_id: selectedConfig.id,
          from_bpc: lastBracket ? (lastBracket.to_bpc || 0) : 0,
          to_bpc: null,
          rate: 0,
          sort_order: maxSortOrder + 1
        })
        .select()
        .single();

      if (error) throw error;

      setBrackets(prev => [...prev, data]);
      showToast('Tramo agregado', 'success');
    } catch (error: any) {
      console.error('Error adding bracket:', error);
      showToast(error.message || 'Error al agregar tramo', 'error');
    }
  };

  const handleDeleteBracket = async (bracketId: string) => {
    if (!confirm('¿Está seguro de eliminar este tramo?')) return;

    try {
      const { error } = await supabase
        .from('irpf_brackets')
        .delete()
        .eq('id', bracketId);

      if (error) throw error;

      setBrackets(prev => prev.filter(b => b.id !== bracketId));
      showToast('Tramo eliminado', 'success');
    } catch (error: any) {
      console.error('Error deleting bracket:', error);
      showToast(error.message || 'Error al eliminar tramo', 'error');
    }
  };

  const handleLoadUruguay2025 = async () => {
    if (!selectedCompanyId) return;

    try {
      setSaving(true);

      const { error } = await supabase.rpc('create_irpf_config_2025_uruguay', {
        p_company_id: selectedCompanyId
      });

      if (error) throw error;

      showToast('Configuración de Uruguay 2025 cargada exitosamente', 'success');
      loadConfigs();
    } catch (error: any) {
      console.error('Error loading Uruguay 2025:', error);
      showToast(error.message || 'Error al cargar configuración', 'error');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Configuración de IRPF</h3>
          <p className="text-sm text-slate-600 mt-1">
            Configure los tramos de IRPF basados en BPC (Base de Prestaciones y Contribuciones)
          </p>
        </div>
        <Button onClick={handleLoadUruguay2025} variant="outline">
          Cargar Uruguay 2025
        </Button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Cálculo Progresivo de IRPF</p>
            <p>
              El IRPF se calcula de forma progresiva: cada tramo se aplica solo a la porción del salario
              que cae dentro de ese rango. El mínimo no imponible es típicamente 7 BPC en Uruguay.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-medium text-slate-900">Configuración General</h4>

          {configs.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Año Fiscal
              </label>
              <select
                value={selectedConfig?.id || ''}
                onChange={(e) => {
                  const config = configs.find(c => c.id === e.target.value);
                  if (config) {
                    setSelectedConfig(config);
                    setFormData({
                      fiscal_year: config.fiscal_year,
                      bpc_value: config.bpc_value,
                      minimum_non_taxable_bpc: config.minimum_non_taxable_bpc,
                      is_active: config.is_active
                    });
                  }
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {configs.map(config => (
                  <option key={config.id} value={config.id}>
                    {config.fiscal_year} {config.is_active && '(Activo)'}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Input
            label="Año Fiscal"
            type="number"
            value={formData.fiscal_year}
            onChange={(e) => setFormData({ ...formData, fiscal_year: parseInt(e.target.value) })}
            disabled={!!selectedConfig}
          />

          <Input
            label="Valor de BPC ($)"
            type="number"
            step="0.01"
            value={formData.bpc_value}
            onChange={(e) => setFormData({ ...formData, bpc_value: parseFloat(e.target.value) })}
          />

          <Input
            label="Mínimo No Imponible (BPC)"
            type="number"
            step="0.01"
            value={formData.minimum_non_taxable_bpc}
            onChange={(e) => setFormData({ ...formData, minimum_non_taxable_bpc: parseFloat(e.target.value) })}
          />

          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-600">
              Mínimo no imponible: {formatCurrency(formData.bpc_value * formData.minimum_non_taxable_bpc)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Salarios por debajo de este monto no pagan IRPF
            </p>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">Configuración activa</span>
          </label>

          {selectedConfig ? (
            <Button onClick={handleUpdateConfig} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              Actualizar Configuración
            </Button>
          ) : (
            <Button onClick={handleCreateConfig} disabled={saving}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Configuración
            </Button>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-slate-900">Tramos de IRPF</h4>
            {selectedConfig && (
              <Button variant="outline" size="sm" onClick={handleAddBracket}>
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>

          {!selectedConfig ? (
            <div className="bg-slate-50 rounded-lg p-8 text-center text-slate-500">
              Seleccione o cree una configuración para gestionar los tramos
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-slate-600 px-2">
                <div className="col-span-3">Desde BPC</div>
                <div className="col-span-3">Hasta BPC</div>
                <div className="col-span-2">Tasa %</div>
                <div className="col-span-3">Rango $</div>
                <div className="col-span-1"></div>
              </div>

              {brackets.map((bracket) => {
                const fromAmount = formData.bpc_value * bracket.from_bpc;
                const toAmount = bracket.to_bpc ? formData.bpc_value * bracket.to_bpc : null;

                return (
                  <div key={bracket.id} className="grid grid-cols-12 gap-2 items-center bg-white border border-slate-200 rounded-lg p-2">
                    <div className="col-span-3">
                      <input
                        type="number"
                        step="0.01"
                        value={bracket.from_bpc}
                        onChange={(e) => handleUpdateBracket(bracket.id, 'from_bpc', parseFloat(e.target.value))}
                        className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="col-span-3">
                      <input
                        type="number"
                        step="0.01"
                        value={bracket.to_bpc || ''}
                        onChange={(e) => handleUpdateBracket(bracket.id, 'to_bpc', e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder="Sin límite"
                        className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="col-span-2">
                      <input
                        type="number"
                        step="0.01"
                        value={(bracket.rate * 100).toFixed(2)}
                        onChange={(e) => handleUpdateBracket(bracket.id, 'rate', parseFloat(e.target.value) / 100)}
                        className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="col-span-3 text-xs text-slate-600">
                      {formatCurrency(fromAmount)} - {toAmount ? formatCurrency(toAmount) : '∞'}
                    </div>

                    <div className="col-span-1 flex justify-end">
                      <button
                        onClick={() => handleDeleteBracket(bracket.id)}
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedConfig && brackets.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-green-900">
              <p className="font-medium mb-1">Vista Previa de Tramos</p>
              <div className="space-y-1 mt-2">
                {brackets.map((bracket, idx) => {
                  const fromAmount = formData.bpc_value * bracket.from_bpc;
                  const toAmount = bracket.to_bpc ? formData.bpc_value * bracket.to_bpc : null;

                  return (
                    <p key={idx} className="text-xs">
                      {formatCurrency(fromAmount)} - {toAmount ? formatCurrency(toAmount) : 'en adelante'}:
                      <span className="font-semibold ml-1">{(bracket.rate * 100).toFixed(0)}%</span>
                    </p>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
