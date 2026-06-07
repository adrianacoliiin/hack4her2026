const { getDB } = require('../db/mongo');

// ── Implementaciones reales de cada tool ─────────────────────────────────────

async function get_customer_profile({ customer_id }) {
  const db      = getDB();
  const profile = await db.collection('customer_profiles')
    .findOne({ customer_id: Number(customer_id) }, { projection: { _id: 0 } });

  if (!profile) return { error: `Cliente ${customer_id} no encontrado.` };

  return {
    customer_id:             profile.customer_id,
    total_pedidos:           profile.total_pedidos,
    pedidos_entregados:      profile.pedidos_entregados,
    ticket_promedio:         profile.ticket_promedio,
    ticket_max:              profile.ticket_max,
    tasa_entrega_pct:        profile.tasa_entrega,
    cedis:                   profile.cedis,
    business_unit_principal: profile.business_unit_principal,
    top_skus:                profile.top_skus || [],
    pais:                    profile.pais,
  };
}

async function get_zone_benchmark({ cedis }) {
  const db   = getDB();
  const zone = await db.collection('zone_benchmarks')
    .findOne({ cedis: String(cedis) }, { projection: { _id: 0 } });

  if (!zone) return { error: `No hay datos para el cedis ${cedis}.` };

  return {
    cedis:                zone.cedis,
    total_clientes:       zone.total_clientes,
    total_pedidos:        zone.total_pedidos,
    ticket_promedio_zona: zone.ticket_promedio_zona,
    business_unit_top:    zone.business_unit_top,
    top_skus_zona:        zone.top_skus_zona || [],
  };
}

async function get_substitutions({ sku_nombre }) {
  const db  = getDB();
  // Búsqueda por nombre parcial (case-insensitive)
  const doc = await db.collection('substitution_map')
    .findOne(
      { nombre_sku_solicitado: { $regex: sku_nombre, $options: 'i' } },
      { projection: { _id: 0 } }
    );

  if (!doc) return { message: `Sin sustituciones registradas para "${sku_nombre}".` };

  // Ordenar sustitutos por frecuencia desc
  const sustitutos = (doc.sustitutos || [])
    .sort((a, b) => b.veces - a.veces)
    .slice(0, 3);

  return {
    sku_original: doc.nombre_sku_solicitado,
    sustitutos,
  };
}

async function get_top_products({ limit = 10 }) {
  const db   = getDB();
  const skus = await db.collection('sku_catalog')
    .find({}, { projection: { _id: 0 } })
    .sort({ total_vendido: -1 })
    .limit(Number(limit))
    .toArray();

  return { top_productos: skus };
}

// ── Mapa nombre → función ─────────────────────────────────────────────────────
const TOOL_FUNCTIONS = {
  get_customer_profile,
  get_zone_benchmark,
  get_substitutions,
  get_top_products,
};

// ── Definiciones para Gemini (function calling) ───────────────────────────────
const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'get_customer_profile',
      description: 'Obtiene el perfil real de compra de un cliente: historial, ticket promedio, productos favoritos y zona.',
      parameters: {
        type: 'object',
        properties: {
          customer_id: { type: 'number', description: 'ID numérico del cliente en Tuali.' },
        },
        required: ['customer_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_zone_benchmark',
      description: 'Obtiene estadísticas de la zona del cliente: productos más vendidos en su cedis y ticket promedio de vecinos.',
      parameters: {
        type: 'object',
        properties: {
          cedis: { type: 'string', description: 'ID del CEDIS del cliente.' },
        },
        required: ['cedis'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_substitutions',
      description: 'Devuelve los sustitutos históricos de un producto cuando no está disponible.',
      parameters: {
        type: 'object',
        properties: {
          sku_nombre: { type: 'string', description: 'Nombre parcial o completo del producto.' },
        },
        required: ['sku_nombre'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_top_products',
      description: 'Devuelve los productos más vendidos del catálogo de Tuali.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Cuántos productos retornar (default 10).' },
        },
        required: [],
      },
    },
  },
];

module.exports = { TOOL_DEFINITIONS, TOOL_FUNCTIONS };
