import { useEffect, useState } from 'react';
import { Calendar, Save, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useToast } from '../../hooks/useToast';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface VacationConfig {
  vacation_days_per_year: number;
  vacation_days_per_seniority_year: number;
  vacation_seniority_years_threshold: number;
  vacation_allow_carryover: boolean;
  vacation_max_carryover_days: number;
  vacation_carryover_expiry_months: number;
}

export default function VacationConfigPanel() {
  const { selectedCompanyId } = useCompany();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [config, setConfig] = useState<VacationConfig>({
    vacation_days_per_year: 20,
    vacation_days_per_seniority_year: 1,
    vacation_seniority_years_threshold: 5,
    vacation_allow_carryover: true,
    vacation_max_carryover_days: 5,
    vacation_carryover_expiry_months: 3
  });

  useEffect(() => {
    if (selectedCompanyId) {
      loadConfiguration();
    }
  }, [selectedCompanyId]);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('companies')
        .select('vacation_days_per_year, vacation_days_per_seniority_year, vacation_seniority_years_threshold, vacation_allow_carryover, vacation_max_carryover_days, vacation_carryover_expiry_months')
        .eq('id', selectedCompanyId)
        .single();

      if (error) throw error;

      if (data) {
        setConfig({
          vacation_days_per_year: data.vacation_days_per_year || 20,
          vacation_days_per_seniority_year: data.vacation_days_per_seniority_year || 1,
          vacation_seniority_years_threshold: data.vacation_seniority_years_threshold || 5,
          vacation_allow_carryover: data.vacation_allow_carryover !== false,
          vacation_max_carryover_days: data.vacation_max_carryover_days || 5,
          vacation_carryover_expiry_months: data.vacation_carryover_expiry_months || 3
        });
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
      showToast('Error al cargar configuración', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('companies')
        .update(config)
        .eq('id', selectedCompanyId);

      if (error) throw error;

      showToast('Configuración guardada exitosamente', 'success');
    } catch (error: any) {
      console.error('Error saving configuration:', error);
      showToast(error.message || 'Error al guardar configuración', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateBalances = async () => {
    try {
      setGenerating(true);
      const currentYear = new Date().getFullYear();

      const { error } = await supabase.rpc('generate_annual_vacation_balances', {
        p_company_id: selectedCompanyId,
        p_year: currentYear
      });

      if (error) throw error;

      showToast(
        `Saldos de vacaciones generados exitosamente para el año ${currentYear}`,
        'success'
      );
    } catch (error: any) {
      console.error('Error generating balances:', error);
      showToast(error.message || 'Error al generar saldos', 'error');
    } finally {
      setGenerating(false);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Configuración de Vacaciones</h2>
          <p className="text-slate-600 mt-1">
            Define los parámetros de cálculo de vacaciones para tu empresa
          </p>
        </div>
        <Calendar className="w-8 h-8 text-blue-600" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Días de Vacaciones Anuales</h3>
          <p className="text-sm text-slate-600 mt-1">
            Configura la cantidad base de días de vacaciones que recibe cada empleado
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Días de vacaciones por año"
              type="number"
              value={config.vacation_days_per_year}
              onChange={(e) =>
                setConfig({ ...config, vacation_days_per_year: parseInt(e.target.value) || 0 })
              }
              min="0"
              required
              helperText="Días base que recibe cada empleado al año"
            />

            <Input
              label="Años para sumar días adicionales"
              type="number"
              value={config.vacation_seniority_years_threshold}
              onChange={(e) =>
                setConfig({
                  ...config,
                  vacation_seniority_years_threshold: parseInt(e.target.value) || 0
                })
              }
              min="0"
              required
              helperText="Cada X años de antigüedad se suman días extra"
            />

            <Input
              label="Días adicionales por antigüedad"
              type="number"
              value={config.vacation_days_per_seniority_year}
              onChange={(e) =>
                setConfig({
                  ...config,
                  vacation_days_per_seniority_year: parseInt(e.target.value) || 0
                })
              }
              min="0"
              required
              helperText="Días que se suman al alcanzar el umbral de antigüedad"
            />
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">Ejemplo de Cálculo:</p>
            <p className="text-sm text-blue-800">
              Un empleado con <strong>10 años</strong> de antigüedad recibirá:{' '}
              <strong>
                {config.vacation_days_per_year +
                  Math.floor(10 / config.vacation_seniority_years_threshold) *
                    config.vacation_days_per_seniority_year}{' '}
                días
              </strong>{' '}
              ({config.vacation_days_per_year} base +{' '}
              {Math.floor(10 / config.vacation_seniority_years_threshold)} x{' '}
              {config.vacation_days_per_seniority_year} por antigüedad)
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Arrastre de Días No Usados</h3>
          <p className="text-sm text-slate-600 mt-1">
            Permite que los empleados arrastren días no usados al año siguiente
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.vacation_allow_carryover}
                onChange={(e) =>
                  setConfig({ ...config, vacation_allow_carryover: e.target.checked })
                }
                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-slate-900">
                  Permitir arrastre de días no usados
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Los días no usados pueden trasladarse al siguiente año
                </p>
              </div>
            </label>
          </div>

          {config.vacation_allow_carryover && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-8">
              <Input
                label="Máximo de días a arrastrar"
                type="number"
                value={config.vacation_max_carryover_days}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    vacation_max_carryover_days: parseInt(e.target.value) || 0
                  })
                }
                min="0"
                required
                helperText="Cantidad máxima de días que se pueden arrastrar"
              />

              <Input
                label="Meses para usar días arrastrados"
                type="number"
                value={config.vacation_carryover_expiry_months}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    vacation_carryover_expiry_months: parseInt(e.target.value) || 0
                  })
                }
                min="1"
                max="12"
                required
                helperText="Plazo para usar los días arrastrados"
              />
            </div>
          )}

          {config.vacation_allow_carryover && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-900">
                <strong>Nota:</strong> Los días arrastrados deben usarse dentro de los primeros{' '}
                {config.vacation_carryover_expiry_months} meses del año siguiente, de lo contrario se
                perderán.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Generación de Saldos</h3>
          <p className="text-sm text-slate-600 mt-1">
            Genera automáticamente los saldos de vacaciones para todos los empleados
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-sm text-slate-700 mb-3">
              Esta acción generará o actualizará los saldos de vacaciones para todos los empleados
              activos del año actual, calculando automáticamente:
            </p>
            <ul className="text-sm text-slate-600 space-y-1 ml-5 list-disc">
              <li>Días base según configuración</li>
              <li>Días adicionales por antigüedad</li>
              <li>Días arrastrados del año anterior (si aplica)</li>
            </ul>
          </div>

          <Button
            onClick={handleGenerateBalances}
            disabled={generating}
            className="w-full md:w-auto"
          >
            {generating ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Generando Saldos...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5 mr-2" />
                Generar Saldos del Año Actual
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving} className="flex-1 md:flex-initial">
          {saving ? (
            <>
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Guardar Configuración
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
