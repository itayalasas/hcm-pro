import { useState } from 'react';
import { Calendar, Clock, FileText, Settings } from 'lucide-react';
import LeaveRequests from './LeaveRequests';
import LeaveBalances from './LeaveBalances';
import LeaveTypes from './LeaveTypes';
import TeamCalendar from './TeamCalendar';

type TabType = 'requests' | 'balances' | 'types' | 'calendar';

export default function TimeAndAttendance() {
  const [activeTab, setActiveTab] = useState<TabType>('requests');

  const tabs = [
    {
      id: 'requests' as TabType,
      name: 'Solicitudes de Ausencia',
      icon: FileText,
      component: LeaveRequests
    },
    {
      id: 'balances' as TabType,
      name: 'Saldos de Ausencia',
      icon: Clock,
      component: LeaveBalances
    },
    {
      id: 'types' as TabType,
      name: 'Tipos de Ausencia',
      icon: Settings,
      component: LeaveTypes
    },
    {
      id: 'calendar' as TabType,
      name: 'Calendario del Equipo',
      icon: Calendar,
      component: TeamCalendar
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || LeaveRequests;

  return (
    <div>
      <div className="mb-6 border-b border-slate-200">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap transition-all
                  ${activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <ActiveComponent />
      </div>
    </div>
  );
}
