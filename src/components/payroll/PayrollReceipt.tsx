import { useEffect, useState } from 'react';
import { X, Download, Printer } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Button from '../ui/Button';

interface PayrollReceiptProps {
  periodDetailId: string;
  onClose: () => void;
}

interface ReceiptData {
  employee: {
    first_name: string;
    last_name: string;
    national_id: string;
    employee_number: string;
  };
  company: {
    name: string;
    tax_id: string;
    address: string;
  };
  period: {
    period_name: string;
    start_date: string;
    end_date: string;
    payment_date: string;
  };
  detail: {
    base_salary: number;
    total_perceptions: number;
    total_deductions: number;
    total_contributions: number;
    net_salary: number;
    worked_days: number;
  };
  concepts: Array<{
    name: string;
    code: string;
    category: string;
    total_amount: number;
    calculation_details: string;
  }>;
}

export default function PayrollReceipt({ periodDetailId, onClose }: PayrollReceiptProps) {
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReceiptData();
  }, [periodDetailId]);

  const loadReceiptData = async () => {
    try {
      setLoading(true);

      // Get period detail with relations
      const { data: detail, error: detailError } = await supabase
        .from('payroll_period_details')
        .select(`
          *,
          employee:employees(first_name, last_name, national_id, employee_number),
          payroll_period:payroll_periods(
            period_name,
            start_date,
            end_date,
            payment_date,
            company:companies(name, tax_id, address_street, address_city, address_country)
          )
        `)
        .eq('id', periodDetailId)
        .single();

      if (detailError) throw detailError;

      // Get concept details
      const { data: concepts, error: conceptsError } = await supabase
        .from('payroll_concept_details')
        .select(`
          *,
          payroll_concept:payroll_concepts(name, code, category, calculation_type, percentage_value)
        `)
        .eq('payroll_period_detail_id', periodDetailId);

      if (conceptsError) throw conceptsError;

      const formattedData: ReceiptData = {
        employee: {
          first_name: detail.employee.first_name,
          last_name: detail.employee.last_name,
          national_id: detail.employee.national_id,
          employee_number: detail.employee.employee_number
        },
        company: {
          name: detail.payroll_period.company.name,
          tax_id: detail.payroll_period.company.tax_id || '',
          address: `${detail.payroll_period.company.address_street || ''}, ${detail.payroll_period.company.address_city || ''}, ${detail.payroll_period.company.address_country || ''}`
        },
        period: {
          period_name: detail.payroll_period.period_name,
          start_date: detail.payroll_period.start_date,
          end_date: detail.payroll_period.end_date,
          payment_date: detail.payroll_period.payment_date
        },
        detail: {
          base_salary: detail.base_salary,
          total_perceptions: detail.total_perceptions,
          total_deductions: detail.total_deductions,
          total_contributions: detail.total_contributions,
          net_salary: detail.net_salary,
          worked_days: detail.worked_days
        },
        concepts: concepts.map(c => ({
          name: c.payroll_concept.name,
          code: c.payroll_concept.code,
          category: c.payroll_concept.category,
          total_amount: c.total_amount,
          calculation_details: c.payroll_concept.calculation_type === 'percentage'
            ? `${(c.payroll_concept.percentage_value * 100).toFixed(2)}% de ${formatCurrency(c.unit_amount / (c.payroll_concept.percentage_value || 1))}`
            : formatCurrency(c.unit_amount)
        }))
      };

      setReceiptData(formattedData);
    } catch (error) {
      console.error('Error loading receipt:', error);
    } finally {
      setLoading(false);
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

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando recibo...</p>
        </div>
      </div>
    );
  }

  if (!receiptData) {
    return null;
  }

  const perceptions = receiptData.concepts.filter(c => c.category === 'perception');
  const deductions = receiptData.concepts.filter(c => c.category === 'deduction');
  const contributions = receiptData.concepts.filter(c => c.category === 'contribution');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full my-8">
        {/* Header with actions */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 print:hidden">
          <h2 className="text-xl font-bold text-slate-900">Recibo de Sueldo</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
            <Button variant="outline" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Receipt content */}
        <div className="p-8 space-y-6" id="receipt-content">
          {/* Company header */}
          <div className="text-center border-b-2 border-slate-900 pb-4">
            <h1 className="text-2xl font-bold text-slate-900">{receiptData.company.name}</h1>
            <p className="text-sm text-slate-600">{receiptData.company.address}</p>
            <p className="text-sm text-slate-600">RUT: {receiptData.company.tax_id}</p>
          </div>

          {/* Period info */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Liquidación de Haberes</h2>
              <p className="text-sm text-slate-600">Período: {receiptData.period.period_name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">N° Empleado: <span className="font-semibold">{receiptData.employee.employee_number}</span></p>
              <p className="text-sm text-slate-600">Fecha de Pago: {formatDate(receiptData.period.payment_date)}</p>
            </div>
          </div>

          {/* Employee info */}
          <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500">Nombres:</p>
              <p className="font-semibold text-slate-900">{receiptData.employee.first_name} {receiptData.employee.last_name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">C.I.:</p>
              <p className="font-semibold text-slate-900">{receiptData.employee.national_id}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Fecha de Ing:</p>
              <p className="font-semibold text-slate-900">{formatDate(receiptData.period.start_date)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Fecha de Eg:</p>
              <p className="font-semibold text-slate-900">{formatDate(receiptData.period.end_date)}</p>
            </div>
          </div>

          {/* Concepts table */}
          <div className="border border-slate-300 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-left p-3 text-sm font-semibold text-slate-700 border-r border-slate-300">CONCEPTOS</th>
                  <th className="text-left p-3 text-sm font-semibold text-slate-700 border-r border-slate-300">DETALLES</th>
                  <th className="text-right p-3 text-sm font-semibold text-slate-700 border-r border-slate-300 w-32">HABERES</th>
                  <th className="text-right p-3 text-sm font-semibold text-slate-700 w-32">DESCUENTOS</th>
                </tr>
              </thead>
              <tbody>
                {/* Base salary */}
                <tr className="border-t border-slate-200">
                  <td className="p-3 text-sm text-slate-900 border-r border-slate-300">Sueldo Básico</td>
                  <td className="p-3 text-sm text-slate-600 border-r border-slate-300">1 x {formatCurrency(receiptData.detail.base_salary)}</td>
                  <td className="p-3 text-sm text-slate-900 text-right font-semibold border-r border-slate-300">{formatCurrency(receiptData.detail.base_salary)}</td>
                  <td className="p-3 text-sm text-slate-900 text-right"></td>
                </tr>

                {/* Perceptions (other than base) */}
                {perceptions.map((concept, idx) => (
                  <tr key={idx} className="border-t border-slate-200">
                    <td className="p-3 text-sm text-slate-900 border-r border-slate-300">{concept.name}</td>
                    <td className="p-3 text-sm text-slate-600 border-r border-slate-300">{concept.calculation_details}</td>
                    <td className="p-3 text-sm text-slate-900 text-right font-semibold border-r border-slate-300">{formatCurrency(concept.total_amount)}</td>
                    <td className="p-3 text-sm text-slate-900 text-right"></td>
                  </tr>
                ))}

                {/* Deductions */}
                {deductions.map((concept, idx) => (
                  <tr key={idx} className="border-t border-slate-200">
                    <td className="p-3 text-sm text-slate-900 border-r border-slate-300">{concept.name}</td>
                    <td className="p-3 text-sm text-slate-600 border-r border-slate-300">{concept.calculation_details}</td>
                    <td className="p-3 text-sm text-slate-900 text-right border-r border-slate-300"></td>
                    <td className="p-3 text-sm text-slate-900 text-right font-semibold">{formatCurrency(concept.total_amount)}</td>
                  </tr>
                ))}

                {/* Totals */}
                <tr className="border-t-2 border-slate-400 bg-slate-50 font-semibold">
                  <td className="p-3 text-sm text-slate-900 border-r border-slate-300" colSpan={2}>Total Gravado</td>
                  <td className="p-3 text-sm text-slate-900 text-right border-r border-slate-300">{formatCurrency(receiptData.detail.total_perceptions)}</td>
                  <td className="p-3 text-sm text-slate-900 text-right">{formatCurrency(receiptData.detail.total_deductions)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Contributions summary */}
          {contributions.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-2 text-sm">Aportes Patronales (BPS)</h3>
              <div className="space-y-1">
                {contributions.map((concept, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-slate-700">{concept.name}:</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(concept.total_amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-semibold border-t border-blue-300 pt-2 mt-2">
                  <span className="text-slate-900">Total Aportes Patronales:</span>
                  <span className="text-slate-900">{formatCurrency(receiptData.detail.total_contributions)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Net amount */}
          <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Neto</p>
                <p className="text-xs text-slate-500">Líquido a Cobrar:</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-green-700">{formatCurrency(receiptData.detail.net_salary)}</p>
              </div>
            </div>
          </div>

          {/* Additional info */}
          <div className="text-xs text-slate-500 space-y-1 border-t border-slate-200 pt-4">
            <p>Días trabajados: {receiptData.detail.worked_days}</p>
            <p className="text-xs text-slate-400 mt-4">
              Recibí el importe de {formatCurrency(receiptData.detail.net_salary)} correspondiente a los haberes del mes anterior según decreto
              DGI correspondientes a los haberes del mes anterior según decreto y copie fiel de esta liquidación teniendo en cuenta que reclamar por ningún concepto
            </p>
          </div>

          {/* Signature */}
          <div className="flex justify-between items-end pt-8 border-t border-slate-300">
            <div className="text-center">
              <div className="border-t border-slate-400 w-64 mb-2"></div>
              <p className="text-sm text-slate-600">FIRMA</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">Copia N° 2</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
