// Cambia esta URL por la de tu backend (local o Vultr)
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

// Para pruebas usa uno de los customer_ids reales del CSV
export const DEMO_CUSTOMER_ID = 7539780000000000000;

// ── Tipos ─────────────────────────────────────────────────────────────────────
export type Insight = {
  titulo:     string;
  accion:     string;
  impacto:    string;
  tipo:       'pedido' | 'promo' | 'zona';
  estrategia?: string;
  pasos?:      string[];
};

export type Message = {
  role:    'user' | 'assistant';
  content: string;
};

export type Goal = {
  goal_id:    string;
  goal_text:  string;
  goal_type:  string;
  status:     string;
  created_at: string;
  baseline_ticket: number;
  progreso: {
    total_acciones:       number;
    acciones_completadas: number;
    acciones_pendientes:  number;
    tasa_completitud_pct: number;
  };
  ultimas_acciones: Action[];
};

export type Action = {
  action_id:      string;
  recommendation: string;
  action_type:    string;
  status:         'pending' | 'completed' | 'skipped';
  recommended_at: string;
  completed_at:   string | null;
};

export type RankingEntry = {
  posicion:       number;
  nombre:         string;
  cajas_mes:      number;
  es_usuario:     boolean;
  pct_del_lider:  number;
};

export type Ranking = {
  cedis:               string;
  total_tiendas_zona:  number;
  mi_posicion:         number | null;
  ranking:             RankingEntry[];
};

export type Rewards = {
  cajas_mes_promedio: number;
  meta_mes:           number;
  nivel:              string;
  nivel_emoji:        string;
  nivel_beneficio:    string;
  nivel_descripcion:  string;
  nivel_descuento:    number;
  nivel_siguiente:    string | null;
  cajas_faltantes:    number;
};

export type Progress = {
  meta_activa: string;
  semana_actual: {
    total_recomendaciones: number;
    completadas:           number;
    pendientes:            number;
    tasa_completitud_pct:  number;
    mensaje:               string;
  };
};

// ── API calls ─────────────────────────────────────────────────────────────────
export const api = {

  // Insights proactivos al abrir la app
  getInsights: async (customerId: number): Promise<Insight[]> => {
    const res  = await fetch(`${BASE_URL}/insights/${customerId}`);
    const data = await res.json();
    return data.insights || [];
  },

  // Enviar mensaje al agente
  sendMessage: async (
    customerId:  number,
    message:     string,
    history:     Message[],
    goal?:       string,
    personaType?: string,
  ): Promise<{ reply: string; goal_id?: string }> => {
    const res = await fetch(`${BASE_URL}/chat`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ customer_id: customerId, message, history, goal, persona_type: personaType }),
    });
    return res.json();
  },

  // Obtener meta activa
  getGoal: async (customerId: number): Promise<Goal | null> => {
    const res = await fetch(`${BASE_URL}/goals/${customerId}`);
    if (res.status === 404) return null;
    return res.json();
  },

  // Crear o actualizar meta
  setGoal: async (
    customerId:  number,
    goalText:    string,
    goalType:    string,
    targetValue: number,
  ): Promise<{ goal_id: string }> => {
    const res = await fetch(`${BASE_URL}/goals`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        customer_id:  customerId,
        goal_text:    goalText,
        goal_type:    goalType,
        target_value: targetValue,
      }),
    });
    return res.json();
  },

  // Obtener acciones pendientes
  getActions: async (customerId: number, status?: string): Promise<Action[]> => {
    const query = status ? `?status=${status}` : '';
    const res   = await fetch(`${BASE_URL}/actions/${customerId}${query}`);
    const data  = await res.json();
    return data.acciones || [];
  },

  // Marcar acción como completada o saltada
  updateAction: async (
    actionId: string,
    status:   'completed' | 'skipped',
    feedback?: string,
  ): Promise<void> => {
    await fetch(`${BASE_URL}/actions/${actionId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status, feedback }),
    });
  },

  // Conteo de notificaciones (para badge)
  getNotifCount: async (customerId: number): Promise<number> => {
    try {
      const res  = await fetch(`${BASE_URL}/notifications/${customerId}`);
      const data = await res.json();
      return (data.notificaciones ?? []).length;
    } catch {
      return 0;
    }
  },

  // Ranking de la zona
  getRanking: async (customerId: number): Promise<Ranking | null> => {
    const res = await fetch(`${BASE_URL}/ranking/${customerId}`);
    if (!res.ok) return null;
    return res.json();
  },

  // Puntos de recompensa
  getRewards: async (customerId: number): Promise<Rewards | null> => {
    const res = await fetch(`${BASE_URL}/rewards/${customerId}`);
    if (!res.ok) return null;
    return res.json();
  },

  // Progreso semanal
  getProgress: async (customerId: number): Promise<Progress | null> => {
    const res = await fetch(`${BASE_URL}/actions/progress/${customerId}`);
    if (!res.ok) return null;
    return res.json();
  },
};
