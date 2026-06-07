const Groq = require('groq-sdk');
const { TOOL_DEFINITIONS, TOOL_FUNCTIONS } = require('../tools');

const groq  = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';

const PERSONA_PROMPTS = {
  eficiencia: `
PERFIL DE USUARIO — EFICIENCIA (Fernanda):
- Emprendedora con poco tiempo. Ve directo al grano.
- Respuestas cortas y accionables: máximo 3 líneas por recomendación.
- Siempre indica el impacto en pesos o porcentaje.
- Puedes usar emojis de forma puntual para facilitar lectura rápida.
- Ejemplo de tono: "Esta semana agrega 4 cajas de Sprite 2L. Tus vecinos la rotan el doble que tú → +$320 estimados."`,

  asistido: `
PERFIL DE USUARIO — ASISTIDO (Raúl):
- Usuario con baja adopción digital. Habla como si fuera su vecino de confianza.
- SOLO una recomendación por respuesta. Sin listas, sin tecnicismos.
- Usa lenguaje muy cotidiano y frases cortas.
- Explica el "por qué" en términos simples: "tus vecinos venden el doble de X que tú".
- Ejemplo de tono: "Oye Raúl, pide 3 Sprites de 2 litros esta semana. Los de tu cuadra los venden bien y tú no los tienes."`,

  familiar: `
PERFIL DE USUARIO — FAMILIAR (Rosario):
- Usuaria que repite flujos y necesita claridad. Habla como una amiga de confianza.
- Explica el ahorro real en pesos, no en porcentajes abstractos.
- Paso a paso cuando sea necesario, pero sin saturar.
- Prioriza claridad sobre brevedad. Puedes dar 2-3 recomendaciones.
- Ejemplo de tono: "Rosario, esta promo de Agua Ciel te ahorra $47 en tu pedido de la semana. ¿Te la agrego?"`,
};

function buildSystemPrompt(customerContext, personaType = null) {
  const base = `Eres el Agente de Crecimiento de Tuali. Tu misión es ayudar a los dueños
de tiendas a hacer crecer su negocio de forma concreta y personalizada.

REGLAS GENERALES:
- Sé directo y accionable. Nada de frases genéricas.
- Usa números reales de los datos: tickets, cantidades, SKUs específicos.
- Español mexicano.
- Si preguntan por un producto sin stock, busca el sustituto histórico.
- Conecta siempre la recomendación con la meta del tendero.`;

  const personaSection = PERSONA_PROMPTS[personaType] ?? `
PERFIL DE USUARIO — ESTÁNDAR:
- Tono amigable pero profesional. Máximo 3 acciones recomendadas por respuesta.`;

  if (!customerContext) return base + personaSection;

  return `${base}${personaSection}

CONTEXTO DEL CLIENTE:
- Ticket promedio: $${customerContext.ticket_promedio} MXN
- Total pedidos: ${customerContext.total_pedidos}
- Categoría principal: ${customerContext.business_unit_principal}
- Zona (cedis): ${customerContext.cedis}
- Productos más comprados: ${(customerContext.top_skus || []).slice(0, 3).join(', ')}
- Meta actual: ${customerContext.goal || 'No definida aún'}`;
}

async function runAgent({ message, history = [], customerContext = null, goal = null, personaType = null }) {
  const messages = [
    { role: 'system', content: buildSystemPrompt(customerContext ? { ...customerContext, goal } : null, personaType) },
    ...history.map(h => ({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content })),
    { role: 'user', content: message },
  ];

  let MAX_LOOPS = 5;

  while (MAX_LOOPS-- > 0) {
    const response     = await groq.chat.completions.create({
      model:       MODEL,
      messages,
      tools:       TOOL_DEFINITIONS,
      tool_choice: 'auto',
      temperature: 0.3,
    });

    const assistantMsg = response.choices[0].message;
    messages.push(assistantMsg);

    if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
      return assistantMsg.content || 'No pude generar una respuesta.';
    }

    for (const toolCall of assistantMsg.tool_calls) {
      const fnName = toolCall.function.name;
      const args   = JSON.parse(toolCall.function.arguments || '{}');

      console.log(`🔧 Tool: ${fnName}`, args);

      let result;
      try {
        const fn = TOOL_FUNCTIONS[fnName];
        result   = fn ? await fn(args) : { error: `Tool "${fnName}" no encontrada.` };
      } catch (err) {
        result = { error: err.message };
      }

      console.log(`   ↩`, JSON.stringify(result).slice(0, 120));

      messages.push({
        role:         'tool',
        tool_call_id: toolCall.id,
        content:      JSON.stringify(result),
      });
    }
  }

  return 'No pude generar una respuesta. Intenta de nuevo.';
}

module.exports = { runAgent };
