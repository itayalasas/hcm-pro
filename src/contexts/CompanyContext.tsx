import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

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

interface CompanyContextType {
  currentCompany: Company | null;
  setCurrentCompany: (company: Company | null) => void;
  selectedCompanyId: string | null;
  selectCompany: (companyId: string) => void;
  loading: boolean;
  autoLoadEmployeeCompany: (companyId: string) => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      const storedCompanyId = localStorage.getItem('selected_company_id');
      if (storedCompanyId) {
        setSelectedCompanyId(storedCompanyId);
        loadCompany(storedCompanyId);
      } else {
        setLoading(false);
      }
      setInitialized(true);
    }
  }, [initialized]);

  const loadCompany = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (error) throw error;

      setCurrentCompany(data);
    } catch (error) {
      console.error('Error loading company:', error);
      localStorage.removeItem('selected_company_id');
      setSelectedCompanyId(null);
    } finally {
      setLoading(false);
    }
  };

  const selectCompany = async (companyId: string) => {
    setLoading(true);
    setSelectedCompanyId(companyId);
    localStorage.setItem('selected_company_id', companyId);
    await loadCompany(companyId);
  };

  const autoLoadEmployeeCompany = async (companyId: string) => {
    setLoading(true);
    setSelectedCompanyId(companyId);
    localStorage.setItem('selected_company_id', companyId);
    await loadCompany(companyId);
  };

  return (
    <CompanyContext.Provider
      value={{
        currentCompany,
        setCurrentCompany,
        selectedCompanyId,
        selectCompany,
        loading,
        autoLoadEmployeeCompany
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}
