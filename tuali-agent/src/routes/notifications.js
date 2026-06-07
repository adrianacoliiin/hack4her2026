const express = require('express');
const router  = express.Router();
const { getDB } = require('../db/mongo');

/**
 * GET /notifications/:customer_id
 * Devuelve notificaciones relevantes para el tendero basadas en su perfil,
 * meta activa y acciones pendientes.
 */
router.get('/:customer_id', async (req, res) => {
  const { customer_id } = req.params;

  try {
    const db = getDB();

    const [profile, goal, acciones] = await Promise.all([
      db.collection('customer_profiles')
        .findOne({ customer_id: Number(customer_id) }, { projection: { _id: 0 } }),
      db.collection('goals')
        .findOne({ customer_id: Number(customer_id), status: 'active' }),
      db.collection('action_log')
        .find({ customer_id: Number(customer_id) })
        .sort({ recommended_at: -1 })
        .limit(10)
        .toArray(),
    ]);

    const notificaciones = [];

    // ── Notificación de meta activa ───────────────────────────────────────────
    if (goal) {
      const completadas = acciones.filter(a => a.status === 'completed').length;
      const total       = acciones.length;
      const pct         = total > 0 ? Math.round((completadas / total) * 100) : 0;

      notificaciones.push({
        id:        `meta-${goal._id}`,
        type:      'meta',
        titulo:    pct >= 100 ? '🏆 ¡Meta completada!' : `🎯 Progreso de tu meta: ${pct}%`,
        cuerpo:    pct >= 100
          ? '¡Felicidades! Completaste tu meta de esta semana.'
          : `Llevas ${completadas} de ${total} acciones completadas. ¡Sigue así!`,
        accion:    'Ver progreso',
        urgente:   pct >= 100,
        timestamp: goal.updated_at?.toISOString() ?? new Date().toISOString(),
      });
    }

    // ── Notificaciones de acciones pendientes ────────────────────────────────
    const pendientes = acciones.filter(a => a.status === 'pending').slice(0, 2);
    pendientes.forEach((accion, i) => {
      notificaciones.push({
        id:        `accion-${accion._id}`,
        type:      'agente',
        titulo:    '💡 Tu agente tiene una recomendación',
        cuerpo:    accion.recommendation?.slice(0, 120) ?? 'Tienes una acción pendiente.',
        accion:    'Ver recomendación',
        urgente:   i === 0,
        timestamp: accion.recommended_at?.toISOString?.() ?? new Date().toISOString(),
      });
    });

    // ── Notificación de stock bajo (si existe en perfil) ─────────────────────
    if (profile?.top_skus && profile.top_skus.length > 0) {
      notificaciones.push({
        id:        `stock-${customer_id}`,
        type:      'stock',
        titulo:    '⚠️ Revisa tu inventario',
        cuerpo:    `Tus productos más vendidos (${profile.top_skus.slice(0, 2).join(', ')}) pueden estar por agotarse.`,
        accion:    'Hablar con agente',
        urgente:   false,
        timestamp: new Date().toISOString(),
      });
    }

    // ── Notificación semanal si no hay otras ─────────────────────────────────
    if (notificaciones.length === 0) {
      notificaciones.push({
        id:        `semanal-${customer_id}`,
        type:      'semanal',
        titulo:    '📅 ¡Nueva semana, nuevas oportunidades!',
        cuerpo:    'Tu agente de crecimiento ya tiene nuevas recomendaciones para ti.',
        accion:    'Ver inicio',
        urgente:   false,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({ customer_id, notificaciones });

  } catch (err) {
    console.error('❌ Error en GET /notifications:', err);
    res.status(500).json({ error: 'Error obteniendo notificaciones.', detail: err.message });
  }
});

module.exports = router;
