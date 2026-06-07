const express  = require('express');
const router   = express.Router();
const { getDB }    = require('../db/mongo');
const { runAgent } = require('../agent/gemini');

/**
 * GET /insights/:customer_id
 * Genera 3 insights proactivos al abrir la app.
 * No requiere que el tendero pregunte nada.
 */
router.get('/:customer_id', async (req, res) => {
  const { customer_id } = req.params;
  const { goal }        = req.query;

  try {
    const db = getDB();

    // Cargar perfil y datos de zona en paralelo
    const [customerContext, zoneData] = await Promise.all([
      db.collection('customer_profiles')
        .findOne({ customer_id: Number(customer_id) }, { projection: { _id: 0 } }),
      db.collection('zone_benchmarks')
        .findOne({ cedis: String(req.query.cedis || '') }, { projection: { _id: 0 } }),
    ]);

    if (!customerContext) {
      return res.status(404).json({ error: `Cliente ${customer_id} no encontrado.` });
    }

    // Prompt específico para insights proactivos
    const insightPrompt = `
Genera exactamente 3 insights de crecimiento para este tendero.
Formato de respuesta — devuelve SOLO este JSON sin texto extra:
{
  "insights": [
    { "titulo": "...", "accion": "...", "impacto": "...", "tipo": "pedido|promo|zona" },
    { "titulo": "...", "accion": "...", "impacto": "...", "tipo": "pedido|promo|zona" },
    { "titulo": "...", "accion": "...", "impacto": "...", "tipo": "pedido|promo|zona" }
  ]
}

Reglas:
- "titulo": máximo 6 palabras, impactante.
- "accion": qué debe hacer HOY, específico con SKUs y cantidades reales.
- "impacto": beneficio esperado en pesos o porcentaje.
- "tipo": "pedido" si es sobre qué pedir, "promo" si involucra promoción/loyalty, "zona" si compara con vecinos.
- Usa los datos reales del cliente y su zona para hacerlos relevantes.
${goal ? `- Meta actual del cliente: ${goal}` : ''}
    `.trim();

    const rawResponse = await runAgent({
      customerId:      customer_id,
      message:         insightPrompt,
      customerContext,
      goal,
    });

    // Parsear JSON de la respuesta
    let insights;
    try {
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      insights        = jsonMatch ? JSON.parse(jsonMatch[0]) : { insights: [] };
    } catch {
      insights = { insights: [], raw: rawResponse };
    }

    res.json({
      customer_id,
      ...insights,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error('❌ Error en /insights:', err);
    res.status(500).json({ error: 'Error generando insights.', detail: err.message });
  }
});

module.exports = router;
