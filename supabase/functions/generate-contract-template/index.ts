import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    const body = await req.json();
    const { positionTitle, positionDescription, companyName, country } = body;

    if (!positionTitle) {
      return new Response(JSON.stringify({
        error: 'Position title is required',
        message: 'El título del puesto es requerido'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const countryText = country || 'México';
    const companyText = companyName || '[NOMBRE_EMPRESA]';
    const positionDescText = positionDescription ? `\n\nDescripción del puesto:\n${positionDescription}` : '';

    const prompt = `Eres un experto en derecho laboral y recursos humanos. Genera un contrato de trabajo profesional y completo para el siguiente puesto.

Puesto: ${positionTitle}${positionDescText}
Empresa: ${companyText}
País: ${countryText}

Genera un contrato de trabajo individual que:
1. Cumpla con las leyes laborales de ${countryText}
2. Sea profesional y específico para el puesto de ${positionTitle}
3. Incluya todas las cláusulas necesarias (objeto, jornada, duración, remuneración, obligaciones, beneficios, confidencialidad, terminación, legislación aplicable)
4. Use las siguientes variables que serán reemplazadas automáticamente:
   - [NOMBRE_EMPRESA] - Nombre de la empresa
   - [DIRECCION_EMPRESA] - Dirección de la empresa
   - [REPRESENTANTE_EMPRESA] - Nombre del representante legal
   - [CARGO_REPRESENTANTE] - Cargo del representante
   - [NOMBRE_EMPLEADO] - Nombre completo del empleado
   - [RFC_EMPLEADO] - RFC/DNI del empleado
   - [DIRECCION_EMPLEADO] - Dirección del empleado
   - [CIUDAD_EMPLEADO] - Ciudad del empleado
   - [PAIS_EMPLEADO] - País del empleado
   - [PUESTO_EMPLEADO] - Título del puesto
   - [DEPARTAMENTO_EMPLEADO] - Departamento
   - [TIPO_EMPLEO] - Tipo de empleo (tiempo completo, medio tiempo, etc)
   - [FECHA_INICIO] - Fecha de inicio
   - [SALARIO] - Salario
   - [BANCO] - Nombre del banco
   - [NUMERO_CUENTA] - Número de cuenta
   - [TIPO_CUENTA] - Tipo de cuenta
   - [CARNET_SALUD] - Número de carnet de salud
   - [VIGENCIA_CARNET] - Vigencia del carnet
   - [CONTACTO_EMERGENCIA] - Contacto de emergencia
   - [RELACION_EMERGENCIA] - Relación del contacto
   - [TELEFONO_EMERGENCIA] - Teléfono de emergencia
   - [FECHA_CONTRATO] - Fecha del contrato

5. Incluya responsabilidades específicas del puesto de ${positionTitle}
6. Sea claro, formal y profesional
7. Tenga una estructura bien organizada con cláusulas numeradas

IMPORTANTE:
- Usa SOLO las variables entre corchetes mostradas arriba
- NO inventes nuevas variables
- El contrato debe ser específico para el puesto de ${positionTitle}
- Incluye cláusulas relevantes para este tipo de posición
- Genera SOLO el texto del contrato, sin comentarios adicionales`;

    const openaiResponse = await fetch('https://api.flowbridge.site/functions/v1/api-gateway/2eed9c6c-5dc0-4deb-ae77-71f7275c65c1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Integration-Key': 'int_be77e8a98277b2788c5065bda7dc8fa62d44186a2b07d1b64e2e51fd270e085e'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto abogado laboralista y especialista en recursos humanos. Generas contratos de trabajo profesionales, completos y adaptados a cada puesto específico. Siempre respondes en español con formato claro y profesional.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2500
      })
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error('OpenAI API error:', errorData);
      return new Response(JSON.stringify({
        error: 'AI API error',
        details: errorData,
        message: 'Error al generar el contrato con IA'
      }), {
        status: openaiResponse.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const openaiData = await openaiResponse.json();
    const contractTemplate = openaiData.choices[0].message.content.trim();

    return new Response(JSON.stringify({
      template: contractTemplate,
      positionTitle,
      model: 'gpt-4o-mini'
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in generate-contract-template:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});