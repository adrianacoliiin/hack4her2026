const Groq = require('groq-sdk');
const { TOOL_DEFINITIONS, TOOL_FUNCTIONS } = require('../tools');

const groq  = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';

function buildSystemPrompt(customerContext) {
  const base = `Eres el Agente de Crecimiento de Tuali. Tu misión es ayudar a los dueños 
de tiendas a hacer crecer su negocio de forma concreta y personalizada.

REGLAS:
- Sé directo y accionable. Nada de frases genéricas.
- Usa números reales de los datos: tickets, cantidades, SKUs específicos.
- Máximo 3 acciones recomendadas por respuesta.
- Español mexicano, tono amigable pero profesional.
- Si preguntan por un producto sin stock, busca el sustituto histórico.
- Conecta siempre la recomendación con la meta del tendero.`;

  if (!customerContext) return base;

  return `${base}

CONTEXTO DEL CLIENTE:
- Ticket promedio: $${customerContext.ticket_promedio} MXN
- Total pedidos: ${customerContext.total_pedidos}
- Categoría principal: ${customerContext.business_unit_principal}
- Zona (cedis): ${customerContext.cedis}
- Productos más comprados: ${(customerContext.top_skus || []).slice(0, 3).join(', ')}
- Meta actual: ${customerContext.goal || 'No definida aún'}`;
}

async function runAgent({ message, history = [], customerContext = null, goal = null }) {
  const messages = [
    { role: 'system', content: buildSystemPrompt(customerContext ? { ...customerContext, goal } : null) },
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
