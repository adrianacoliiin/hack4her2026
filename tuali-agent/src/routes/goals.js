const express = require('express');
const router  = express.Router();
const { getDB } = require('../db/mongo');
const { ObjectId } = require('mongodb');

/**
 * POST /goals
 * Crea o actualiza la meta del tendero.
 * Body: { customer_id, goal_text, goal_type, target_value }
 */
router.post('/', async (req, res) => {
  const { customer_id, goal_text, goal_type = 'ventas', target_value } = req.body;

  if (!customer_id || !goal_text) {
    return res.status(400).json({ error: 'customer_id y goal_text son requeridos.' });
  }

  try {
    const db      = getDB();
    const profile = await db.collection('customer_profiles')
      .findOne({ customer_id: Number(customer_id) }, { projection: { _id: 0 } });

    const goal = {
      customer_id:      Number(customer_id),
      goal_text,
      goal_type,                              // ventas | ticket | nuevo_producto
      target_value:     target_value || null, // ej: 20 (%)
      status:           'active',
      baseline_ticket:  profile?.ticket_promedio || 0,
      baseline_pedidos: profile?.total_pedidos   || 0,
      cedis:            profile?.cedis            || null,
      created_at:       new Date(),
      updated_at:       new Date(),
    };

    // Desactiva metas anteriores activas
    await db.collection('goals').updateMany(
      { customer_id: Number(customer_id), status: 'active' },
      { $set: { status: 'replaced', updated_at: new Date() } }
    );

    const result = await db.collection('goals').insertOne(goal);

    res.status(201).json({
      message:    'Meta guardada correctamente.',
      goal_id:    result.insertedId,
      goal_text,
      baseline_ticket: goal.baseline_ticket,
    });

  } catch (err) {
    console.error('❌ Error en POST /goals:', err);
    res.status(500).json({ error: 'Error guardando la meta.', detail: err.message });
  }
});

/**
 * GET /goals/:customer_id
 * Devuelve la meta activa del tendero + resumen de progreso.
 */
router.get('/:customer_id', async (req, res) => {
  const { customer_id } = req.params;

  try {
    const db   = getDB();
    const goal = await db.collection('goals')
      .findOne({ customer_id: Number(customer_id), status: 'active' });

    if (!goal) {
      return res.status(404).json({ message: 'Este cliente no tiene una meta activa.' });
    }

    // Acciones de esta meta
    const acciones = await db.collection('action_log')
      .find({ goal_id: goal._id }).toArray();

    const total     = acciones.length;
    const completadas = acciones.filter(a => a.status === 'completed').length;
    const pendientes  = acciones.filter(a => a.status === 'pending').length;

    res.json({
      goal_id:       goal._id,
      goal_text:     goal.goal_text,
      goal_type:     goal.goal_type,
      target_value:  goal.target_value,
      status:        goal.status,
      created_at:    goal.created_at,
      baseline_ticket: goal.baseline_ticket,
      progreso: {
        total_acciones:      total,
        acciones_completadas: completadas,
        acciones_pendientes:  pendientes,
        tasa_completitud_pct: total > 0 ? Math.round((completadas / total) * 100) : 0,
      },
      ultimas_acciones: acciones
        .sort((a, b) => new Date(b.recommended_at) - new Date(a.recommended_at))
        .slice(0, 5)
        .map(a => ({
          action_id:       a._id,
          recommendation:  a.recommendation,
          action_type:     a.action_type,
          status:          a.status,
          recommended_at:  a.recommended_at,
          completed_at:    a.completed_at || null,
        })),
    });

  } catch (err) {
    console.error('❌ Error en GET /goals:', err);
    res.status(500).json({ error: 'Error obteniendo la meta.', detail: err.message });
  }
});

module.exports = router;
