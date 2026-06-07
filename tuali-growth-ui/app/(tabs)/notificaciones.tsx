import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors }   from '@/constants/Colors';
import { api, DEMO_CUSTOMER_ID } from '@/services/api';
import {
  requestNotificationPermissions,
  notifyDeliveryNearby,
  notifyDeliveryCompleted,
  notifyNewRecommendation,
  scheduleWeeklyReminder,
} from '@/services/notifications';

type Notif = {
  id:        string;
  type:      string;
  titulo:    string;
  cuerpo:    string;
  accion:    string;
  urgente:   boolean;
  timestamp: string;
};

const TYPE_ICON: Record<string, string> = {
  delivery: '🚚',
  agente:   '🤖',
  meta:     '🎯',
  stock:    '⚠️',
  semanal:  '📅',
};

const TYPE_COLOR: Record<string, string> = {
  delivery: '#E8001A',
  agente:   '#378ADD',
  meta:     '#1D9E75',
  stock:    '#F5A623',
  semanal:  '#7F77DD',
};

export default function NotificacionesScreen() {
  const router = useRouter();
  const [notifs,      setNotifs]      = useState<Notif[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [permGranted, setPermGranted] = useState(false);

  const setup = useCallback(async () => {
    const granted = await requestNotificationPermissions();
    setPermGranted(granted);
    if (granted) await scheduleWeeklyReminder();
    await load();
  }, []);

  const load = async () => {
    try {
      const res  = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/notifications/${DEMO_CUSTOMER_ID}`
      );
      const data = await res.json();
      setNotifs(data.notificaciones || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { setup(); }, []);

  const onRefresh = () => { setRefreshing(true); load(); };

  const handleAction = (notif: Notif) => {
    if (notif.type === 'delivery') router.push('/progreso');
    else if (notif.type === 'agente') router.push('/chat');
    else if (notif.type === 'meta')   router.push('/progreso');
    else if (notif.type === 'stock')  router.push('/chat');
    else router.push('/');
  };

  // ── Demo buttons ────────────────────────────────────────────────────────────
  const simulateDeliveryNearby = async () => {
    await notifyDeliveryNearby(15);
  };

  const simulateDeliveryDone = async () => {
    await notifyDeliveryCompleted();
  };

  const simulateAgentRec = async () => {
    await notifyNewRecommendation(
      'Esta semana agrega Coca-Cola 2L a tu pedido. Tus vecinos la venden el doble que tú.'
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={notifs}
      keyExtractor={item => item.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }
      ListHeaderComponent={() => (
        <View style={styles.header}>
          {/* Estado de permisos */}
          <View style={[styles.permBanner, { backgroundColor: permGranted ? Colors.success : Colors.warning }]}>
            <Text style={styles.permText}>
              {permGranted ? '🔔 Notificaciones activas' : '⚠️ Activa las notificaciones para recibir alertas'}
            </Text>
          </View>

          {/* Botones de demo */}
          <Text style={styles.sectionTitle}>Demo: Simular notificaciones</Text>
          <View style={styles.demoRow}>
            <TouchableOpacity style={styles.demoBtn} onPress={simulateDeliveryNearby}>
              <Text style={styles.demoBtnText}>🚚 Entrega cercana</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.demoBtn} onPress={simulateDeliveryDone}>
              <Text style={styles.demoBtnText}>📦 Entregado</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.demoBtn} onPress={simulateAgentRec}>
              <Text style={styles.demoBtnText}>💡 Agente</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Tus notificaciones</Text>
          {notifs.length === 0 && (
            <Text style={styles.empty}>No tienes notificaciones pendientes.</Text>
          )}
        </View>
      )}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.card, item.urgente && styles.cardUrgente]}
          onPress={() => handleAction(item)}
        >
          <View style={[styles.iconBadge, { backgroundColor: TYPE_COLOR[item.type] + '20' }]}>
            <Text style={styles.iconText}>{TYPE_ICON[item.type] ?? '📌'}</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitulo}>{item.titulo}</Text>
            <Text style={styles.cardCuerpo}>{item.cuerpo}</Text>
            <Text style={[styles.cardAccion, { color: TYPE_COLOR[item.type] }]}>
              {item.accion} →
            </Text>
          </View>
          {item.urgente && <View style={styles.urgenteDot} />}
        </TouchableOpacity>
      )}
      contentContainerStyle={styles.content}
    />
  );
}

const styles = StyleSheet.create({
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 32 },

  header: { marginBottom: 8 },

  permBanner: {
    borderRadius:  10,
    padding:       10,
    marginBottom:  16,
    alignItems:    'center',
  },
  permText: { color: Colors.white, fontSize: 13, fontWeight: '600' },

  sectionTitle: {
    fontSize:     16,
    fontWeight:   '700',
    color:        Colors.text,
    marginBottom: 10,
    marginTop:    4,
  },

  demoRow: {
    flexDirection:  'row',
    gap:            8,
    marginBottom:   20,
    flexWrap:       'wrap',
  },
  demoBtn: {
    backgroundColor:  Colors.card,
    borderRadius:     10,
    borderWidth:      1,
    borderColor:      Colors.border,
    paddingHorizontal: 12,
    paddingVertical:   8,
  },
  demoBtnText: { fontSize: 12, color: Colors.text, fontWeight: '500' },

  empty: { color: Colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 12 },

  card: {
    backgroundColor: Colors.card,
    borderRadius:    14,
    padding:         14,
    marginBottom:    10,
    flexDirection:   'row',
    alignItems:      'flex-start',
    gap:             12,
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  cardUrgente: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },
  iconBadge: {
    width:         44,
    height:        44,
    borderRadius:  22,
    justifyContent:'center',
    alignItems:    'center',
    flexShrink:    0,
  },
  iconText:     { fontSize: 22 },
  cardContent:  { flex: 1 },
  cardTitulo:   { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 3 },
  cardCuerpo:   { fontSize: 12, color: Colors.textLight, lineHeight: 17, marginBottom: 6 },
  cardAccion:   { fontSize: 12, fontWeight: '600' },
  urgenteDot: {
    width:        8,
    height:       8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop:    4,
    flexShrink:   0,
  },
});