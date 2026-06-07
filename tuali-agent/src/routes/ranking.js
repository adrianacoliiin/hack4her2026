const express = require('express');
const router  = express.Router();
const { getDB } = require('../db/mongo');

/**
 * GET /ranking/:customer_id
 * Devuelve el ranking de tenderos en el mismo cedis (región).
 * Anonimiza los demás — solo muestra "Tienda #N".
 */
router.get('/:customer_id', async (req, res) => {
  const { customer_id } = req.params;

  try {
    const db = getDB();

    const profile = await db.collection('customer_profiles')
      .findOne({ customer_id: Number(customer_id) }, { projection: { cedis: 1, cajas_mes_promedio: 1, _id: 0 } });

    if (!profile) {
      return res.status(404).json({ error: `Cliente ${customer_id} no encontrado.` });
    }

    const { cedis } = profile;

    // Top 20 de la zona — soporta perfiles con o sin cajas_mes_promedio
    const docs = await db.collection('customer_profiles')
      .find(
        { cedis },
        { projection: { customer_id: 1, cajas_mes_promedio: 1, pedidos_entregados: 1, _id: 0 } }
      )
      .limit(200)          // traer más para poder ordenar en memoria
      .toArray();

    // Puntaje: cajas_mes_promedio si existe, sino pedidos_entregados * 5 como proxy
    const scored = docs
      .map(v => ({ ...v, _score: v.cajas_mes_promedio ?? (v.pedidos_entregados ?? 0) * 5 }))
      .filter(v => v._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, 20);

    const maxScore = scored[0]?._score ?? 1;

    const ranking = scored.map((v, i) => {
      const esTuTienda = v.customer_id === Number(customer_id);
      return {
        posicion:      i + 1,
        nombre:        esTuTienda ? 'Tu tienda' : `Tienda #${i + 1}`,
        cajas_mes:     Math.round(v._score),
        es_usuario:    esTuTienda,
        pct_del_lider: Math.round((v._score / maxScore) * 100),
      };
    });

    const miPosicion = ranking.find(r => r.es_usuario)?.posicion ?? null;

    res.json({
      customer_id,
      cedis,
      total_tiendas_zona: scored.length,
      mi_posicion:        miPosicion,
      ranking,
    });

  } catch (err) {
    console.error('❌ Error en GET /ranking:', err);
    res.status(500).json({ error: 'Error obteniendo ranking.', detail: err.message });
  }
});

module.exports = router;
