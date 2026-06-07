const express  = require('express');
const router   = express.Router();
const { getDB }    = require('../db/mongo');
const { runAgent } = require('../agent/gemini');
const { ObjectId } = require('mongodb');

/**
 * POST /chat
 * Body: {
 *   customer_id: number,
 *   message:     string,
 *   goal?:       string,
 *   goal_id?:    string,   // ObjectId de la meta activa
 *   history?:    Array<{ role, content }>
 * }
 */
router.post('/', async (req, res) => {
  const { customer_id, message, goal, goal_id, history = [] } = req.body;

  if (!customer_id || !message) {
    return res.status(400).json({ error: 'customer_id y message son requeridos.' });
  }

  try {
    const db = getDB();

    // Cargar perfil del cliente
    const customerContext = await db.collection('customer_profiles')
      .findOne({ customer_id: Number(customer_id) }, { projection: { _id: 0 } });

    // Si no viene goal_id, buscar la meta activa del cliente
    let activeGoalId   = goal_id;
    let activeGoalText = goal;

    if (!activeGoalId) {
      const activeGoal = await db.collection('goals')
        .findOne({ customer_id: Number(customer_id), status: 'active' });
      if (activeGoal) {
        activeGoalId   = activeGoal._id.toString();
        activeGoalText = activeGoal.goal_text;
      }
    }

    const reply = await runAgent({
      message,
      history,
      customerContext,
      goal: activeGoalText,
    });

    // Auto-registrar la respuesta del agente como acción pendiente
    if (activeGoalId) {
      await db.collection('action_log').insertOne({
        customer_id:     Number(customer_id),
        goal_id:         new ObjectId(activeGoalId),
        recommendation:  reply,
        action_type:     'agente',
        status:          'pending',
        recommended_at:  new Date(),
        completed_at:    null,
        feedback:        null,
      });
    }

    res.json({
      reply,
      customer_id,
      goal_id:   activeGoalId || null,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error('❌ Error en /chat:', err);
    res.status(500).json({ error: 'Error interno del agente.', detail: err.message });
  }
});

module.exports = router;
