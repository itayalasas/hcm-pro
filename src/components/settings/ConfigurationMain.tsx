import { useState } from 'react';
import { Database, GitBranch, ListTree, Settings as SettingsIcon, Users, Hash, Calendar } from 'lucide-react';
import MasterDataPanel from './MasterDataPanel';
import WorkflowsPanel from './WorkflowsPanel';
import CustomFieldsPanel from './CustomFieldsPanel';
import SystemParametersPanel from './SystemParametersPanel';
import UsersPanel from './UsersPanel';
import CodeConfigurationPanel from './CodeConfigurationPanel';
import { WorkCalendarPanel } from './WorkCalendarPanel';

type ConfigSection = 'master-data' | 'workflows' | 'custom-fields' | 'parameters' | 'users' | 'codes' | 'work-calendar';

export default function ConfigurationMain() {
  const [activeSection, setActiveSection] = useState<ConfigSection>('master-data');

  const sections = [
    { id: 'master-data' as ConfigSection, label: 'Datos Maestros', icon: Database },
    { id: 'users' as ConfigSection, label: 'Usuarios', icon: Users },
    { id: 'codes' as ConfigSection, label: 'Códigos Automáticos', icon: Hash },
    { id: 'work-calendar' as ConfigSection, label: 'Calendario Laboral', icon: Calendar },
    { id: 'workflows' as ConfigSection, label: 'Flujos de Trabajo', icon: GitBranch },
    { id: 'custom-fields' as ConfigSection, label: 'Campos Personalizados', icon: ListTree },
    { id: 'parameters' as ConfigSection, label: 'Parámetros del Sistema', icon: SettingsIcon },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'master-data':
        return <MasterDataPanel />;
      case 'users':
        return <UsersPanel />;
      case 'codes':
        return <CodeConfigurationPanel />;
      case 'work-calendar':
        return <WorkCalendarPanel />;
      case 'workflows':
        return <WorkflowsPanel />;
      case 'custom-fields':
        return <CustomFieldsPanel />;
      case 'parameters':
        return <SystemParametersPanel />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Configuración</h1>
        <p className="text-slate-600">Administra la configuración de tu sistema</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`p-6 rounded-xl border-2 transition-all text-left ${
              activeSection === section.id
                ? 'border-blue-600 bg-blue-50 shadow-md'
                : 'border-slate-200 hover:border-slate-300 hover:shadow'
            }`}
          >
            <section.icon className={`w-8 h-8 mb-3 ${
              activeSection === section.id ? 'text-blue-600' : 'text-slate-400'
            }`} />
            <h3 className={`font-semibold mb-1 ${
              activeSection === section.id ? 'text-blue-900' : 'text-slate-900'
            }`}>
              {section.label}
            </h3>
            <p className="text-sm text-slate-600">
              {section.id === 'master-data' && 'Ubicaciones, niveles, instituciones'}
              {section.id === 'users' && 'Gestión y asignación de empresas'}
              {section.id === 'codes' && 'Configuración de códigos automáticos'}
              {section.id === 'workflows' && 'Aprobaciones y procesos'}
              {section.id === 'custom-fields' && 'Campos adicionales por módulo'}
              {section.id === 'parameters' && 'Configuración general del sistema'}
            </p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        {renderContent()}
      </div>
    </div>
  );
}
