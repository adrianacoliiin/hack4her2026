import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Modal, Pressable,
  ActivityIndicator, RefreshControl, TouchableOpacity,
} from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { InsightCard } from '@/components/InsightCard';
import { api, Insight, Rewards } from '@/services/api';
import { useAuth } from '../../api/authContext';

const TIPO_COLOR: Record<string, string> = {
  pedido: '#378ADD',
  promo:  '#7F77DD',
  zona:   '#1D9E75',
};

const TIPO_LABEL: Record<string, string> = {
  pedido: 'Qué pedir',
  promo:  'Promoción',
  zona:   'Tu zona',
};

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const isLogged   = !!user;
  const customerId = user?.customer_id ?? 0;

  const [insights,    setInsights]    = useState<Insight[]>([]);
  const [goalText,    setGoalText]    = useState<string | null>(null);
  const [progressPct, setProgressPct] = useState<number>(0);
  const [rewards,     setRewards]     = useState<Rewards | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [selected,    setSelected]    = useState<Insight | null>(null);

  const load = async () => {
    try {
      const [ins, goal, progress, rw] = await Promise.all([
        api.getInsights(customerId),
        api.getGoal(customerId),
        api.getProgress(customerId),
        api.getRewards(customerId),
      ]);
      setInsights(ins);
      setGoalText(goal?.goal_text ?? null);
      setProgressPct(progress?.semana_actual.tasa_completitud_pct ?? 0);
      setRewards(rw);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isLogged) load();
  }, [isLogged]);

  if (!isLogged) return <Redirect href="/login" />;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Cargando tu panel...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
      >
        {/* Meta activa */}
        {goalText ? (
          <TouchableOpacity style={styles.goalBanner} onPress={() => router.push('/meta')}>
            <Text style={styles.goalLabel}>🎯 Mi meta activa</Text>
            <Text style={styles.goalText}>{goalText}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
            </View>
            <Text style={styles.progressLabel}>{progressPct}% completado esta semana</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.goalBannerEmpty} onPress={() => router.push('/meta')}>
            <Text style={styles.goalEmptyText}>🎯 Define tu meta de negocio</Text>
            <Text style={styles.goalEmptySubtext}>El agente te ayudará a llegar →</Text>
          </TouchableOpacity>
        )}

        {/* Trayectoria de crecimiento */}
        {rewards && (
          <View style={styles.rewardsCard}>
            <View style={styles.rewardsHeader}>
              <Text style={styles.rewardsTitle}>Trayectoria de Crecimiento</Text>
              <View style={styles.rewardsBadge}>
                <Text style={styles.rewardsBadgeText}>
                  {rewards.nivel_emoji} {rewards.nivel}
                </Text>
              </View>
            </View>
            <View style={styles.rewardsRow}>
              <View style={styles.rewardsStat}>
                <Text style={styles.rewardsStatValue}>{rewards.cajas_mes_promedio}</Text>
                <Text style={styles.rewardsStatLabel}>cajas/mes</Text>
              </View>
              <View style={styles.rewardsDivider} />
              <View style={styles.rewardsStat}>
                <Text style={styles.rewardsStatValue}>{rewards.meta_mes}</Text>
                <Text style={styles.rewardsStatLabel}>meta del mes</Text>
              </View>
              {rewards.nivel_descuento > 0 && (
                <>
                  <View style={styles.rewardsDivider} />
                  <View style={styles.rewardsStat}>
                    <Text style={[styles.rewardsStatValue, { color: Colors.success }]}>
                      {rewards.nivel_descuento}%
                    </Text>
                    <Text style={styles.rewardsStatLabel}>descuento</Text>
                  </View>
                </>
              )}
            </View>
            <Text style={styles.rewardsBeneficio}>{rewards.nivel_beneficio}</Text>
            {rewards.nivel_siguiente && (
              <Text style={styles.rewardsNext}>
                Faltan {rewards.cajas_faltantes} cajas para {rewards.nivel_siguiente}
              </Text>
            )}
          </View>
        )}

        {/* Insights */}
        <Text style={styles.sectionTitle}>💡 Para ti hoy</Text>
        {insights.length === 0 ? (
          <Text style={styles.empty}>Sin insights por ahora. Regresa más tarde.</Text>
        ) : (
          insights.map((ins, i) => (
            <InsightCard
              key={i}
              insight={ins}
              onPress={() => setSelected(ins)}
            />
          ))
        )}

        <TouchableOpacity style={styles.chatBtn} onPress={() => router.push('/chat')}>
          <Text style={styles.chatBtnText}>🤖 Hablar con el agente</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de detalle de insight */}
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
                {/* Handle */}
                <View style={styles.modalHandle} />

                {/* Badge de tipo */}
                <View style={[styles.tipoBadge, { backgroundColor: (TIPO_COLOR[selected.tipo] ?? Colors.primary) + '18' }]}>
                  <Text style={[styles.tipoLabel, { color: TIPO_COLOR[selected.tipo] ?? Colors.primary }]}>
                    {TIPO_LABEL[selected.tipo] ?? 'Recomendación'}
                  </Text>
                </View>

                <Text style={styles.modalTitulo}>{selected.titulo}</Text>

                {/* Estrategia / por qué */}
                {selected.estrategia && (
                  <View style={styles.estrategiaBox}>
                    <Text style={styles.estrategiaLabel}>¿Por qué esta recomendación?</Text>
                    <Text style={styles.estrategiaText}>{selected.estrategia}</Text>
                  </View>
                )}

                {/* Acción principal */}
                <View style={styles.accionBox}>
                  <Text style={styles.accionLabel}>Qué hacer hoy</Text>
                  <Text style={styles.accionText}>{selected.accion}</Text>
                </View>

                {/* Pasos */}
                {selected.pasos && selected.pasos.length > 0 && (
                  <View style={styles.pasosBox}>
                    <Text style={styles.pasosLabel}>Pasos para esta semana</Text>
                    {selected.pasos.map((paso, i) => (
                      <View key={i} style={styles.pasoRow}>
                        <View style={styles.pasoNum}>
                          <Text style={styles.pasoNumText}>{i + 1}</Text>
                        </View>
                        <Text style={styles.pasoText}>{paso}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Impacto */}
                <View style={styles.impactoBox}>
                  <Text style={styles.impactoIcon}>📈</Text>
                  <Text style={styles.impactoText}>{selected.impacto}</Text>
                </View>

                {/* CTA al agente */}
                <TouchableOpacity
                  style={styles.modalChatBtn}
                  onPress={() => {
                    setSelected(null);
                    router.push({ pathname: '/chat', params: { prefill: selected.accion } });
                  }}
                >
                  <Text style={styles.modalChatBtnText}>🤖 Preguntarle al agente</Text>
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
  container:    { flex: 1, backgroundColor: Colors.background },
  content:      { padding: 16, paddingBottom: 32 },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText:  { color: Colors.textLight, fontSize: 14 },

  goalBanner: {
    backgroundColor: Colors.primary,
    borderRadius:    14,
    padding:         16,
    marginBottom:    20,
  },
  goalLabel:     { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  goalText:      { color: Colors.white, fontSize: 16, fontWeight: '700', marginBottom: 12 },
  progressBar:   { backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, height: 6, marginBottom: 6 },
  progressFill:  { backgroundColor: Colors.white, borderRadius: 4, height: 6 },
  progressLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },

  goalBannerEmpty: {
    backgroundColor: Colors.card,
    borderRadius:    14,
    borderWidth:     2,
    borderColor:     Colors.primary,
    borderStyle:     'dashed',
    padding:         16,
    marginBottom:    20,
    alignItems:      'center',
  },
  goalEmptyText:    { fontSize: 16, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  goalEmptySubtext: { fontSize: 13, color: Colors.textLight },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  empty:        { color: Colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 20 },

  chatBtn: {
    backgroundColor: Colors.primary,
    borderRadius:    14,
    padding:         16,
    alignItems:      'center',
    marginTop:       8,
  },
  chatBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },

  // Rewards
  rewardsCard: {
    backgroundColor: Colors.card,
    borderRadius:    14,
    borderWidth:     1,
    borderColor:     Colors.border,
    padding:         14,
    marginBottom:    20,
    gap:             10,
  },
  rewardsHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rewardsTitle:     { fontSize: 13, fontWeight: '700', color: Colors.text },
  rewardsBadge:     { backgroundColor: Colors.primary + '15', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  rewardsBadgeText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  rewardsRow:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rewardsStat:      { alignItems: 'center', flex: 1 },
  rewardsStatValue: { fontSize: 22, fontWeight: '800', color: Colors.text },
  rewardsStatLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  rewardsDivider:   { width: 1, height: 32, backgroundColor: Colors.border },
  rewardsBeneficio: { fontSize: 12, color: Colors.textLight, fontStyle: 'italic' },
  rewardsNext:      { fontSize: 12, fontWeight: '600', color: Colors.primary },

  // Modal
  modalOverlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent:  'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius:  20,
    borderTopRightRadius: 20,
    padding:         24,
    paddingBottom:   36,
    gap:             14,
  },
  modalHandle: {
    width:           40,
    height:          4,
    backgroundColor: Colors.border,
    borderRadius:    2,
    alignSelf:       'center',
    marginBottom:    4,
  },

  tipoBadge:  { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  tipoLabel:  { fontSize: 12, fontWeight: '700' },

  modalTitulo: { fontSize: 20, fontWeight: '800', color: Colors.text, lineHeight: 26 },

  estrategiaBox:  { backgroundColor: '#F0F7FF', borderRadius: 10, padding: 12, gap: 4 },
  estrategiaLabel:{ fontSize: 11, fontWeight: '700', color: '#378ADD', textTransform: 'uppercase', letterSpacing: 0.5 },
  estrategiaText: { fontSize: 13, color: Colors.text, lineHeight: 19 },

  accionBox:  { backgroundColor: Colors.background, borderRadius: 10, padding: 12, gap: 4 },
  accionLabel:{ fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  accionText: { fontSize: 14, color: Colors.text, fontWeight: '600', lineHeight: 20 },

  pasosBox:  { gap: 8 },
  pasosLabel:{ fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  pasoRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  pasoNum: {
    width:           22,
    height:          22,
    borderRadius:    11,
    backgroundColor: Colors.primary,
    justifyContent:  'center',
    alignItems:      'center',
    flexShrink:      0,
    marginTop:       1,
  },
  pasoNumText: { fontSize: 11, fontWeight: '800', color: Colors.white },
  pasoText:    { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 19 },

  impactoBox: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             8,
    backgroundColor: Colors.success + '12',
    borderRadius:    10,
    padding:         10,
  },
  impactoIcon: { fontSize: 18 },
  impactoText: { fontSize: 13, color: Colors.success, fontWeight: '700', flex: 1 },

  modalChatBtn: {
    backgroundColor: Colors.primary,
    borderRadius:    14,
    padding:         14,
    alignItems:      'center',
    marginTop:       4,
  },
  modalChatBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },

  modalCloseBtn:     { alignItems: 'center', padding: 8 },
  modalCloseBtnText: { fontSize: 14, color: Colors.textMuted },
});
