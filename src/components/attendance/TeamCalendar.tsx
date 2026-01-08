import { useEffect, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Users, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useToast } from '../../hooks/useToast';

interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  status: string;
  employee?: {
    first_name: string;
    last_name: string;
    employee_number: string;
  };
  leave_type?: {
    name: string;
    code: string;
  };
}

interface Holiday {
  id: string;
  date: string;
  name: string;
  recurring: boolean;
  is_active: boolean;
}

interface WorkWeek {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

interface DayData {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWorkingDay: boolean;
  isHoliday: boolean;
  holidayName?: string;
  leaves: LeaveRequest[];
}

export default function TeamCalendar() {
  const { selectedCompanyId } = useCompany();
  const { showToast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [workWeek, setWorkWeek] = useState<WorkWeek>({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  });
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (selectedCompanyId) {
      loadCalendarData();
    }
  }, [selectedCompanyId, currentDate]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const [leavesResult, holidaysResult, workWeekResult] = await Promise.all([
        supabase
          .from('leave_requests')
          .select(`
            *,
            employee:employees!leave_requests_employee_id_fkey(first_name, last_name, employee_number),
            leave_type:leave_types(name, code)
          `)
          .eq('company_id', selectedCompanyId)
          .eq('status', 'approved')
          .or(`start_date.lte.${endOfMonth.toISOString().split('T')[0]},end_date.gte.${startOfMonth.toISOString().split('T')[0]}`)
          .order('start_date'),

        supabase
          .from('holidays')
          .select('*')
          .eq('company_id', selectedCompanyId)
          .eq('is_active', true),

        supabase
          .from('work_weeks')
          .select('*')
          .eq('company_id', selectedCompanyId)
          .maybeSingle()
      ]);

      if (leavesResult.error) throw leavesResult.error;
      if (holidaysResult.error) throw holidaysResult.error;
      if (workWeekResult.error) throw workWeekResult.error;

      setLeaves(leavesResult.data || []);
      setHolidays(holidaysResult.data || []);

      if (workWeekResult.data) {
        setWorkWeek({
          monday: workWeekResult.data.monday,
          tuesday: workWeekResult.data.tuesday,
          wednesday: workWeekResult.data.wednesday,
          thursday: workWeekResult.data.thursday,
          friday: workWeekResult.data.friday,
          saturday: workWeekResult.data.saturday,
          sunday: workWeekResult.data.sunday,
        });
      }
    } catch (error) {
      console.error('Error loading calendar data:', error);
      showToast('Error al cargar el calendario', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isWorkingDay = (date: Date): boolean => {
    const dayOfWeek = date.getDay();
    const dayMap = [
      workWeek.sunday,
      workWeek.monday,
      workWeek.tuesday,
      workWeek.wednesday,
      workWeek.thursday,
      workWeek.friday,
      workWeek.saturday
    ];
    return dayMap[dayOfWeek];
  };

  const getHolidayForDate = (date: Date): Holiday | undefined => {
    const dateString = date.toISOString().split('T')[0];
    return holidays.find(holiday => {
      if (holiday.recurring) {
        const holidayDate = new Date(holiday.date);
        return holidayDate.getMonth() === date.getMonth() &&
               holidayDate.getDate() === date.getDate();
      }
      return holiday.date === dateString;
    });
  };

  const getDaysInMonth = (): DayData[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: DayData[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < startingDayOfWeek; i++) {
      const date = new Date(year, month, -startingDayOfWeek + i + 1);
      const holiday = getHolidayForDate(date);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isWorkingDay: isWorkingDay(date) && !holiday,
        isHoliday: !!holiday,
        holidayName: holiday?.name,
        leaves: []
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];

      const dayLeaves = leaves.filter(leave => {
        const startDate = leave.start_date;
        const endDate = leave.end_date;
        return dateString >= startDate && dateString <= endDate;
      });

      const holiday = getHolidayForDate(date);

      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        isWorkingDay: isWorkingDay(date) && !holiday,
        isHoliday: !!holiday,
        holidayName: holiday?.name,
        leaves: dayLeaves
      });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      const holiday = getHolidayForDate(date);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isWorkingDay: isWorkingDay(date) && !holiday,
        isHoliday: !!holiday,
        holidayName: holiday?.name,
        leaves: []
      });
    }

    return days;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getMonthName = () => {
    return currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  };

  const getDayLeaves = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return leaves.filter(leave => {
      const startDate = leave.start_date;
      const endDate = leave.end_date;
      return dateString >= startDate && dateString <= endDate;
    });
  };

  const getSelectedDateLeaves = () => {
    if (!selectedDate) return [];
    return getDayLeaves(selectedDate);
  };

  const days = getDaysInMonth();
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const monthLeaves = leaves.filter(leave => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(leave.start_date);
    const endDate = new Date(leave.end_date);

    return (startDate <= endOfMonth && endDate >= startOfMonth);
  });

  const uniqueEmployeesOut = new Set(monthLeaves.map(l => l.employee_id)).size;
  const totalDaysOut = monthLeaves.reduce((sum, leave) => sum + leave.total_days, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Calendario del Equipo</h1>
        <p className="text-slate-600">Visualiza las ausencias y disponibilidad del equipo</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Ausencias este mes</h3>
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{monthLeaves.length}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Empleados fuera</h3>
            <Users className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{uniqueEmployeesOut}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Días totales</h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{totalDaysOut}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="p-4 border-b border-slate-200">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-white border-2 border-blue-500"></div>
              <span className="text-slate-600">Día actual</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-50 border border-slate-200"></div>
              <span className="text-slate-600">Con ausencias</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-50 border border-red-200"></div>
              <span className="text-slate-600">Feriado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-slate-100 border border-slate-200 opacity-50"></div>
              <span className="text-slate-600">No laborable</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 capitalize">{getMonthName()}</h2>
          <div className="flex gap-2">
            <button
              onClick={goToToday}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Hoy
            </button>
            <button
              onClick={previousMonth}
              className="p-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-sm font-semibold text-slate-600 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => {
              const isSelected = selectedDate?.toDateString() === day.date.toDateString();
              const hasLeaves = day.leaves.length > 0;
              const isDisabled = !day.isWorkingDay;

              return (
                <button
                  key={index}
                  onClick={() => day.isWorkingDay && setSelectedDate(day.date)}
                  disabled={isDisabled}
                  className={`
                    min-h-[100px] p-2 rounded-lg border transition-all
                    ${!day.isCurrentMonth ? 'bg-slate-50 text-slate-400' : 'bg-white text-slate-900'}
                    ${day.isToday ? 'border-blue-500 border-2' : 'border-slate-200'}
                    ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                    ${hasLeaves ? 'bg-amber-50' : ''}
                    ${day.isHoliday ? 'bg-red-50 border-red-200' : ''}
                    ${!day.isWorkingDay && !day.isHoliday ? 'bg-slate-100 opacity-50' : ''}
                    ${day.isWorkingDay ? 'hover:shadow-md hover:border-blue-300 cursor-pointer' : 'cursor-not-allowed'}
                  `}
                >
                  <div className="text-left">
                    <span className={`
                      text-sm font-semibold
                      ${day.isToday ? 'text-blue-600' : ''}
                      ${!day.isCurrentMonth ? 'text-slate-400' : 'text-slate-900'}
                      ${day.isHoliday ? 'text-red-600' : ''}
                    `}>
                      {day.date.getDate()}
                    </span>
                  </div>

                  {day.isHoliday && (
                    <div className="mt-1">
                      <div className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded truncate font-medium">
                        {day.holidayName}
                      </div>
                    </div>
                  )}

                  {day.leaves.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {day.leaves.slice(0, 2).map((leave) => (
                        <div
                          key={leave.id}
                          className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded truncate"
                          title={`${leave.employee?.first_name} ${leave.employee?.last_name} - ${leave.leave_type?.name}`}
                        >
                          {leave.employee?.first_name?.charAt(0)}.{leave.employee?.last_name?.split(' ')[0]}
                        </div>
                      ))}
                      {day.leaves.length > 2 && (
                        <div className="text-xs text-slate-500 font-medium">
                          +{day.leaves.length - 2} más
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {selectedDate && (
        <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">
              Ausencias el {selectedDate.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </h2>
          </div>

          <div className="p-6">
            {getSelectedDateLeaves().length > 0 ? (
              <div className="space-y-3">
                {getSelectedDateLeaves().map((leave) => (
                  <div
                    key={leave.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">
                        {leave.employee?.first_name} {leave.employee?.last_name}
                      </p>
                      <p className="text-sm text-slate-600">
                        {leave.leave_type?.name} - {leave.total_days} {leave.total_days === 1 ? 'día' : 'días'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(leave.start_date).toLocaleDateString('es-ES')} - {new Date(leave.end_date).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                      {leave.leave_type?.code}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No hay ausencias programadas para este día</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
