import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useToast } from '../../hooks/useToast';
import Button from '../ui/Button';
import Input from '../ui/Input';
import ConfirmDialog from '../ui/ConfirmDialog';

interface WorkWeek {
  id: string;
  company_id: string;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

interface Holiday {
  id: string;
  company_id: string;
  date: string;
  name: string;
  recurring: boolean;
  is_active: boolean;
}

export function WorkCalendarPanel() {
  const { selectedCompanyId } = useCompany();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [holidayToDelete, setHolidayToDelete] = useState<string | null>(null);
  const [showAddHoliday, setShowAddHoliday] = useState(false);

  const [workWeek, setWorkWeek] = useState<WorkWeek>({
    id: '',
    company_id: selectedCompanyId || '',
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false
  });

  const [newHoliday, setNewHoliday] = useState({
    date: '',
    name: '',
    recurring: false
  });

  useEffect(() => {
    if (selectedCompanyId) {
      loadWorkWeek();
      loadHolidays();
    }
  }, [selectedCompanyId]);

  const loadWorkWeek = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('work_weeks')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setWorkWeek(data);
      }
    } catch (error) {
      console.error('Error loading work week:', error);
      showToast('Error al cargar configuración de días laborables', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadHolidays = async () => {
    try {
      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .eq('is_active', true)
        .order('date', { ascending: true });

      if (error) throw error;
      setHolidays(data || []);
    } catch (error) {
      console.error('Error loading holidays:', error);
    }
  };

  const saveWorkWeek = async () => {
    try {
      setSaving(true);

      if (workWeek.id) {
        const { error } = await supabase
          .from('work_weeks')
          .update({
            monday: workWeek.monday,
            tuesday: workWeek.tuesday,
            wednesday: workWeek.wednesday,
            thursday: workWeek.thursday,
            friday: workWeek.friday,
            saturday: workWeek.saturday,
            sunday: workWeek.sunday,
            updated_at: new Date().toISOString()
          })
          .eq('id', workWeek.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('work_weeks')
          .insert({
            company_id: selectedCompanyId,
            monday: workWeek.monday,
            tuesday: workWeek.tuesday,
            wednesday: workWeek.wednesday,
            thursday: workWeek.thursday,
            friday: workWeek.friday,
            saturday: workWeek.saturday,
            sunday: workWeek.sunday
          })
          .select()
          .single();

        if (error) throw error;
        if (data) setWorkWeek(data);
      }

      showToast('Configuración guardada exitosamente', 'success');
    } catch (error) {
      console.error('Error saving work week:', error);
      showToast('Error al guardar configuración', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addHoliday = async () => {
    if (!newHoliday.date || !newHoliday.name.trim()) {
      showToast('Complete todos los campos', 'error');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('holidays')
        .insert({
          company_id: selectedCompanyId,
          date: newHoliday.date,
          name: newHoliday.name.trim(),
          recurring: newHoliday.recurring,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      setHolidays([...holidays, data]);
      setNewHoliday({ date: '', name: '', recurring: false });
      setShowAddHoliday(false);
      showToast('Feriado agregado exitosamente', 'success');
    } catch (error) {
      console.error('Error adding holiday:', error);
      showToast('Error al agregar feriado', 'error');
    }
  };

  const deleteHoliday = async () => {
    if (!holidayToDelete) return;

    try {
      const { error } = await supabase
        .from('holidays')
        .update({ is_active: false })
        .eq('id', holidayToDelete);

      if (error) throw error;

      setHolidays(holidays.filter(h => h.id !== holidayToDelete));
      showToast('Feriado eliminado exitosamente', 'success');
    } catch (error) {
      console.error('Error deleting holiday:', error);
      showToast('Error al eliminar feriado', 'error');
    } finally {
      setShowDeleteConfirm(false);
      setHolidayToDelete(null);
    }
  };

  const dayLabels = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-600">Cargando configuración...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-slate-900">Días Laborables</h2>
          </div>
          <p className="text-sm text-slate-600 mt-2">
            Seleccione los días de la semana que se consideran laborables para el cálculo de ausencias
          </p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {Object.entries(dayLabels).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={workWeek[key as keyof Omit<WorkWeek, 'id' | 'company_id'>]}
                  onChange={(e) => setWorkWeek({ ...workWeek, [key]: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700">{label}</span>
              </label>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={saveWorkWeek} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-slate-900">Feriados</h2>
              </div>
              <p className="text-sm text-slate-600 mt-2">
                Configure los días feriados que no se consideran laborables
              </p>
            </div>
            <Button onClick={() => setShowAddHoliday(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Feriado
            </Button>
          </div>
        </div>

        <div className="p-6">
          {holidays.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No hay feriados configurados
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Fecha</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Nombre</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Tipo</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {holidays.map((holiday) => (
                    <tr key={holiday.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm text-slate-900">
                        {new Date(holiday.date + 'T00:00:00').toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-900">{holiday.name}</td>
                      <td className="py-3 px-4 text-sm">
                        {holiday.recurring ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            Anual
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                            Único
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setHolidayToDelete(holiday.id);
                            setShowDeleteConfirm(true);
                          }}
                          className="text-red-600 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showAddHoliday && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Agregar Feriado</h3>

            <div className="space-y-4">
              <Input
                label="Fecha"
                type="date"
                value={newHoliday.date}
                onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                required
              />

              <Input
                label="Nombre"
                value={newHoliday.name}
                onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                placeholder="Ej: Año Nuevo, Día de la Independencia"
                required
              />

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={newHoliday.recurring}
                  onChange={(e) => setNewHoliday({ ...newHoliday, recurring: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">
                  Se repite cada año (feriado anual)
                </span>
              </label>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddHoliday(false);
                  setNewHoliday({ date: '', name: '', recurring: false });
                }}
              >
                Cancelar
              </Button>
              <Button onClick={addHoliday}>
                Agregar
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setHolidayToDelete(null);
        }}
        onConfirm={deleteHoliday}
        title="Eliminar Feriado"
        message="¿Está seguro que desea eliminar este feriado?"
        confirmText="Eliminar"
      />
    </div>
  );
}
