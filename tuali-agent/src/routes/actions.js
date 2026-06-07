const express = require('express');
const router  = express.Router();
const { getDB }    = require('../db/mongo');
const { ObjectId } = require('mongodb');

/**
 * POST /actions
 * Registra una recomendación del agente como acción pendiente.
 * Llamado automáticamente desde /chat.
 * Body: { customer_id, goal_id, recommendation, action_type }
 */
router.post('/', async (req, res) => {
  const { customer_id, goal_id, recommendation, action_type = 'pedido' } = req.body;

  if (!customer_id || !recommendation) {
    return res.status(400).json({ error: 'customer_id y recommendation son requeridos.' });
  }

  try {
    const db  = getDB();
    const doc = {
      customer_id:      Number(customer_id),
      goal_id:          goal_id ? new ObjectId(goal_id) : null,
      recommendation,
      action_type,                   // pedido | promo | zona | otro
      status:           'pending',   // pending | completed | skipped
      recommended_at:   new Date(),
      completed_at:     null,
      feedback:         null,
    };

    const result = await db.collection('action_log').insertOne(doc);
    res.status(201).json({ action_id: result.insertedId, ...doc });

  } catch (err) {
    console.error('❌ Error en POST /actions:', err);
    res.status(500).json({ error: 'Error registrando acción.', detail: err.message });
  }
});

/**
 * PATCH /actions/:action_id
 * El tendero marca una acción como completada o saltada.
 * Body: { status: 'completed' | 'skipped', feedback? }
 */
router.patch('/:action_id', async (req, res) => {
  const { action_id }         = req.params;
  const { status, feedback }  = req.body;

  if (!['completed', 'skipped'].includes(status)) {
    return res.status(400).json({ error: 'status debe ser "completed" o "skipped".' });
  }

  try {
    const db     = getDB();
    const result = await db.collection('action_log').updateOne(
      { _id: new ObjectId(action_id) },
      {
        $set: {
          status,
          feedback:     feedback || null,
          completed_at: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Acción no encontrada.' });
    }

    res.json({ message: `Acción marcada como "${status}".`, action_id });

  } catch (err) {
    console.error('❌ Error en PATCH /actions:', err);
    res.status(500).json({ error: 'Error actualizando acción.', detail: err.message });
  }
});

/**
 * GET /actions/:customer_id
 * Devuelve todas las acciones del tendero (con filtro opcional por status).
 * Query: ?status=pending|completed|skipped
 */
router.get('/:customer_id', async (req, res) => {
  const { customer_id } = req.params;
  const { status }      = req.query;

  try {
    const db     = getDB();
    const filter = { customer_id: Number(customer_id) };
    if (status) filter.status = status;

    const docs = await db.collection('action_log')
      .find(filter)
      .sort({ recommended_at: -1 })
      .limit(20)
      .toArray();

    const acciones = docs.map(a => ({ ...a, action_id: a._id.toString() }));
    res.json({ customer_id, total: acciones.length, acciones });

  } catch (err) {
    console.error('❌ Error en GET /actions:', err);
    res.status(500).json({ error: 'Error obteniendo acciones.', detail: err.message });
  }
});

/**
 * GET /actions/progress/:customer_id
 * Resumen semanal de progreso hacia la meta.
 */
router.get('/progress/:customer_id', async (req, res) => {
  const { customer_id } = req.params;

  try {
    const db   = getDB();

    // Meta activa
    const goal = await db.collection('goals')
      .findOne({ customer_id: Number(customer_id), status: 'active' });

    // Acciones de los últimos 7 días
    const desde = new Date();
    desde.setDate(desde.getDate() - 7);

    const acciones = await db.collection('action_log')
      .find({
        customer_id:     Number(customer_id),
        recommended_at:  { $gte: desde },
      })
      .toArray();

    const total       = acciones.length;
    const completadas = acciones.filter(a => a.status === 'completed').length;
    const saltadas    = acciones.filter(a => a.status === 'skipped').length;
    const pendientes  = acciones.filter(a => a.status === 'pending').length;
    const tasa        = total > 0 ? Math.round((completadas / total) * 100) : 0;

    res.json({
      customer_id,
      meta_activa:    goal?.goal_text || 'Sin meta definida',
      semana_actual: {
        total_recomendaciones: total,
        completadas,
        saltadas,
        pendientes,
        tasa_completitud_pct: tasa,
        mensaje: tasa >= 66
          ? '🟢 ¡Vas muy bien! Sigue así.'
          : tasa >= 33
          ? '🟡 Vas a la mitad. Puedes hacer más.'
          : '🔴 Pocas acciones completadas. ¿Necesitas ayuda?',
      },
    });

  } catch (err) {
    console.error('❌ Error en GET /actions/progress:', err);
    res.status(500).json({ error: 'Error calculando progreso.', detail: err.message });
  }
});

module.exports = router;
