import { useState, useEffect } from 'react';
import { FileText, Download, Filter, Calendar, Users, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useToast } from '../../hooks/useToast';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface PayrollPeriod {
  id: string;
  period_name: string;
  start_date: string;
  end_date: string;
  payment_date: string;
  status: string;
  total_gross: number;
  total_deductions: number;
  total_net: number;
}

interface ReportSummary {
  totalEmployees: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  avgSalary: number;
}

export default function PayrollReports() {
  const { selectedCompanyId } = useCompany();
  const { showToast } = useToast();
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<string>('summary');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [summary, setSummary] = useState<ReportSummary>({
    totalEmployees: 0,
    totalGross: 0,
    totalDeductions: 0,
    totalNet: 0,
    avgSalary: 0
  });

  useEffect(() => {
    if (selectedCompanyId) {
      loadPeriods();
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    if (selectedPeriod) {
      loadReportData();
    }
  }, [selectedPeriod]);

  const loadPeriods = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payroll_periods')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setPeriods(data || []);
      if (data && data.length > 0) {
        setSelectedPeriod(data[0].id);
      }
    } catch (error) {
      showToast('Error al cargar períodos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadReportData = async () => {
    try {
      const { data: periodData, error: periodError } = await supabase
        .from('payroll_periods')
        .select('*')
        .eq('id', selectedPeriod)
        .single();

      if (periodError) throw periodError;

      const { data: detailsData, error: detailsError } = await supabase
        .from('payroll_period_details')
        .select('*')
        .eq('payroll_period_id', selectedPeriod);

      if (detailsError) throw detailsError;

      const totalEmployees = detailsData?.length || 0;
      const avgSalary = totalEmployees > 0
        ? (detailsData?.reduce((sum, d) => sum + d.net_salary, 0) || 0) / totalEmployees
        : 0;

      setSummary({
        totalEmployees,
        totalGross: periodData?.total_gross || 0,
        totalDeductions: periodData?.total_deductions || 0,
        totalNet: periodData?.total_net || 0,
        avgSalary
      });
    } catch (error) {
      console.error('Error loading report data:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleGenerateReport = () => {
    showToast('Generando reporte...', 'success');
  };

  const handleExportExcel = () => {
    showToast('Exportando a Excel...', 'success');
  };

  const handleExportPDF = () => {
    showToast('Exportando a PDF...', 'success');
  };

  const reportTypes = [
    { value: 'summary', label: 'Resumen de Nómina', icon: BarChart3 },
    { value: 'detailed', label: 'Detalle por Empleado', icon: Users },
    { value: 'concepts', label: 'Análisis de Conceptos', icon: DollarSign },
    { value: 'comparative', label: 'Comparativo de Períodos', icon: TrendingUp },
    { value: 'tax', label: 'Reporte de Impuestos', icon: FileText },
    { value: 'social_security', label: 'Seguridad Social', icon: FileText },
  ];

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
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Reportes de Nómina</h1>
        <p className="text-slate-600">Genera y exporta reportes detallados de nómina</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-600" />
            Filtros de Reporte
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tipo de Reporte
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {reportTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Período de Nómina
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {periods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.period_name} - {new Date(period.start_date).toLocaleDateString()} a {new Date(period.end_date).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Fecha Inicio"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              />
              <Input
                label="Fecha Fin"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleGenerateReport} className="flex-1">
                <FileText className="w-4 h-4 mr-2" />
                Generar Reporte
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" />
            Exportar
          </h2>

          <div className="space-y-3">
            <button
              onClick={handleExportPDF}
              className="w-full text-left px-4 py-3 bg-white border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Exportar a PDF</p>
                  <p className="text-sm text-slate-500">Documento imprimible</p>
                </div>
              </div>
            </button>

            <button
              onClick={handleExportExcel}
              className="w-full text-left px-4 py-3 bg-white border border-slate-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Exportar a Excel</p>
                  <p className="text-sm text-slate-500">Datos editables</p>
                </div>
              </div>
            </button>

            <button
              className="w-full text-left px-4 py-3 bg-white border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Exportar a CSV</p>
                  <p className="text-sm text-slate-500">Datos separados por comas</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {selectedPeriod && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-600">Total Empleados</h3>
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-slate-900">{summary.totalEmployees}</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-600">Total Bruto</h3>
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(summary.totalGross)}</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-600">Total Deducciones</h3>
                <TrendingUp className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(summary.totalDeductions)}</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-600">Total Neto</h3>
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(summary.totalNet)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Distribución por Concepto</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Percepciones</p>
                      <p className="text-sm text-slate-500">Salarios, bonos, comisiones</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(summary.totalGross)}</p>
                </div>

                <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Deducciones</p>
                      <p className="text-sm text-slate-500">Impuestos, aportes, préstamos</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(summary.totalDeductions)}</p>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Neto a Pagar</p>
                      <p className="text-sm text-slate-500">Total después de deducciones</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(summary.totalNet)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Métricas Adicionales</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Salario Promedio</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(summary.avgSalary)}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>

                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Tasa de Deducción</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {summary.totalGross > 0 ? ((summary.totalDeductions / summary.totalGross) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-amber-600" />
                </div>

                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Costo Total Empresa</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {formatCurrency(summary.totalGross + (summary.totalGross * 0.2))}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {!selectedPeriod && periods.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-500 mb-2">No hay períodos de nómina</p>
          <p className="text-sm text-slate-400">Crea un período de nómina para generar reportes</p>
        </div>
      )}
    </div>
  );
}
