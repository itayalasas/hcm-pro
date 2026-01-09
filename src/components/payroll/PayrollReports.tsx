import { useState, useEffect } from 'react';
import { FileText, Download, Filter, Calendar, Users, DollarSign, TrendingUp, BarChart3, FileSpreadsheet } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useToast } from '../../hooks/useToast';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface PayrollPeriod {
  id: string;
  period_name: string;
  period_type: string;
  start_date: string;
  end_date: string;
  payment_date: string;
  status: string;
  total_gross: number;
  total_deductions: number;
  total_net: number;
}

interface EmployeeDetail {
  employee_id: string;
  employee_name: string;
  employee_number: string;
  base_salary: number;
  total_perceptions: number;
  total_deductions: number;
  total_contributions: number;
  net_salary: number;
  worked_days: number;
}

interface ConceptSummary {
  concept_name: string;
  concept_code: string;
  category: string;
  total_amount: number;
  employee_count: number;
}

interface ReportData {
  period: PayrollPeriod | null;
  employeeDetails: EmployeeDetail[];
  conceptSummary: ConceptSummary[];
  summary: {
    totalEmployees: number;
    totalGross: number;
    totalDeductions: number;
    totalContributions: number;
    totalNet: number;
    avgSalary: number;
  };
}

export default function PayrollReports() {
  const { selectedCompanyId } = useCompany();
  const { showToast } = useToast();
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportType, setReportType] = useState<string>('summary');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [reportData, setReportData] = useState<ReportData>({
    period: null,
    employeeDetails: [],
    conceptSummary: [],
    summary: {
      totalEmployees: 0,
      totalGross: 0,
      totalDeductions: 0,
      totalContributions: 0,
      totalNet: 0,
      avgSalary: 0
    }
  });

  useEffect(() => {
    if (selectedCompanyId) {
      loadPeriods();
    }
  }, [selectedCompanyId]);

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

  const handleGenerateReport = async () => {
    if (!selectedPeriod) {
      showToast('Seleccione un período de nómina', 'error');
      return;
    }

    try {
      setGeneratingReport(true);

      const { data: periodData, error: periodError } = await supabase
        .from('payroll_periods')
        .select('*')
        .eq('id', selectedPeriod)
        .single();

      if (periodError) throw periodError;

      const { data: detailsData, error: detailsError } = await supabase
        .from('payroll_period_details')
        .select(`
          *,
          employee:employees(
            id,
            first_name,
            last_name,
            employee_number
          )
        `)
        .eq('payroll_period_id', selectedPeriod);

      if (detailsError) throw detailsError;

      const { data: conceptsData, error: conceptsError } = await supabase
        .from('payroll_concept_details')
        .select(`
          *,
          payroll_concept:payroll_concepts(name, code, category),
          payroll_period_detail:payroll_period_details!inner(payroll_period_id)
        `)
        .eq('payroll_period_detail.payroll_period_id', selectedPeriod);

      if (conceptsError) throw conceptsError;

      const employeeDetails: EmployeeDetail[] = (detailsData || []).map((detail: any) => ({
        employee_id: detail.employee.id,
        employee_name: `${detail.employee.first_name} ${detail.employee.last_name}`,
        employee_number: detail.employee.employee_number,
        base_salary: detail.base_salary,
        total_perceptions: detail.total_perceptions,
        total_deductions: detail.total_deductions,
        total_contributions: detail.total_contributions,
        net_salary: detail.net_salary,
        worked_days: detail.worked_days
      }));

      const conceptMap = new Map<string, ConceptSummary>();
      (conceptsData || []).forEach((concept: any) => {
        const key = concept.payroll_concept.code;
        if (!conceptMap.has(key)) {
          conceptMap.set(key, {
            concept_name: concept.payroll_concept.name,
            concept_code: concept.payroll_concept.code,
            category: concept.payroll_concept.category,
            total_amount: 0,
            employee_count: 0
          });
        }
        const summary = conceptMap.get(key)!;
        summary.total_amount += concept.total_amount;
        summary.employee_count += 1;
      });

      const conceptSummary = Array.from(conceptMap.values());

      const totalEmployees = employeeDetails.length;
      const totalGross = employeeDetails.reduce((sum, e) => sum + e.total_perceptions, 0);
      const totalDeductions = employeeDetails.reduce((sum, e) => sum + e.total_deductions, 0);
      const totalContributions = employeeDetails.reduce((sum, e) => sum + e.total_contributions, 0);
      const totalNet = employeeDetails.reduce((sum, e) => sum + e.net_salary, 0);
      const avgSalary = totalEmployees > 0 ? totalNet / totalEmployees : 0;

      setReportData({
        period: periodData,
        employeeDetails,
        conceptSummary,
        summary: {
          totalEmployees,
          totalGross,
          totalDeductions,
          totalContributions,
          totalNet,
          avgSalary
        }
      });

      showToast('Reporte generado exitosamente', 'success');
    } catch (error: any) {
      console.error('Error generating report:', error);
      showToast(error.message || 'Error al generar reporte', 'error');
    } finally {
      setGeneratingReport(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleExportPDF = () => {
    if (!reportData.period) {
      showToast('Genere primero un reporte', 'error');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Error al abrir ventana de impresión', 'error');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reporte de Nómina - ${reportData.period.period_name}</title>
        <style>
          @media print {
            @page { margin: 1cm; }
            body { margin: 0; }
          }
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            color: #1e293b;
          }
          h1 {
            color: #0f172a;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          h2 {
            color: #334155;
            margin-top: 30px;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 8px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 14px;
          }
          th {
            background-color: #f1f5f9;
            color: #0f172a;
            font-weight: 600;
            text-align: left;
            padding: 12px;
            border-bottom: 2px solid #cbd5e1;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
          }
          tr:hover {
            background-color: #f8fafc;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin: 20px 0;
          }
          .summary-card {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
          }
          .summary-card h3 {
            margin: 0 0 8px 0;
            font-size: 12px;
            color: #64748b;
            font-weight: 500;
          }
          .summary-card p {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            color: #0f172a;
          }
          .text-right {
            text-align: right;
          }
          .font-bold {
            font-weight: 700;
          }
          .text-green { color: #22c55e; }
          .text-red { color: #ef4444; }
          .text-blue { color: #3b82f6; }
          .header-info {
            margin-bottom: 30px;
            padding: 15px;
            background: #f1f5f9;
            border-radius: 8px;
          }
          .header-info p {
            margin: 5px 0;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <h1>Reporte de Nómina</h1>

        <div class="header-info">
          <p><strong>Período:</strong> ${reportData.period.period_name}</p>
          <p><strong>Tipo:</strong> ${reportData.period.period_type === 'monthly' ? 'Mensual' : reportData.period.period_type === 'vacation_settlement' ? 'Liquidación de Vacaciones' : 'Otro'}</p>
          <p><strong>Fecha Inicio:</strong> ${formatDate(reportData.period.start_date)} | <strong>Fecha Fin:</strong> ${formatDate(reportData.period.end_date)}</p>
          <p><strong>Fecha de Pago:</strong> ${formatDate(reportData.period.payment_date)}</p>
          <p><strong>Estado:</strong> ${reportData.period.status}</p>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <h3>Total Empleados</h3>
            <p>${reportData.summary.totalEmployees}</p>
          </div>
          <div class="summary-card">
            <h3>Total Bruto</h3>
            <p>${formatCurrency(reportData.summary.totalGross)}</p>
          </div>
          <div class="summary-card">
            <h3>Total Deducciones</h3>
            <p>${formatCurrency(reportData.summary.totalDeductions + reportData.summary.totalContributions)}</p>
          </div>
          <div class="summary-card">
            <h3>Total Neto</h3>
            <p>${formatCurrency(reportData.summary.totalNet)}</p>
          </div>
        </div>

        <h2>Detalle por Empleado</h2>
        <table>
          <thead>
            <tr>
              <th>Empleado</th>
              <th>N° Empleado</th>
              <th class="text-right">Salario Base</th>
              <th class="text-right">Percepciones</th>
              <th class="text-right">Deducciones</th>
              <th class="text-right">Neto</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.employeeDetails.map(emp => `
              <tr>
                <td>${emp.employee_name}</td>
                <td>${emp.employee_number}</td>
                <td class="text-right">${formatCurrency(emp.base_salary)}</td>
                <td class="text-right text-green">${formatCurrency(emp.total_perceptions)}</td>
                <td class="text-right text-red">${formatCurrency(emp.total_deductions + emp.total_contributions)}</td>
                <td class="text-right font-bold text-blue">${formatCurrency(emp.net_salary)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>Distribución por Concepto</h2>
        <table>
          <thead>
            <tr>
              <th>Concepto</th>
              <th>Código</th>
              <th>Categoría</th>
              <th class="text-right">Empleados</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.conceptSummary.map(concept => `
              <tr>
                <td>${concept.concept_name}</td>
                <td>${concept.concept_code}</td>
                <td>${concept.category === 'perception' ? 'Percepción' : concept.category === 'deduction' ? 'Deducción' : 'Contribución'}</td>
                <td class="text-right">${concept.employee_count}</td>
                <td class="text-right ${concept.category === 'perception' ? 'text-green' : 'text-red'}">${formatCurrency(concept.total_amount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    showToast('Preparando PDF para impresión...', 'success');
  };

  const handleExportExcel = () => {
    if (!reportData.period) {
      showToast('Genere primero un reporte', 'error');
      return;
    }

    const excelContent = `
      <html xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="UTF-8">
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Reporte de Nómina</x:Name>
                <x:WorksheetOptions>
                  <x:Print>
                    <x:ValidPrinterInfo/>
                  </x:Print>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <style>
          table { border-collapse: collapse; }
          th { background-color: #4472C4; color: white; font-weight: bold; border: 1px solid #000; padding: 8px; }
          td { border: 1px solid #000; padding: 6px; }
          .header { font-size: 18px; font-weight: bold; background-color: #E7E6E6; }
          .number { mso-number-format:"\\#\\,\\#\\#0\\.00"; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="6" class="header">Reporte de Nómina - ${reportData.period.period_name}</td></tr>
          <tr><td colspan="6"></td></tr>
          <tr>
            <td><b>Período:</b></td>
            <td>${reportData.period.period_name}</td>
            <td><b>Fecha Inicio:</b></td>
            <td>${formatDate(reportData.period.start_date)}</td>
            <td><b>Fecha Fin:</b></td>
            <td>${formatDate(reportData.period.end_date)}</td>
          </tr>
          <tr><td colspan="6"></td></tr>

          <tr>
            <th>Total Empleados</th>
            <th>Total Bruto</th>
            <th>Total Deducciones</th>
            <th>Total Contribuciones</th>
            <th>Total Neto</th>
            <th>Salario Promedio</th>
          </tr>
          <tr>
            <td class="number">${reportData.summary.totalEmployees}</td>
            <td class="number">${reportData.summary.totalGross}</td>
            <td class="number">${reportData.summary.totalDeductions}</td>
            <td class="number">${reportData.summary.totalContributions}</td>
            <td class="number">${reportData.summary.totalNet}</td>
            <td class="number">${reportData.summary.avgSalary}</td>
          </tr>
          <tr><td colspan="6"></td></tr>

          <tr><td colspan="6" class="header">Detalle por Empleado</td></tr>
          <tr>
            <th>Empleado</th>
            <th>N° Empleado</th>
            <th>Salario Base</th>
            <th>Percepciones</th>
            <th>Deducciones</th>
            <th>Neto</th>
          </tr>
          ${reportData.employeeDetails.map(emp => `
            <tr>
              <td>${emp.employee_name}</td>
              <td>${emp.employee_number}</td>
              <td class="number">${emp.base_salary}</td>
              <td class="number">${emp.total_perceptions}</td>
              <td class="number">${emp.total_deductions + emp.total_contributions}</td>
              <td class="number">${emp.net_salary}</td>
            </tr>
          `).join('')}
          <tr><td colspan="6"></td></tr>

          <tr><td colspan="6" class="header">Distribución por Concepto</td></tr>
          <tr>
            <th>Concepto</th>
            <th>Código</th>
            <th>Categoría</th>
            <th>Empleados</th>
            <th>Total</th>
            <th></th>
          </tr>
          ${reportData.conceptSummary.map(concept => `
            <tr>
              <td>${concept.concept_name}</td>
              <td>${concept.concept_code}</td>
              <td>${concept.category === 'perception' ? 'Percepción' : concept.category === 'deduction' ? 'Deducción' : 'Contribución'}</td>
              <td class="number">${concept.employee_count}</td>
              <td class="number">${concept.total_amount}</td>
              <td></td>
            </tr>
          `).join('')}
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reporte_Nomina_${reportData.period.period_name.replace(/\s+/g, '_')}.xls`;
    link.click();
    window.URL.revokeObjectURL(url);

    showToast('Reporte exportado a Excel', 'success');
  };

  const handleExportCSV = () => {
    if (!reportData.period) {
      showToast('Genere primero un reporte', 'error');
      return;
    }

    let csvContent = '';

    csvContent += 'REPORTE DE NÓMINA\n';
    csvContent += `Período,${reportData.period.period_name}\n`;
    csvContent += `Fecha Inicio,${formatDate(reportData.period.start_date)}\n`;
    csvContent += `Fecha Fin,${formatDate(reportData.period.end_date)}\n`;
    csvContent += `Fecha de Pago,${formatDate(reportData.period.payment_date)}\n\n`;

    csvContent += 'RESUMEN\n';
    csvContent += 'Total Empleados,Total Bruto,Total Deducciones,Total Contribuciones,Total Neto,Salario Promedio\n';
    csvContent += `${reportData.summary.totalEmployees},${reportData.summary.totalGross},${reportData.summary.totalDeductions},${reportData.summary.totalContributions},${reportData.summary.totalNet},${reportData.summary.avgSalary}\n\n`;

    csvContent += 'DETALLE POR EMPLEADO\n';
    csvContent += 'Empleado,N° Empleado,Salario Base,Percepciones,Deducciones,Contribuciones,Neto,Días Trabajados\n';
    reportData.employeeDetails.forEach(emp => {
      csvContent += `"${emp.employee_name}",${emp.employee_number},${emp.base_salary},${emp.total_perceptions},${emp.total_deductions},${emp.total_contributions},${emp.net_salary},${emp.worked_days}\n`;
    });

    csvContent += '\nDISTRIBUCIÓN POR CONCEPTO\n';
    csvContent += 'Concepto,Código,Categoría,Empleados,Total\n';
    reportData.conceptSummary.forEach(concept => {
      const category = concept.category === 'perception' ? 'Percepción' : concept.category === 'deduction' ? 'Deducción' : 'Contribución';
      csvContent += `"${concept.concept_name}",${concept.concept_code},"${category}",${concept.employee_count},${concept.total_amount}\n`;
    });

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reporte_Nomina_${reportData.period.period_name.replace(/\s+/g, '_')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    showToast('Reporte exportado a CSV', 'success');
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
                    {period.period_name} - {formatDate(period.start_date)} a {formatDate(period.end_date)}
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
              <Button onClick={handleGenerateReport} className="flex-1" disabled={generatingReport}>
                <FileText className="w-4 h-4 mr-2" />
                {generatingReport ? 'Generando...' : 'Generar Reporte'}
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
              disabled={!reportData.period}
              className="w-full text-left px-4 py-3 bg-white border border-slate-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
              disabled={!reportData.period}
              className="w-full text-left px-4 py-3 bg-white border border-slate-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Exportar a Excel</p>
                  <p className="text-sm text-slate-500">Datos editables</p>
                </div>
              </div>
            </button>

            <button
              onClick={handleExportCSV}
              disabled={!reportData.period}
              className="w-full text-left px-4 py-3 bg-white border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

      {reportData.period && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-600">Total Empleados</h3>
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-slate-900">{reportData.summary.totalEmployees}</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-600">Total Bruto</h3>
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(reportData.summary.totalGross)}</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-600">Total Deducciones</h3>
                <TrendingUp className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(reportData.summary.totalDeductions + reportData.summary.totalContributions)}</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-600">Total Neto</h3>
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(reportData.summary.totalNet)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Distribución por Concepto</h2>
              <div className="space-y-4">
                {reportData.conceptSummary.filter(c => c.category === 'perception').length > 0 && (
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
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(reportData.conceptSummary.filter(c => c.category === 'perception').reduce((sum, c) => sum + c.total_amount, 0))}
                    </p>
                  </div>
                )}

                {reportData.conceptSummary.filter(c => c.category === 'deduction' || c.category === 'contribution').length > 0 && (
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
                    <p className="text-lg font-bold text-red-600">
                      {formatCurrency(reportData.conceptSummary.filter(c => c.category === 'deduction' || c.category === 'contribution').reduce((sum, c) => sum + c.total_amount, 0))}
                    </p>
                  </div>
                )}

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
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(reportData.summary.totalNet)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Métricas Adicionales</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Salario Promedio</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(reportData.summary.avgSalary)}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>

                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Tasa de Deducción</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {reportData.summary.totalGross > 0
                        ? (((reportData.summary.totalDeductions + reportData.summary.totalContributions) / reportData.summary.totalGross) * 100).toFixed(1)
                        : 0}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-amber-600" />
                </div>

                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Costo Total Empresa</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {formatCurrency(reportData.summary.totalGross + reportData.summary.totalContributions)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {!reportData.period && periods.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-500 mb-2">No hay períodos de nómina</p>
          <p className="text-sm text-slate-400">Crea un período de nómina para generar reportes</p>
        </div>
      )}
    </div>
  );
}
