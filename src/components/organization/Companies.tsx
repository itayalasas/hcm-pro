import { useEffect, useState } from 'react';
import { Building2, Plus, Edit, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Company {
  id: string;
  code: string;
  legal_name: string;
  trade_name: string;
  tax_id: string;
  email: string;
  phone: string;
  active: boolean;
}

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('legal_name', { ascending: true });

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Empresas</h1>
          <p className="text-slate-600">{companies.length} empresas registradas</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-5 h-5" />
          Agregar Empresa
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company) => (
          <div key={company.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${company.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                {company.active ? 'Activa' : 'Inactiva'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">{company.legal_name}</h3>
            <p className="text-sm text-slate-500 mb-4">{company.trade_name}</p>
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Código:</span>
                <span className="font-medium text-slate-900">{company.code}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">RFC:</span>
                <span className="font-medium text-slate-900">{company.tax_id}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm">
                <Eye className="w-4 h-4" />
                Ver
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm">
                <Edit className="w-4 h-4" />
                Editar
              </button>
            </div>
          </div>
        ))}
      </div>

      {!loading && companies.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-500">No se encontraron empresas</p>
        </div>
      )}
    </div>
  );
}
