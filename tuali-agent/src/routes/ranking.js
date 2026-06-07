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

    // Top 20 de la zona ordenados por cajas/mes
    const vecinos = await db.collection('customer_profiles')
      .find(
        { cedis, cajas_mes_promedio: { $exists: true, $gt: 0 } },
        { projection: { customer_id: 1, cajas_mes_promedio: 1, _id: 0 } }
      )
      .sort({ cajas_mes_promedio: -1 })
      .limit(20)
      .toArray();

    const maxCajas = vecinos[0]?.cajas_mes_promedio ?? 1;

    const ranking = vecinos.map((v, i) => {
      const esTuTienda = v.customer_id === Number(customer_id);
      return {
        posicion:          i + 1,
        nombre:            esTuTienda ? 'Tu tienda' : `Tienda #${i + 1}`,
        cajas_mes:         Math.round(v.cajas_mes_promedio),
        es_usuario:        esTuTienda,
        pct_del_lider:     Math.round((v.cajas_mes_promedio / maxCajas) * 100),
      };
    });

    const miPosicion = ranking.find(r => r.es_usuario)?.posicion ?? null;

    res.json({
      customer_id,
      cedis,
      total_tiendas_zona: vecinos.length,
      mi_posicion:        miPosicion,
      ranking,
    });

  } catch (err) {
    console.error('❌ Error en GET /ranking:', err);
    res.status(500).json({ error: 'Error obteniendo ranking.', detail: err.message });
  }
});

module.exports = router;
