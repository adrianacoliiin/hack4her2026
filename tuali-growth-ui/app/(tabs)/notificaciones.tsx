import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Modal, Pressable,
  TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors }   from '@/constants/Colors';
import { api } from '@/services/api';
import { useAuth } from '../../api/authContext';
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

const NAV_DESTINO: Record<string, string> = {
  delivery: 'Ver progreso',
  meta:     'Ver progreso',
  stock:    'Hablar con agente',
  semanal:  'Ir al inicio',
};

export default function NotificacionesScreen() {
  const router     = useRouter();
  const { user }   = useAuth();
  const customerId = user?.customer_id ?? 0;

  const [notifs,      setNotifs]      = useState<Notif[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [permGranted, setPermGranted] = useState(false);
  const [selected,    setSelected]    = useState<Notif | null>(null);

  const setup = useCallback(async () => {
    const granted = await requestNotificationPermissions();
    setPermGranted(granted);
    if (granted) await scheduleWeeklyReminder();
    await load();
  }, []);

  const load = async () => {
    try {
      const res  = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/notifications/${customerId}`);
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

  const handleTap = (notif: Notif) => {
    // Las recomendaciones del agente abren el detalle; el resto navega directo
    if (notif.type === 'agente') {
      setSelected(notif);
    } else if (notif.type === 'delivery' || notif.type === 'meta') {
      router.push('/progreso');
    } else if (notif.type === 'stock') {
      setSelected(notif);
    } else {
      router.push('/');
    }
  };

  const navigateFromModal = (notif: Notif) => {
    setSelected(null);
    if (notif.type === 'agente' || notif.type === 'stock') {
      router.push({ pathname: '/chat', params: { prefill: notif.cuerpo } });
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={notifs}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />
        }
        ListHeaderComponent={() => (
          <View style={styles.header}>
            <View style={[styles.permBanner, { backgroundColor: permGranted ? Colors.success : Colors.warning }]}>
              <Text style={styles.permText}>
                {permGranted ? '🔔 Notificaciones activas' : '⚠️ Activa las notificaciones para recibir alertas'}
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Demo: Simular notificaciones</Text>
            <View style={styles.demoRow}>
              <TouchableOpacity style={styles.demoBtn} onPress={() => notifyDeliveryNearby(15)}>
                <Text style={styles.demoBtnText}>🚚 Entrega cercana</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.demoBtn} onPress={() => notifyDeliveryCompleted()}>
                <Text style={styles.demoBtnText}>📦 Entregado</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.demoBtn} onPress={() => notifyNewRecommendation('Esta semana agrega Coca-Cola 2L a tu pedido. Tus vecinos la venden el doble que tú.')}>
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
            onPress={() => handleTap(item)}
          >
            <View style={[styles.iconBadge, { backgroundColor: TYPE_COLOR[item.type] + '20' }]}>
              <Text style={styles.iconText}>{TYPE_ICON[item.type] ?? '📌'}</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitulo}>{item.titulo}</Text>
              <Text style={styles.cardCuerpo}>{item.cuerpo}</Text>
              <Text style={[styles.cardAccion, { color: TYPE_COLOR[item.type] }]}>
                {item.type === 'agente' || item.type === 'stock' ? 'Ver recomendación →' : `${item.accion} →`}
              </Text>
            </View>
            {item.urgente && <View style={styles.urgenteDot} />}
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.content}
      />

      {/* Modal de detalle para recomendaciones */}
      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelected(null)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            {selected && (
              <>
                <View style={styles.modalHandle} />

                <View style={[styles.tipoBadge, { backgroundColor: (TYPE_COLOR[selected.type] ?? Colors.primary) + '18' }]}>
                  <Text style={[styles.tipoLabel, { color: TYPE_COLOR[selected.type] ?? Colors.primary }]}>
                    {TYPE_ICON[selected.type] ?? '📌'} {selected.type === 'agente' ? 'Recomendación del agente' : 'Alerta de stock'}
                  </Text>
                </View>

                <Text style={styles.modalTitulo}>{selected.titulo}</Text>

                <View style={styles.recBox}>
                  <Text style={styles.recLabel}>Qué hacer</Text>
                  <Text style={styles.recText}>{selected.cuerpo}</Text>
                </View>

                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: TYPE_COLOR[selected.type] ?? Colors.primary }]}
                  onPress={() => navigateFromModal(selected)}
                >
                  <Text style={styles.modalBtnText}>🤖 Hablar con el agente sobre esto</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelected(null)}>
                  <Text style={styles.modalCloseBtnText}>Cerrar</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 32 },
  header:  { marginBottom: 8 },

  permBanner:  { borderRadius: 10, padding: 10, marginBottom: 16, alignItems: 'center' },
  permText:    { color: Colors.white, fontSize: 13, fontWeight: '600' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 10, marginTop: 4 },

  demoRow: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  demoBtn: {
    backgroundColor: Colors.card, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  demoBtnText: { fontSize: 12, color: Colors.text, fontWeight: '500' },
  empty:       { color: Colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 12 },

  card: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start',
    gap: 12, borderWidth: 1, borderColor: Colors.border,
  },
  cardUrgente:  { borderColor: Colors.primary, borderWidth: 1.5 },
  iconBadge:    { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  iconText:     { fontSize: 22 },
  cardContent:  { flex: 1 },
  cardTitulo:   { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 3 },
  cardCuerpo:   { fontSize: 12, color: Colors.textLight, lineHeight: 17, marginBottom: 6 },
  cardAccion:   { fontSize: 12, fontWeight: '600' },
  urgenteDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: 4, flexShrink: 0 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet:   {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 36, gap: 14,
  },
  modalHandle:  { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  tipoBadge:    { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  tipoLabel:    { fontSize: 12, fontWeight: '700' },
  modalTitulo:  { fontSize: 20, fontWeight: '800', color: Colors.text, lineHeight: 26 },
  recBox:       { backgroundColor: Colors.background, borderRadius: 10, padding: 14, gap: 4 },
  recLabel:     { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  recText:      { fontSize: 14, color: Colors.text, lineHeight: 21 },
  modalBtn:     { borderRadius: 14, padding: 14, alignItems: 'center' },
  modalBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  modalCloseBtn:    { alignItems: 'center', padding: 8 },
  modalCloseBtnText:{ fontSize: 14, color: Colors.textMuted },
});
