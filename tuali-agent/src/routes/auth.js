const express = require('express');
const router  = express.Router();
const { getDB } = require('../db/mongo');

// Definición fija de los 3 demo users — customer_id se resuelve desde BD al primer login
const DEMO_PERSONAS = [
  {
    email:          'fernanda@tuali.com',
    password:       '123456',
    name:           'Fernanda López',
    persona_type:   'eficiencia',
    // Platino/Oro: muchos pedidos entregados, alto ticket
    query:          { pedidos_entregados: { $gte: 5 }, ticket_promedio: { $gte: 1500 } },
  },
  {
    email:          'rosario@tuali.com',
    password:       '123456',
    name:           'Rosario Méndez',
    persona_type:   'familiar',
    // Plata: pedidos medios, ticket medio
    query:          { pedidos_entregados: { $gte: 2, $lte: 4 }, ticket_promedio: { $gte: 800, $lte: 1500 } },
  },
  {
    email:          'raul@tuali.com',
    password:       '123456',
    name:           'Raúl Torres',
    persona_type:   'asistido',
    // Bronce: pocos pedidos, ticket bajo
    query:          { pedidos_entregados: { $lte: 2 }, ticket_promedio: { $lte: 800 } },
  },
];

// Cache en memoria: se resuelve una sola vez por arranque del servidor
const resolvedIds = {};

async function resolveCustomerId(persona) {
  if (resolvedIds[persona.email]) return resolvedIds[persona.email];

  const db      = getDB();
  const profile = await db.collection('customer_profiles')
    .findOne(persona.query, { projection: { customer_id: 1, _id: 0 } });

  const id = profile?.customer_id ?? null;
  resolvedIds[persona.email] = id;
  return id;
}

/**
 * POST /auth/login
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email y password son requeridos.' });
  }

  const persona = DEMO_PERSONAS.find(
    p => p.email.toLowerCase() === email.toLowerCase() && p.password === password
  );

  if (!persona) {
    return res.status(401).json({ error: 'Credenciales incorrectas.' });
  }

  try {
    const customer_id = await resolveCustomerId(persona);

    if (!customer_id) {
      return res.status(500).json({ error: 'No se encontró un perfil para este usuario demo.' });
    }

    res.json({
      name:          persona.name,
      email:         persona.email,
      persona_type:  persona.persona_type,
      customer_id,
      role:          'user',
    });

  } catch (err) {
    console.error('❌ Error en /auth/login:', err);
    res.status(500).json({ error: 'Error en login.', detail: err.message });
  }
});

module.exports = router;
