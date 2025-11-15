import { useState } from 'react';
import { Settings, Building2, MapPin, Briefcase, Users } from 'lucide-react';

export default function ConfigurationPanel() {
  const [activeTab, setActiveTab] = useState('departments');

  const tabs = [
    { id: 'departments', label: 'Departamentos', icon: Building2 },
    { id: 'positions', label: 'Puestos', icon: Briefcase },
    { id: 'locations', label: 'Ubicaciones', icon: MapPin },
    { id: 'general', label: 'General', icon: Settings }
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Configuración</h1>
        <p className="text-slate-600">Administra la configuración de tu empresa</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="border-b border-slate-200">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap
                  border-b-2 transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                  }
                `}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Panel de Configuración
            </h3>
            <p className="text-slate-600">
              Gestiona {tabs.find(t => t.id === activeTab)?.label.toLowerCase()} de tu empresa
            </p>
            <p className="text-sm text-slate-400 mt-4">
              Módulo en desarrollo - Próximamente disponible
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
