export interface EmployeeContractData {
  companyName?: string;
  companyAddress?: string;
  companyRepresentative?: string;
  representativeTitle?: string;
  employeeName: string;
  employeeId?: string;
  employeeAddress?: string;
  employeeCity?: string;
  employeeCountry?: string;
  position?: string;
  department?: string;
  employmentType?: string;
  hireDate?: string;
  salary?: string;
  bankName?: string;
  accountNumber?: string;
  accountType?: string;
  healthCardNumber?: string;
  healthCardExpiry?: string;
  emergencyContact?: string;
  emergencyRelationship?: string;
  emergencyPhone?: string;
  contractDate?: string;
  workSchedule?: string;
  startDay?: string;
  endDay?: string;
  weeklyHours?: string;
  paymentFrequency?: string;
  noticeDays?: string;
}

export function replaceContractVariables(
  template: string,
  data: EmployeeContractData
): string {
  const replacements: { [key: string]: string } = {
    '[NOMBRE_EMPRESA]': data.companyName || 'Empresa X',
    '[NOMBREEMPRESA]': data.companyName || 'Empresa X',

    '[DIRECCION_EMPRESA]': data.companyAddress || 'Calle Principal 123',
    '[DIRECCIONEMPRESA]': data.companyAddress || 'Calle Principal 123',

    '[REPRESENTANTE_EMPRESA]': data.companyRepresentative || 'Representante Legal',
    '[REPRESENTANTEEMPRESA]': data.companyRepresentative || 'Representante Legal',

    '[CARGO_REPRESENTANTE]': data.representativeTitle || 'Director General',
    '[CARGOREPRESENTANTE]': data.representativeTitle || 'Director General',

    '[NOMBRE_EMPLEADO]': data.employeeName,
    '[NOMBREEMPLEADO]': data.employeeName,

    '[RFC_EMPLEADO]': data.employeeId || 'N/A',
    '[RFCEMPLEADO]': data.employeeId || 'N/A',

    '[DIRECCION_EMPLEADO]': data.employeeAddress || 'N/A',
    '[DIRECCIONEMPLEADO]': data.employeeAddress || 'N/A',

    '[CIUDAD_EMPLEADO]': data.employeeCity || 'N/A',
    '[CIUDADEMPLEADO]': data.employeeCity || 'N/A',

    '[PAIS_EMPLEADO]': data.employeeCountry || 'N/A',
    '[PAISEMPLEADO]': data.employeeCountry || 'N/A',

    '[PUESTO_EMPLEADO]': data.position || 'N/A',
    '[PUESTOEMPLEADO]': data.position || 'N/A',

    '[DEPARTAMENTO_EMPLEADO]': data.department || 'N/A',
    '[DEPARTAMENTOEMPLEADO]': data.department || 'N/A',

    '[TIPO_EMPLEO]': data.employmentType || 'Tiempo Completo',
    '[TIPOEMPLEO]': data.employmentType || 'Tiempo Completo',

    '[FECHA_INICIO]': data.hireDate || 'N/A',
    '[FECHAINICIO]': data.hireDate || 'N/A',

    '[SALARIO]': data.salary || 'Por definir',

    '[BANCO]': data.bankName || 'N/A',

    '[NUMERO_CUENTA]': data.accountNumber || 'N/A',
    '[NUMEROCUENTA]': data.accountNumber || 'N/A',

    '[TIPO_CUENTA]': data.accountType || 'N/A',
    '[TIPOCUENTA]': data.accountType || 'N/A',

    '[CARNET_SALUD]': data.healthCardNumber || 'N/A',
    '[CARNETSALUD]': data.healthCardNumber || 'N/A',

    '[VIGENCIA_CARNET]': data.healthCardExpiry || 'N/A',
    '[VIGENCIACARNET]': data.healthCardExpiry || 'N/A',

    '[CONTACTO_EMERGENCIA]': data.emergencyContact || 'N/A',
    '[CONTACTOEMERGENCIA]': data.emergencyContact || 'N/A',

    '[RELACION_EMERGENCIA]': data.emergencyRelationship || 'N/A',
    '[RELACIONEMERGENCIA]': data.emergencyRelationship || 'N/A',

    '[TELEFONO_EMERGENCIA]': data.emergencyPhone || 'N/A',
    '[TELEFONOEMERGENCIA]': data.emergencyPhone || 'N/A',

    '[FECHA_CONTRATO]': data.contractDate || new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }),
    '[FECHACONTRATO]': data.contractDate || new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }),

    '[HORARIODETRABAJO]': data.workSchedule || '9:00 AM - 6:00 PM',
    '[HORARIO_TRABAJO]': data.workSchedule || '9:00 AM - 6:00 PM',

    '[DÍAINICIO]': data.startDay || 'Lunes',
    '[DIA_INICIO]': data.startDay || 'Lunes',

    '[DÍAFIN]': data.endDay || 'Viernes',
    '[DIA_FIN]': data.endDay || 'Viernes',

    '[HORASSEMANAL]': data.weeklyHours || '40',
    '[HORAS_SEMANAL]': data.weeklyHours || '40',

    '[FRECUENCIADEPAGO]': data.paymentFrequency || 'quincenal',
    '[FRECUENCIA_PAGO]': data.paymentFrequency || 'quincenal',

    '[DÍASDEAVISO]': data.noticeDays || '15',
    '[DIAS_AVISO]': data.noticeDays || '15',

    '[FIRMAREPRESENTANTEEMPRESA]': '________________________',
    '[FIRMA_REPRESENTANTE_EMPRESA]': '________________________',

    '[FIRMAEMPLEADO]': '________________________',
    '[FIRMA_EMPLEADO]': '________________________',
  };

  let result = template;

  Object.entries(replacements).forEach(([key, value]) => {
    const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    result = result.replace(regex, value);
  });

  return result;
}
