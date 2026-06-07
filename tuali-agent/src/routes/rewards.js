const express = require('express');
const router  = express.Router();
const { getDB } = require('../db/mongo');

const NIVELES = [
  {
    nombre:    'Círculo Platino',
    min:       40,
    max:       Infinity,
    descuento: 5,
    emoji:     '💎',
    beneficio: '5% descuento directo en factura',
    descripcion: 'Clientes con alta antigüedad y volumen masivo.',
    siguiente: null,
  },
  {
    nombre:    'Socio Oro',
    min:       20,
    max:       39,
    descuento: 3,
    emoji:     '🥇',
    beneficio: '3% descuento en factura + prioridad de inventario en CEDIS',
    descripcion: 'Dominas el volumen de la zona e integras formatos familiares de alto valor.',
    siguiente: 'Círculo Platino',
  },
  {
    nombre:    'Socio Plata',
    min:       10,
    max:       19,
    descuento: 1.5,
    emoji:     '🥈',
    beneficio: '1.5% descuento directo en factura',
    descripcion: 'Expandes tu portafolio con marcas secundarias y nuevos formatos.',
    siguiente: 'Socio Oro',
  },
  {
    nombre:    'Socio Bronce',
    min:       5,
    max:       9,
    descuento: 0,
    emoji:     '🥉',
    beneficio: 'Acceso a stock de productos líderes de tu zona',
    descripcion: 'Te enfocas en asegurar el stock de los productos más vendidos de tu cuadra.',
    siguiente: 'Socio Plata',
  },
];

function calcularNivel(cajasMes) {
  const nivel = NIVELES.find(n => cajasMes >= n.min) ?? {
    nombre:     'Sin nivel',
    emoji:      '🌱',
    beneficio:  'Comienza a pedir para desbloquear tu nivel',
    descripcion:'Alcanza 5 cajas al mes para unirte como Socio Bronce.',
    descuento:  0,
    siguiente:  'Socio Bronce',
  };

  const minSiguiente = NIVELES.find(n => n.nombre === nivel.siguiente)?.min ?? null;
  const faltante     = minSiguiente ? Math.max(0, Math.ceil(minSiguiente - cajasMes)) : 0;

  return { ...nivel, faltante };
}

/**
 * GET /rewards/:customer_id
 */
router.get('/:customer_id', async (req, res) => {
  const { customer_id } = req.params;

  try {
    const db = getDB();

    const profile = await db.collection('customer_profiles')
      .findOne({ customer_id: Number(customer_id) }, { projection: { _id: 0 } });

    if (!profile) {
      return res.status(404).json({ error: `Cliente ${customer_id} no encontrado.` });
    }

    // Usar campo calculado en seed; fallback para perfiles sin re-seedear
    const cajasMes = profile.cajas_mes_promedio
      ?? Math.round((profile.pedidos_entregados ?? 0) * 5);

    // Meta personalizada: +12.5% sobre historial (punto medio de 10-15%)
    const metaMes = Math.ceil(cajasMes * 1.125);

    const nivel = calcularNivel(cajasMes);

    res.json({
      customer_id,
      cajas_mes_promedio: cajasMes,
      meta_mes:           metaMes,
      nivel:              nivel.nombre,
      nivel_emoji:        nivel.emoji,
      nivel_beneficio:    nivel.beneficio,
      nivel_descripcion:  nivel.descripcion,
      nivel_descuento:    nivel.descuento,
      nivel_siguiente:    nivel.siguiente,
      cajas_faltantes:    nivel.faltante,
    });

  } catch (err) {
    console.error('❌ Error en GET /rewards:', err);
    res.status(500).json({ error: 'Error obteniendo nivel.', detail: err.message });
  }
});

module.exports = router;
